import { applySecurityHeaders, appBaseUrl, clientIp } from './_lib/http.js';
import { requireUser, isAdmin } from './_lib/auth.js';
import { enforceRateLimit } from './_lib/rateLimit.js';
import db from './_lib/db.js';
import { createCashfreeOrder } from './_lib/cashfree.js';
import { reconcileOrder } from './_lib/settlement.js';
import { reserveStock, releaseStock, syncProductStockDisplay } from './_lib/inventory.js';
import { writeAudit } from './_lib/audit.js';
import { PaymentState, FulfillmentState, assertFulfillmentTransition } from './_lib/state.js';
import { sanitizeCustomer, validateCustomer, normalizeCartItems, itemHash, makeOrderNumber } from './_lib/validation.js';



// Hard deadline (ms) the checkout() call must complete within.
// Set FUNCTION_DEADLINE_MS in env to match your actual platform cap minus ~2 s
// headroom so we can always send a JSON response before the platform kills us.
const FUNCTION_DEADLINE_MS = Math.max(3000, Number(process.env.FUNCTION_DEADLINE_MS || 9000));

async function attachItems(orders) {
  if (!orders.length) return [];
  const result = [];
  for (const order of orders) {
    const items = await db.getOrderItems(order.id);
    result.push({ ...order, items });
  }
  return result;
}

function publicOrder(order) {
  if (!order) return order;
  const { payment_session_id, ...safe } = order;
  return {
    ...safe,
    payment_session_id: payment_session_id || undefined,
  };
}

async function authoritativeCart(items) {
  const normalized = normalizeCartItems(items);
  if (!normalized.length) {
    const err = new Error('Your cart is empty');
    err.status = 400;
    throw err;
  }
  const products = await db.getProducts([...new Set(normalized.map((item) => item.productId))]);
  const lineItems = [];
  for (const cartItem of normalized) {
    const product = products.find((entry) => entry.id === cartItem.productId);
    if (!product) {
      const err = new Error('A product in your cart is no longer available');
      err.status = 400;
      throw err;
    }
    const sizes = Array.isArray(product.sizes) ? product.sizes.map(String) : [];
    if (!sizes.includes(cartItem.size)) {
      const err = new Error(`Select a valid size for ${product.name}`);
      err.status = 400;
      throw err;
    }
    lineItems.push({
      product,
      productId: product.id,
      size: cartItem.size,
      quantity: cartItem.quantity,
      mrp: Number(product.mrp),
      sale_price: Number(product.sale_price),
    });
  }
  const mrpTotal = lineItems.reduce((sum, item) => sum + item.mrp * item.quantity, 0);
  const subtotal = lineItems.reduce((sum, item) => sum + item.sale_price * item.quantity, 0);
  const shipping = subtotal >= 3000 ? 0 : 149;
  return {
    lineItems,
    totals: {
      mrp_total: mrpTotal,
      discount_total: mrpTotal - subtotal,
      shipping_total: shipping,
      total: subtotal + shipping,
    },
  };
}

