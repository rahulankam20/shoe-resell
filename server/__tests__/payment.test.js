import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { createMemoryDb } from './memoryDb.js';
import { computeWebhookSignature, verifyWebhookSignature, parseWebhookPayload, validateCapturedPayment } from '../../api/_lib/cashfree.js';
import { recordWebhookEvent, processPaymentEvent, processRefundEvent, settleSuccessfulPayment } from '../../api/_lib/settlement.js';
import { reserveStock, captureStock, releaseStock } from '../../api/_lib/inventory.js';
import { PaymentState, RefundState, assertPaymentTransition } from '../../api/_lib/state.js';
import { normalizeCartItems, validateCustomer, sanitizeCustomer } from '../../api/_lib/validation.js';

const SECRET = 'test_cashfree_secret';

function seedOrder(overrides = {}) {
  const db = createMemoryDb({
    products: [{ id: 1, name: 'Pegasus', brand: 'Nike', mrp: 12000, sale_price: 4999, sizes: ['8'], stock: { '8': 1 } }],
    inventory: [{ sku_key: '1:8', product_id: 1, size: '8', quantity: 1, reserved: 1, version: 2 }],
    orders: [{
      id: 10,
      order_number: 'SVTESTORDER01',
      user_id: 'user-1',
      payment_status: PaymentState.PAYMENT_PENDING,
      status: 'Pending',
      total: 5148,
      currency: 'INR',
      version: 2,
      cf_order_id: 'cf_10',
    }],
    orderItems: [{ id: 1, order_id: 10, product_id: 1, size: '8', quantity: 1 }],
    nextId: 100,
  });
  if (overrides.order) Object.assign(db.state.orders[0], overrides.order);
  if (overrides.inventory) Object.assign(db.state.inventory[0], overrides.inventory);
  return db;
}

function signedWebhook({ type = 'PAYMENT_SUCCESS_WEBHOOK', paymentStatus = 'SUCCESS', amount = 5148, orderId = 'SVTESTORDER01', cfPaymentId = 'pay_1', extra = {} }) {
  const payload = JSON.stringify({
    type,
    event_time: '2026-04-12T10:00:00+05:30',
    data: {
      order: { order_id: orderId, order_amount: amount, order_currency: 'INR', order_status: paymentStatus === 'SUCCESS' ? 'PAID' : 'ACTIVE', cf_order_id: 'cf_10' },
      payment: { cf_payment_id: cfPaymentId, payment_status: paymentStatus, payment_amount: amount, payment_currency: 'INR', payment_group: 'upi', payment_message: 'ok', ...extra },
    },
  });
  const timestamp = String(Date.now());
  return {
    rawBody: payload,
    timestamp,
    signature: computeWebhookSignature(timestamp, payload, SECRET),
    parsed: parseWebhookPayload(payload),
  };
}

test('webhook signature accepts official HMAC over timestamp + raw body', () => {
  const rawBody = '{"hello":"world"}';
  const timestamp = String(Date.now());
  const signature = computeWebhookSignature(timestamp, rawBody, SECRET);
  assert.equal(verifyWebhookSignature({ signature, timestamp, rawBody, secret: SECRET }).ok, true);
});

test('webhook signature rejects tampered body, stale timestamp and missing headers', () => {
  const rawBody = '{"hello":"world"}';
  const timestamp = String(Date.now());
  const signature = computeWebhookSignature(timestamp, rawBody, SECRET);
  assert.equal(verifyWebhookSignature({ signature, timestamp, rawBody: '{"hello":"nope"}', secret: SECRET }).ok, false);
  assert.equal(verifyWebhookSignature({ signature: 'aaaa', timestamp, rawBody, secret: SECRET }).ok, false);
  assert.equal(verifyWebhookSignature({ signature, timestamp: String(Date.now() - 10 * 60 * 1000), rawBody, secret: SECRET }).ok, false);
  assert.equal(verifyWebhookSignature({ signature: '', timestamp, rawBody, secret: SECRET }).ok, false);
});

