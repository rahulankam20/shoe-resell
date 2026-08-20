import { captureStock, releaseStock, syncProductStockDisplay } from './inventory.js';
import { writeAudit } from './audit.js';
import {
  PaymentState,
  RefundState,
  FulfillmentState,
  assertPaymentTransition,
  assertRefundTransition,
  mapCashfreePaymentStatus,
  mapCashfreeRefundStatus,
  amountsMatch,
} from './state.js';
import { cashfreeConfig, getCashfreeOrder, getCashfreePayments } from './cashfree.js';

function webhookDedupKey(parsed) {
  return [
    parsed.type || 'UNKNOWN',
    parsed.cfPaymentId || parsed.cfRefundId || parsed.orderId || 'none',
    parsed.eventTime || 'notime',
    parsed.paymentStatus || parsed.refundStatus || parsed.orderStatus || '',
  ].join(':');
}

function paymentMapKey(cfPaymentId, orderId) {
  return cfPaymentId ? `pay:${cfPaymentId}` : `order:${orderId}:success`;
}

export async function recordWebhookEvent(db, { parsed, rawBody, verified, source }) {
  const dedupKey = webhookDedupKey(parsed);
  const inserted = await db.insertWebhookEvent({
    dedup_key: dedupKey,
    event_type: parsed.type || 'UNKNOWN',
    order_id: parsed.orderId || null,
    cf_payment_id: parsed.cfPaymentId || null,
    cf_refund_id: parsed.cfRefundId || null,
    signature_valid: Boolean(verified),
    source: source || 'webhook',
    payload: parsed.payload || {},
    raw_body_hash: String(rawBody || '').slice(0, 64),
    created_at: new Date().toISOString(),
  });
  return { dedupKey, duplicate: !inserted };
}

async function applyOrderState(db, order, nextPaymentState, extra = {}) {
  const fulfillment =
    extra.status ||
    (nextPaymentState === PaymentState.PAID
      ? FulfillmentState.Placed
      : nextPaymentState === PaymentState.CANCELLED || nextPaymentState === PaymentState.EXPIRED
        ? FulfillmentState.Cancelled
        : order.status);
  const updated = await db.updateOrder(order.id, order.version, {
    payment_status: nextPaymentState,
    status: fulfillment,
    version: Number(order.version) + 1,
    updated_at: new Date().toISOString(),
    ...extra,
  });
  if (!updated) {
    // If concurrent update bumped version, try to apply without version lock
    const latest = await db.getOrder(order.id);
    if (latest) {
      return await db.updateOrder(latest.id, latest.version, {
        payment_status: nextPaymentState,
        status: fulfillment,
        version: Number(latest.version) + 1,
        updated_at: new Date().toISOString(),
        ...extra,
      });
    }
  }
  return updated;
}