async function checkout(req, res, user) {
  const body = req.body || {};
  const customer = sanitizeCustomer(body.customer);
  const customerError = validateCustomer(customer);
  if (customerError) return res.status(400).json({ error: customerError });
  if (body.total != null || body.amount != null || body.price != null) {
    // Frontend totals are ignored. Authoritative amounts are recalculated below.
  }

  let cart;
  try {
    cart = await authoritativeCart(body.items);
  } catch (error) {
    return res.status(error.status || 400).json({ error: error.message });
  }

  const idempotencyKey = String(
    req.headers['x-idempotency-key'] || body.idempotency_key || '',
  ).trim().slice(0, 80);
  const fingerprint = `${user.id}:${itemHash(cart.lineItems)}:${customer.email}:${customer.address.postal_code}`;
  const key = idempotencyKey || fingerprint;

  const existing = await db.getOrderByIdempotency(key);
  if (existing) {
    if (existing.user_id !== user.id) return res.status(403).json({ error: 'This checkout belongs to another account' });
    const items = await db.getOrderItems(existing.id);
    return res.status(200).json({
      ...publicOrder(existing),
      items,
      reused: true,
      payment_session_id: existing.payment_session_id,
      cashfree_mode: existing.cf_environment || 'SANDBOX',
    });
  }

  let reserved = [];
  let order;
  try {
    reserved = await reserveStock(db, cart.lineItems);
    await syncProductStockDisplay(db, cart.lineItems.map((item) => item.productId));

    const orderNumber = makeOrderNumber();
    order = await db.insertOrder({
      order_number: orderNumber,
      user_id: user.id,
      email: customer.email,
      customer_name: customer.full_name,
      phone: customer.phone,
      address: customer.address,
      payment_method: 'UPI',
      payment_status: PaymentState.CREATED,
      status: FulfillmentState.Pending,
      currency: 'INR',
      mrp_total: cart.totals.mrp_total,
      discount_total: cart.totals.discount_total,
      shipping_total: cart.totals.shipping_total,
      total: cart.totals.total,
      version: 1,
      idempotency_key: key,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const claimed = await db.insertIdempotency({
      key,
      user_id: user.id,
      order_id: order.id,
      created_at: new Date().toISOString(),
    });
    if (!claimed) {
      await releaseStock(db, reserved);
      await db.updateOrder(order.id, order.version, {
        payment_status: PaymentState.CANCELLED,
        status: FulfillmentState.Cancelled,
        version: order.version + 1,
        failure_reason: 'duplicate_checkout',
        updated_at: new Date().toISOString(),
      });
      const winner = await db.getOrderByIdempotency(key);
      if (winner) {
        const items = await db.getOrderItems(winner.id);
        return res.status(200).json({ ...publicOrder(winner), items, reused: true });
      }
      return res.status(409).json({ error: 'Duplicate checkout in progress. Refresh and try again.' });
    }

    await db.insertOrderItems(cart.lineItems.map(({ product, size, quantity, mrp, sale_price }) => ({
      order_id: order.id,
      product_id: product.id,
      brand: product.brand,
      product_name: product.name,
      image: product.images?.[0] || '',
      size,
      quantity,
      mrp,
      sale_price,
    })));

    const pending = await db.updateOrder(order.id, order.version, {
      payment_status: PaymentState.PAYMENT_PENDING,
      version: order.version + 1,
      updated_at: new Date().toISOString(),
    });
    order = pending || { ...order, payment_status: PaymentState.PAYMENT_PENDING, version: order.version + 1 };

    await writeAudit(db, {
      actorId: user.id,
      actorRole: 'customer',
      action: 'CHECKOUT_CREATED',
      entityType: 'order',
      entityId: order.id,
      orderId: order.id,
      toState: PaymentState.PAYMENT_PENDING,
      metadata: { total: order.total, items: cart.lineItems.length },
    });
  } catch (error) {
    if (reserved.length) {
      try { await releaseStock(db, reserved); } catch { /* rollback best-effort */ }
    }
    if (error.code === 'OUT_OF_STOCK' || error.code === 'STOCK_RACE' || error.code === 'STOCK_MISSING') {
      return res.status(409).json({ error: error.message });
    }
    throw error;
  }

  const origin = appBaseUrl(req);
  let cashfree;
  try {
    console.error('Cashfree create-order start', {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.total,
      maxDuration: 15,
    });
    cashfree = await createCashfreeOrder({
      orderId: order.order_number,
      amount: order.total,
      currency: 'INR',
      customer: { id: user.id, full_name: customer.full_name, email: customer.email, phone: customer.phone },
      returnUrl: `${origin}/order-confirmation/${order.id}?order_id={order_id}`,
      notifyUrl: `${origin}/api/cashfree-webhook`,
      note: `SOLEVAULT ${order.order_number}`,
    });
    console.error('Cashfree create-order ok', {
      orderId: order.id,
      mock: Boolean(cashfree?.mock),
      hasSession: Boolean(cashfree?.payment_session_id),
    });
  } catch (error) {
    console.error('Cashfree create-order failed:', {
      orderId: order.id,
      orderNumber: order.order_number,
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: error?.message,
    });
    if (!res.headersSent) {
      res.status(502).json({ error: 'Unable to start UPI checkout. Please try again.' });
    }
    try {
      await releaseStock(db, reserved);
    } catch (cleanupError) {
      console.error('releaseStock after Cashfree fail:', cleanupError?.message);
    }
    try {
      await db.updateOrder(order.id, order.version, {
        payment_status: PaymentState.FAILED,
        failure_reason: 'cashfree_create_failed',
        version: order.version + 1,
        updated_at: new Date().toISOString(),
      });
    } catch (cleanupError) {
      console.error('updateOrder after Cashfree fail:', cleanupError?.message);
    }
    try {
      await writeAudit(db, {
        actorId: user.id,
        actorRole: 'customer',
        action: 'CASHFREE_CREATE_FAILED',
        entityType: 'order',
        entityId: order.id,
        orderId: order.id,
        metadata: { message: error.message, code: error.code },
      });
    } catch (cleanupError) {
      console.error('writeAudit after Cashfree fail:', cleanupError?.message);
    }
    return;
  }

  try {
    const patched = await db.updateOrder(order.id, order.version, {
      cf_order_id: String(cashfree.cf_order_id || ''),
      payment_session_id: cashfree.payment_session_id,
      cf_environment: cashfree.mock ? 'MOCK' : (process.env.CASHFREE_ENV || 'SANDBOX'),
      version: order.version + 1,
      updated_at: new Date().toISOString(),
    });
    order = patched || { ...order, cf_order_id: String(cashfree.cf_order_id || ''), payment_session_id: cashfree.payment_session_id };
  } catch (persistError) {
    console.error('updateOrder after Cashfree success:', persistError?.message);
    order = { ...order, cf_order_id: String(cashfree.cf_order_id || ''), payment_session_id: cashfree.payment_session_id };
  }

  try {
    await db.insertCfOrderMap({
      cf_order_id: String(cashfree.cf_order_id || order.order_number),
      order_id: order.id,
      user_id: user.id,
      created_at: new Date().toISOString(),
    });
  } catch (persistError) {
    console.error('insertCfOrderMap after Cashfree success:', persistError?.message);
  }
  try {
    await db.insertAttempt({
      order_id: order.id,
      user_id: user.id,
      provider: 'cashfree',
      method: 'upi',
      status: 'CREATED',
      amount: order.total,
      currency: 'INR',
      cf_order_id: String(cashfree.cf_order_id || ''),
      payment_session_id: cashfree.payment_session_id,
      created_at: new Date().toISOString(),
    });
  } catch (persistError) {
    console.error('insertAttempt after Cashfree success:', persistError?.message);
  }

  let items = [];
  try {
    items = await db.getOrderItems(order.id);
  } catch (persistError) {
    console.error('getOrderItems after Cashfree success:', persistError?.message);
  }
  return res.status(201).json({
    ...publicOrder(order),
    items,
    payment_session_id: cashfree.payment_session_id,
    cashfree_mode: cashfree.mock ? 'MOCK' : (process.env.CASHFREE_ENV || 'SANDBOX'),
    payment_methods: ['upi'],
  });
}

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, POST, PUT, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const adminView = req.query?.admin === 'true' && await isAdmin(user);
      if (req.query?.id) {
        let order = await db.getOrder(req.query.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (!adminView && order.user_id !== user.id) return res.status(404).json({ error: 'Order not found' });

        if (order.payment_status === PaymentState.PAYMENT_PENDING) {
          try {
            await reconcileOrder(db, order, 'auto_get_order');
            order = (await db.getOrder(order.id)) || order;
          } catch (recErr) {
            console.error('Auto reconcile on GET /api/orders error:', recErr?.message);
          }
        }

        const [items, payments, refunds] = await Promise.all([
          db.getOrderItems(order.id),
          db.listPayments(order.id),
          db.listRefunds(order.id),
        ]);
        return res.status(200).json({ ...publicOrder(order), items, payments, refunds });
      }
      let rows = await db.listOrders({ userId: user.id, admin: adminView });
      
      // Auto-reconcile pending orders in recent list
      const pendingRows = rows.filter((r) => r.payment_status === PaymentState.PAYMENT_PENDING).slice(0, 3);
      if (pendingRows.length) {
        await Promise.allSettled(pendingRows.map((r) => reconcileOrder(db, r, 'auto_list_orders')));
        rows = await db.listOrders({ userId: user.id, admin: adminView });
      }

      return res.status(200).json((await attachItems(rows)).map(publicOrder));
    }

    if (req.method === 'POST') {
      if (!await enforceRateLimit(res, `checkout:${user.id}:${clientIp(req)}`, 8, 60_000)) return;
      // Race checkout against a hard deadline so a slow Cashfree call can't
      // cause the platform to kill us silently and return a bodyless 502.
      let deadlineTimer;
      const deadlinePromise = new Promise((_resolve, reject) => {
        deadlineTimer = setTimeout(() => {
          reject(Object.assign(new Error('Checkout timed out — please try again'), { code: 'FUNCTION_TIMEOUT', status: 503 }));
        }, FUNCTION_DEADLINE_MS);
      });
      try {
        await Promise.race([checkout(req, res, user), deadlinePromise]);
      } catch (raceError) {
        clearTimeout(deadlineTimer);
        console.error('Checkout deadline or unhandled error:', {
          code: raceError?.code,
          status: raceError?.status,
          message: raceError?.message,
        });
        if (!res.headersSent) {
          const status = raceError?.code === 'FUNCTION_TIMEOUT' ? 503 : 502;
          return res.status(status).json({ error: raceError?.message || 'Checkout failed. Please try again.' });
        }
        return;
      } finally {
        clearTimeout(deadlineTimer);
      }
      return;
    }

    if (req.method === 'PUT') {
      if (!await isAdmin(user)) return res.status(403).json({ error: 'Administrator access required' });
      const { id, status } = req.body || {};
      const allowed = ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
      if (!id || !allowed.includes(status)) return res.status(400).json({ error: 'Valid order and status required' });
      const order = await db.getOrder(id);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.payment_status !== PaymentState.PAID && status !== 'Cancelled') {
        return res.status(409).json({ error: 'Fulfillment can only advance after the order is PAID' });
      }
      try {
        assertFulfillmentTransition(order.status, status);
      } catch (error) {
        return res.status(409).json({ error: error.message });
      }
      const updated = await db.updateOrder(order.id, order.version, {
        status,
        version: Number(order.version) + 1,
        updated_at: new Date().toISOString(),
      });
      await writeAudit(db, {
        actorId: user.id,
        actorRole: 'admin',
        action: 'FULFILLMENT_UPDATED',
        entityType: 'order',
        entityId: order.id,
        orderId: order.id,
        fromState: order.status,
        toState: status,
      });
      return res.status(200).json(publicOrder(updated || { ...order, status }));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Orders API error:', err.message);
    return res.status(500).json({ error: 'Unable to process order request' });
  }
}
