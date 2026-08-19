export const PaymentState = Object.freeze({
  CREATED: 'CREATED',
  PAYMENT_PENDING: 'PAYMENT_PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED',
  PARTIALLY_REFUNDED: 'PARTIALLY_REFUNDED',
});

export const RefundState = Object.freeze({
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  ONHOLD: 'ONHOLD',
});

export const FulfillmentState = Object.freeze({
  Pending: 'Pending',
  Placed: 'Placed',
  Confirmed: 'Confirmed',
  Shipped: 'Shipped',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
});

const PAYMENT_TRANSITIONS = {
  [PaymentState.CREATED]: [PaymentState.PAYMENT_PENDING, PaymentState.CANCELLED],
  [PaymentState.PAYMENT_PENDING]: [
    PaymentState.PAID,
    PaymentState.FAILED,
    PaymentState.CANCELLED,
    PaymentState.EXPIRED,
  ],
  [PaymentState.PAID]: [PaymentState.REFUNDED, PaymentState.PARTIALLY_REFUNDED],
  [PaymentState.FAILED]: [PaymentState.PAYMENT_PENDING, PaymentState.PAID, PaymentState.CANCELLED],
  [PaymentState.CANCELLED]: [PaymentState.PAYMENT_PENDING, PaymentState.PAID],
  [PaymentState.EXPIRED]: [PaymentState.PAYMENT_PENDING],
  [PaymentState.REFUNDED]: [],
  [PaymentState.PARTIALLY_REFUNDED]: [PaymentState.REFUNDED, PaymentState.PARTIALLY_REFUNDED],
};

const REFUND_TRANSITIONS = {
  [RefundState.CREATED]: [RefundState.PENDING, RefundState.FAILED, RefundState.CANCELLED],
  [RefundState.PENDING]: [RefundState.SUCCESS, RefundState.FAILED, RefundState.CANCELLED, RefundState.ONHOLD],
  [RefundState.ONHOLD]: [RefundState.SUCCESS, RefundState.FAILED, RefundState.CANCELLED],
  [RefundState.SUCCESS]: [],
  [RefundState.FAILED]: [RefundState.PENDING],
  [RefundState.CANCELLED]: [],
};

const FULFILLMENT_TRANSITIONS = {
  [FulfillmentState.Pending]: [FulfillmentState.Placed, FulfillmentState.Cancelled],
  [FulfillmentState.Placed]: [FulfillmentState.Confirmed, FulfillmentState.Cancelled, FulfillmentState.Shipped],
  [FulfillmentState.Confirmed]: [FulfillmentState.Shipped, FulfillmentState.Cancelled],
  [FulfillmentState.Shipped]: [FulfillmentState.Delivered],
  [FulfillmentState.Delivered]: [],
  [FulfillmentState.Cancelled]: [],
};

export function canTransition(map, from, to) {
  if (from === to) return true;
  return (map[from] || []).includes(to);
}

export function assertPaymentTransition(from, to) {
  if (!canTransition(PAYMENT_TRANSITIONS, from, to)) {
    const err = new Error(`Invalid payment transition ${from} → ${to}`);
    err.code = 'INVALID_STATE_TRANSITION';
    throw err;
  }
}

export function assertRefundTransition(from, to) {
  if (!canTransition(REFUND_TRANSITIONS, from, to)) {
    const err = new Error(`Invalid refund transition ${from} → ${to}`);
    err.code = 'INVALID_REFUND_TRANSITION';
    throw err;
  }
}

export function assertFulfillmentTransition(from, to) {
  if (!canTransition(FULFILLMENT_TRANSITIONS, from, to)) {
    const err = new Error(`Invalid fulfillment transition ${from} → ${to}`);
    err.code = 'INVALID_FULFILLMENT_TRANSITION';
    throw err;
  }
}

export function mapCashfreePaymentStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'SUCCESS') return PaymentState.PAID;
  if (value === 'FAILED') return PaymentState.FAILED;
  if (value === 'USER_DROPPED' || value === 'CANCELLED' || value === 'VOID') return PaymentState.CANCELLED;
  if (value === 'EXPIRED') return PaymentState.EXPIRED;
  return PaymentState.PAYMENT_PENDING;
}

export function mapCashfreeOrderStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'PAID') return PaymentState.PAID;
  if (value === 'EXPIRED') return PaymentState.EXPIRED;
  if (value === 'TERMINATED') return PaymentState.CANCELLED;
  return PaymentState.PAYMENT_PENDING;
}

export function mapCashfreeRefundStatus(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'SUCCESS') return RefundState.SUCCESS;
  if (value === 'PENDING' || value === 'ONHOLD' || value === 'ACTIVE') return value === 'ONHOLD' ? RefundState.ONHOLD : RefundState.PENDING;
  if (value === 'CANCELLED') return RefundState.CANCELLED;
  if (value === 'FAILED') return RefundState.FAILED;
  return RefundState.PENDING;
}

export function amountsMatch(a, b) {
  return Math.round(Number(a) * 100) === Math.round(Number(b) * 100);
}

export { PAYMENT_TRANSITIONS, REFUND_TRANSITIONS, FULFILLMENT_TRANSITIONS };