export async function settleSuccessfulPayment(db, { order, parsed, source }) {
  if (order.payment_status === PaymentState.PAID) {
    return { status: 'already_paid', order };
  }
  if (order.payment_status === PaymentState.REFUNDED) {
    return { status: 'already_refunded', order };
  }

  const expected = Number(order.total);
  const amount = parsed.paymentAmount || parsed.orderAmount;
  if (!amountsMatch(amount, expected)) {
    await writeAudit(db, {
      action: 'PAYMENT_AMOUNT_MISMATCH',
      entityType: 'order',
      entityId: order.id,
      orderId: order.id,
      fromState: order.payment_status,
      metadata: { expected, received: amount, source, cfPaymentId: parsed.cfPaymentId },
    });
    return { status: 'amount_mismatch', order, expected, received: amount };
  }
  if (String(parsed.currency || 'INR').toUpperCase() !== String(order.currency || 'INR').toUpperCase()) {
    await writeAudit(db, {
      action: 'PAYMENT_CURRENCY_MISMATCH',
      entityType: 'order',
      entityId: order.id,
      orderId: order.id,
      metadata: { expected: order.currency, received: parsed.currency, source },
    });
    return { status: 'currency_mismatch', order };
  }
  if (parsed.orderId && parsed.orderId !== order.order_number) {
    return { status: 'order_id_mismatch', order };
  }

  const claimKey = paymentMapKey(parsed.cfPaymentId, order.order_number);
  await db.claimPaymentId({
    cf_payment_id: claimKey,
    order_id: order.id,
    user_id: order.user_id,
    created_at: new Date().toISOString(),
  });

  try {
    const items = await db.getOrderItems(order.id);
    if (items?.length) {
      await captureStock(db, items.map((item) => ({
        productId: item.product_id,
        size: item.size,
        quantity: item.quantity,
      })));
      await syncProductStockDisplay(db, items.map((item) => item.product_id));
    }
  } catch (error) {
    console.error('Stock capture non-fatal warning during payment capture:', error?.message);
  }

  const payment = await db.insertPayment({
    order_id: order.id,
    user_id: order.user_id,
    provider: 'cashfree',
    method: 'upi',
    status: PaymentState.PAID,
    amount: expected,
    currency: order.currency || 'INR',
    cf_order_id: order.cf_order_id || parsed.cfOrderId || null,
    cf_payment_id: parsed.cfPaymentId || claimKey,
    payment_message: parsed.paymentMessage || 'Transaction successful',
    bank_reference: parsed.bankReference || null,
    source,
    raw: parsed.payload || {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  let paid = await applyOrderState(db, order, PaymentState.PAID, {
    payment_method: 'UPI',
    paid_at: new Date().toISOString(),
    failure_reason: null,
    status: FulfillmentState.Placed,
  });

  if (!paid) {
    const latest = await db.getOrder(order.id);
    paid = latest;
  }

  await writeAudit(db, {
    action: 'ORDER_PAID',
    entityType: 'order',
    entityId: order.id,
    orderId: order.id,
    fromState: order.payment_status,
    toState: PaymentState.PAID,
    metadata: { source, cfPaymentId: parsed.cfPaymentId, amount: expected },
  });

  return { status: 'paid', order: paid || order, payment };
}

export async function settleUnsuccessfulPayment(db, { order, parsed, source }) {
  if ([PaymentState.PAID, PaymentState.REFUNDED, PaymentState.PARTIALLY_REFUNDED].includes(order.payment_status)) {
    return { status: 'ignored_terminal', order };
  }
  const next = mapCashfreePaymentStatus(parsed.paymentStatus || parsed.orderStatus);
  if (next === PaymentState.PAID) {
    return settleSuccessfulPayment(db, { order, parsed, source });
  }
  if (next === PaymentState.PAYMENT_PENDING) {
    return { status: 'still_pending', order };
  }
  if (order.payment_status === next) return { status: 'unchanged', order };

  try {
    const items = await db.getOrderItems(order.id);
    if ([PaymentState.FAILED, PaymentState.CANCELLED, PaymentState.EXPIRED].includes(next)
      && order.payment_status === PaymentState.PAYMENT_PENDING && items?.length) {
      await releaseStock(db, items.map((item) => ({
        productId: item.product_id,
        size: item.size,
        quantity: item.quantity,
      })));
      await syncProductStockDisplay(db, items.map((item) => item.product_id));
    }
  } catch (stockErr) {
    console.error('releaseStock non-fatal warning:', stockErr?.message);
  }

  const updated = await applyOrderState(db, order, next, {
    failure_reason: parsed.paymentMessage || next,
    status: next === PaymentState.EXPIRED || next === PaymentState.CANCELLED
      ? FulfillmentState.Cancelled
      : order.status,
  });
  await writeAudit(db, {
    action: `ORDER_${next}`,
    entityType: 'order',
    entityId: order.id,
    orderId: order.id,
    fromState: order.payment_status,
    toState: next,
    metadata: { source, cfPaymentId: parsed.cfPaymentId },
  });
  return { status: next.toLowerCase(), order: updated || order };
}

export async function processPaymentEvent(db, { parsed, source }) {
  if (!parsed.orderId) return { status: 'missing_order_id' };
  const order = await db.getOrderByNumber(parsed.orderId);
  if (!order) return { status: 'order_not_found', orderId: parsed.orderId };

  if (isSuccessfulEvent(parsed)) {
    return settleSuccessfulPayment(db, { order, parsed, source });
  }
  return settleUnsuccessfulPayment(db, { order, parsed, source });
}

function isSuccessfulEvent(parsed) {
  return (
    parsed.paymentStatus === 'SUCCESS' ||
    parsed.orderStatus === 'PAID' ||
    parsed.type === 'PAYMENT_SUCCESS_WEBHOOK' ||
    parsed.type === 'SUCCESS'
  );
}

export async function processRefundEvent(db, { parsed, source }) {
  if (!parsed.refundId && !parsed.cfRefundId) return { status: 'missing_refund_id' };
  const refund = parsed.refundId
    ? await db.getRefundById(parsed.refundId)
    : await db.getRefundByCfId(parsed.cfRefundId);
  if (!refund) return { status: 'refund_not_found' };

  const next = mapCashfreeRefundStatus(parsed.refundStatus || 'PENDING');
  if (refund.status === next) return { status: 'unchanged', refund };
  assertRefundTransition(refund.status, next);

  const updated = await db.updateRefund(refund.refund_id, {
    status: next,
    cf_refund_id: parsed.cfRefundId || refund.cf_refund_id,
    amount: parsed.refundAmount || refund.amount,
    updated_at: new Date().toISOString(),
    raw: parsed.payload || refund.raw,
  });

  if (next === RefundState.SUCCESS) {
    const order = await db.getOrder(refund.order_id);
    if (order && order.payment_status === PaymentState.PAID) {
      const totalRefunded = await db.sumSuccessfulRefunds(order.id);
      const target = amountsMatch(totalRefunded, order.total)
        ? PaymentState.REFUNDED
        : PaymentState.PARTIALLY_REFUNDED;
      if (order.payment_status !== target) {
        await applyOrderState(db, order, target);
      }
    }
  }

  await writeAudit(db, {
    action: `REFUND_${next}`,
    entityType: 'refund',
    entityId: refund.refund_id,
    orderId: refund.order_id,
    fromState: refund.status,
    toState: next,
    metadata: { source },
  });
  return { status: next.toLowerCase(), refund: updated };
}

export function pickOfficialPayment(payments) {
  if (!Array.isArray(payments) || !payments.length) return null;
  return payments.find((row) => String(row.payment_status).toUpperCase() === 'SUCCESS') || payments[0];
}

export async function reconcileOrder(db, order, source = 'reconcile') {
  if (!order) return { status: 'order_not_found' };
  if ([PaymentState.PAID, PaymentState.REFUNDED, PaymentState.PARTIALLY_REFUNDED].includes(order.payment_status)) {
    return { status: 'already_terminal', order };
  }

  const cfg = cashfreeConfig();
  if (!cfg.configured) {
    return { status: 'provider_unconfigured', order };
  }

  let cfOrder = {};
  let payments = [];
  try {
    cfOrder = await getCashfreeOrder(order.order_number);
  } catch (err) {
    console.error('getCashfreeOrder error during reconcile:', err?.message);
  }

  try {
    payments = await getCashfreePayments(order.order_number);
  } catch (err) {
    console.error('getCashfreePayments error during reconcile:', err?.message);
  }

  const paymentsList = Array.isArray(payments) ? payments : [];
  const official = pickOfficialPayment(paymentsList);
  const isPaidInCashfree =
    String(cfOrder?.order_status || '').toUpperCase() === 'PAID' ||
    String(official?.payment_status || '').toUpperCase() === 'SUCCESS';

  const parsed = {
    type: 'RECONCILE',
    orderId: order.order_number,
    cfOrderId: String(cfOrder?.cf_order_id || order.cf_order_id || ''),
    cfPaymentId: official ? String(official.cf_payment_id) : '',
    orderAmount: Number(cfOrder?.order_amount || order.total),
    paymentAmount: Number(official?.payment_amount || cfOrder?.order_amount || order.total),
    currency: official?.payment_currency || cfOrder?.order_currency || 'INR',
    paymentStatus: isPaidInCashfree ? 'SUCCESS' : String(official?.payment_status || '').toUpperCase(),
    orderStatus: String(cfOrder?.order_status || '').toUpperCase(),
    paymentMessage: official?.payment_message || (isPaidInCashfree ? 'Payment successful' : ''),
    bankReference: official?.bank_reference || '',
    payload: { order: cfOrder, payment: official, payments: paymentsList },
  };

  return processPaymentEvent(db, { parsed, source });
}

export { webhookDedupKey, paymentMapKey };