test('successful webhook pays the order once and captures stock', async () => {
  const db = seedOrder();
  const hook = signedWebhook({});
  const recorded = await recordWebhookEvent(db, { parsed: hook.parsed, rawBody: hook.rawBody, verified: true });
  assert.equal(recorded.duplicate, false);
  const result = await processPaymentEvent(db, { parsed: hook.parsed, source: 'webhook' });
  assert.equal(result.status, 'paid');
  const order = await db.getOrder(10);
  assert.equal(order.payment_status, PaymentState.PAID);
  assert.equal(order.status, 'Placed');
  const stock = await db.getInventory('1:8');
  assert.equal(stock.quantity, 0);
  assert.equal(stock.reserved, 0);
  assert.equal(db.state.payments.length, 1);
});

test('duplicate and replayed webhooks are idempotent', async () => {
  const db = seedOrder();
  const hook = signedWebhook({});
  await recordWebhookEvent(db, { parsed: hook.parsed, rawBody: hook.rawBody, verified: true });
  await processPaymentEvent(db, { parsed: hook.parsed, source: 'webhook' });
  const replayRecord = await recordWebhookEvent(db, { parsed: hook.parsed, rawBody: hook.rawBody, verified: true });
  assert.equal(replayRecord.duplicate, true);
  const again = await processPaymentEvent(db, { parsed: hook.parsed, source: 'webhook' });
  assert.equal(again.status, 'already_paid');
  assert.equal(db.state.payments.length, 1);
  assert.equal((await db.getInventory('1:8')).quantity, 0);
});

test('out-of-order failure after success is ignored', async () => {
  const db = seedOrder();
  await processPaymentEvent(db, { parsed: signedWebhook({}).parsed, source: 'webhook' });
  const lateFail = signedWebhook({ type: 'PAYMENT_FAILED_WEBHOOK', paymentStatus: 'FAILED', cfPaymentId: 'pay_old' });
  const result = await processPaymentEvent(db, { parsed: lateFail.parsed, source: 'webhook' });
  assert.equal(result.status, 'ignored_terminal');
  assert.equal((await db.getOrder(10)).payment_status, PaymentState.PAID);
});

test('amount mismatch never marks the order paid', async () => {
  const db = seedOrder();
  const hook = signedWebhook({ amount: 1 });
  const result = await processPaymentEvent(db, { parsed: hook.parsed, source: 'webhook' });
  assert.equal(result.status, 'amount_mismatch');
  assert.equal((await db.getOrder(10)).payment_status, PaymentState.PAYMENT_PENDING);
  assert.equal(db.state.payments.length, 0);
  assert.equal((await db.getInventory('1:8')).quantity, 1);
});

test('failed and cancelled UPI attempts release reservation without capturing', async () => {
  const db = seedOrder();
  const fail = signedWebhook({ type: 'PAYMENT_FAILED_WEBHOOK', paymentStatus: 'USER_DROPPED', cfPaymentId: 'pay_drop' });
  const result = await processPaymentEvent(db, { parsed: fail.parsed, source: 'webhook' });
  assert.equal(result.status, 'cancelled');
  const stock = await db.getInventory('1:8');
  assert.equal(stock.quantity, 1);
  assert.equal(stock.reserved, 0);
  assert.equal((await db.getOrder(10)).payment_status, PaymentState.CANCELLED);
});

test('pending webhooks leave the order pending', async () => {
  const db = seedOrder();
  const pending = signedWebhook({ type: 'PAYMENT_USER_DROPPED_WEBHOOK', paymentStatus: 'PENDING', extra: {} });
  pending.parsed.paymentStatus = 'PENDING';
  pending.parsed.orderStatus = 'ACTIVE';
  const result = await processPaymentEvent(db, { parsed: pending.parsed, source: 'webhook' });
  assert.equal(result.status, 'still_pending');
  assert.equal((await db.getOrder(10)).payment_status, PaymentState.PAYMENT_PENDING);
});

test('concurrent last-item capture only succeeds once', async () => {
  const db = seedOrder({
    inventory: { quantity: 1, reserved: 2, version: 2 },
  });
  db.state.orders.push({
    id: 11,
    order_number: 'SVTESTORDER02',
    user_id: 'user-2',
    payment_status: PaymentState.PAYMENT_PENDING,
    status: 'Pending',
    total: 5148,
    currency: 'INR',
    version: 2,
    cf_order_id: 'cf_11',
  });
  db.state.orderItems.push({ id: 2, order_id: 11, product_id: 1, size: '8', quantity: 1 });

  const first = signedWebhook({ orderId: 'SVTESTORDER01', cfPaymentId: 'pay_a' });
  const second = signedWebhook({ orderId: 'SVTESTORDER02', cfPaymentId: 'pay_b' });
  const results = await Promise.allSettled([
    processPaymentEvent(db, { parsed: first.parsed, source: 'webhook' }),
    processPaymentEvent(db, { parsed: second.parsed, source: 'webhook' }),
  ]);
  const paid = results.filter((row) => row.status === 'fulfilled' && row.value.status === 'paid');
  const failed = results.filter((row) => row.status === 'rejected' || (row.status === 'fulfilled' && row.value.status !== 'paid'));
  assert.equal(paid.length, 1);
  assert.ok(failed.length >= 1);
  assert.equal((await db.getInventory('1:8')).quantity, 0);
  assert.equal(db.state.payments.length, 1);
});

test('optimistic inventory reservation is race-safe', async () => {
  const db = createMemoryDb({
    inventory: [{ sku_key: '1:8', product_id: 1, size: '8', quantity: 1, reserved: 0, version: 1 }],
    nextId: 1,
  });
  const item = { productId: 1, size: '8', quantity: 1 };
  const attempts = await Promise.allSettled([reserveStock(db, [item]), reserveStock(db, [item])]);
  const wins = attempts.filter((row) => row.status === 'fulfilled');
  const losses = attempts.filter((row) => row.status === 'rejected');
  assert.equal(wins.length, 1);
  assert.equal(losses.length, 1);
  assert.equal((await db.getInventory('1:8')).reserved, 1);
});

test('capture rollback restores quantity if a later SKU fails', async () => {
  const db = createMemoryDb({
    inventory: [
      { sku_key: '1:8', product_id: 1, size: '8', quantity: 1, reserved: 1, version: 1 },
      { sku_key: '2:9', product_id: 2, size: '9', quantity: 0, reserved: 1, version: 1 },
    ],
  });
  await assert.rejects(() => captureStock(db, [
    { productId: 1, size: '8', quantity: 1 },
    { productId: 2, size: '9', quantity: 1 },
  ]));
  const first = await db.getInventory('1:8');
  assert.equal(first.quantity, 1);
  assert.equal(first.reserved, 1);
});

test('state machine rejects illegal payment transitions', () => {
  assert.throws(() => assertPaymentTransition(PaymentState.PAID, PaymentState.FAILED));
  assert.throws(() => assertPaymentTransition(PaymentState.REFUNDED, PaymentState.PAID));
  assert.doesNotThrow(() => assertPaymentTransition(PaymentState.PAYMENT_PENDING, PaymentState.PAID));
});

test('reconciliation of a missed success webhook is idempotent', async () => {
  const db = seedOrder();
  const parsed = {
    type: 'RECONCILE',
    orderId: 'SVTESTORDER01',
    cfOrderId: 'cf_10',
    cfPaymentId: 'pay_recon',
    orderAmount: 5148,
    paymentAmount: 5148,
    currency: 'INR',
    paymentStatus: 'SUCCESS',
    orderStatus: 'PAID',
    payload: {},
  };
  const first = await processPaymentEvent(db, { parsed, source: 'reconcile' });
  const second = await processPaymentEvent(db, { parsed, source: 'reconcile' });
  assert.equal(first.status, 'paid');
  assert.equal(second.status, 'already_paid');
  assert.equal(db.state.payments.length, 1);
});

test('refunds are authorized against a paid order and stay unique', async () => {
  const db = seedOrder();
  await processPaymentEvent(db, { parsed: signedWebhook({}).parsed, source: 'webhook' });
  const inserted = await db.insertRefund({
    refund_id: 'RF1',
    order_id: 10,
    amount: 5148,
    currency: 'INR',
    status: RefundState.PENDING,
  });
  const duplicate = await db.insertRefund({
    refund_id: 'RF1',
    order_id: 10,
    amount: 5148,
    currency: 'INR',
    status: RefundState.PENDING,
  });
  assert.ok(inserted);
  assert.equal(duplicate, null);
  const result = await processRefundEvent(db, {
    parsed: { refundId: 'RF1', cfRefundId: 'cfr_1', refundAmount: 5148, refundStatus: 'SUCCESS', payload: {} },
    source: 'webhook',
  });
  assert.equal(result.status, 'success');
  assert.equal((await db.getOrder(10)).payment_status, PaymentState.REFUNDED);
});

test('frontend totals and untrusted cart fields are ignored by validators', () => {
  const items = normalizeCartItems([
    { productId: '3', size: '9', quantity: 99, price: 1, amount: 1 },
    { product_id: 4, size: '10', quantity: 2 },
  ]);
  assert.deepEqual(items, [
    { productId: 3, size: '9', quantity: 5 },
    { productId: 4, size: '10', quantity: 2 },
  ]);
  const customer = sanitizeCustomer({ email: ' A@B.COM ', full_name: 'Ada', phone: '+91 9876543210', address: { line1: '1 Street', city: 'Pune', state: 'MH', postal_code: '411001' } });
  assert.equal(validateCustomer(customer), null);
  assert.equal(customer.phone, '9876543210');
});

test('ownership-bound payment ids cannot settle a different order', async () => {
  const db = seedOrder();
  const parsed = signedWebhook({ orderId: 'SOMEONE-ELSE' }).parsed;
  const result = await processPaymentEvent(db, { parsed, source: 'webhook' });
  assert.equal(result.status, 'order_not_found');
  assert.equal((await db.getOrder(10)).payment_status, PaymentState.PAYMENT_PENDING);
});

test('captured payment validator rejects currency and amount drift', () => {
  const parsed = { orderId: 'SV1', paymentAmount: 10, orderAmount: 10, currency: 'USD', paymentStatus: 'SUCCESS' };
  assert.equal(validateCapturedPayment({ parsed, expectedAmount: 10, expectedCurrency: 'INR', expectedOrderId: 'SV1' }).ok, false);
  assert.equal(validateCapturedPayment({ parsed: { ...parsed, currency: 'INR', paymentAmount: 11 }, expectedAmount: 10, expectedOrderId: 'SV1' }).ok, false);
  assert.equal(validateCapturedPayment({ parsed: { ...parsed, currency: 'INR' }, expectedAmount: 10, expectedOrderId: 'SV1' }).ok, true);
});

test('HMAC uses timing-safe compare and official Cashfree concatenation', () => {
  const ts = '1617695238078';
  const payload = '{"a":1}';
  const expected = crypto.createHmac('sha256', SECRET).update(`${ts}${payload}`).digest('base64');
  assert.equal(computeWebhookSignature(ts, payload, SECRET), expected);
});

test('releasing stock after failed checkout never goes negative', async () => {
  const db = createMemoryDb({
    inventory: [{ sku_key: '1:8', product_id: 1, size: '8', quantity: 1, reserved: 0, version: 1 }],
  });
  await releaseStock(db, [{ productId: 1, size: '8', quantity: 1 }]);
  assert.equal((await db.getInventory('1:8')).reserved, 0);
});

test('settleSuccessfulPayment refuses already refunded orders', async () => {
  const db = seedOrder({ order: { payment_status: PaymentState.REFUNDED } });
  const result = await settleSuccessfulPayment(db, {
    order: await db.getOrder(10),
    parsed: signedWebhook({}).parsed,
    source: 'webhook',
  });
  assert.equal(result.status, 'already_refunded');
});
