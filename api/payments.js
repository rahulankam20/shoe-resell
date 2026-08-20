import { applySecurityHeaders, clientIp } from './_lib/http.js';
import { requireUser, isAdmin } from './_lib/auth.js';
import { enforceRateLimit } from './_lib/rateLimit.js';
import db from './_lib/db.js';
import { cashfreeConfig, getCashfreeOrder, getCashfreePayments, createCashfreeRefund } from './_lib/cashfree.js';
import { processPaymentEvent, processRefundEvent, reconcileOrder } from './_lib/settlement.js';
import { PaymentState, RefundState } from './_lib/state.js';
import { makeRefundId } from './_lib/validation.js';
import { writeAudit } from './_lib/audit.js';

async function handleRefund(req, res, user) {
  if (!await isAdmin(user)) return res.status(403).json({ error: 'Administrator access required' });
  const { order_id, amount, note, refund_id } = req.body || {};
  if (!order_id) return res.status(400).json({ error: 'order_id is required' });
  const order = await db.getOrder(order_id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.payment_status !== PaymentState.PAID && order.payment_status !== PaymentState.PARTIALLY_REFUNDED) {
    return res.status(409).json({ error: 'Only PAID orders can be refunded' });
  }
  const refundAmount = amount == null ? Number(order.total) : Number(amount);
  if (!(refundAmount > 0)) return res.status(400).json({ error: 'Refund amount must be greater than zero' });
  const already = await db.sumSuccessfulRefunds(order.id);
  if (already + refundAmount > Number(order.total) + 0.001) {
    return res.status(409).json({ error: 'Refund exceeds remaining capture amount' });
  }

  const refundId = String(refund_id || makeRefundId()).slice(0, 40);
  const existing = await db.getRefundById(refundId);
  if (existing) return res.status(200).json({ refund: existing, reused: true });

  const inserted = await db.insertRefund({
    refund_id: refundId,
    order_id: order.id,
    payment_id: null,
    user_id: order.user_id,
    amount: refundAmount,
    currency: order.currency || 'INR',
    status: RefundState.CREATED,
    reason: note || 'admin_refund',
    requested_by: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (!inserted) {
    const again = await db.getRefundById(refundId);
    return res.status(200).json({ refund: again, reused: true });
  }

  let provider;
  try {
    provider = await createCashfreeRefund({
      orderId: order.order_number,
      refundId,
      amount: refundAmount,
      note: note || 'SOLEVAULT refund',
    });
  } catch (error) {
    await db.updateRefund(refundId, {
      status: RefundState.FAILED,
      updated_at: new Date().toISOString(),
      raw: { error: error.message },
    });
    return res.status(502).json({ error: 'Cashfree refund request failed' });
  }

  const nextStatus = provider.refund_status === 'SUCCESS' ? RefundState.SUCCESS : RefundState.PENDING;
  const updated = await db.updateRefund(refundId, {
    status: RefundState.PENDING,
    cf_refund_id: String(provider.cf_refund_id || ''),
    raw: provider,
    updated_at: new Date().toISOString(),
  });

  if (nextStatus === RefundState.SUCCESS || nextStatus === RefundState.PENDING) {
    await processRefundEvent(db, {
      parsed: {
        type: 'REFUND_STATUS_WEBHOOK',
        refundId,
        cfRefundId: String(provider.cf_refund_id || ''),
        refundAmount,
        refundStatus: provider.refund_status || 'PENDING',
        orderId: order.order_number,
        payload: provider,
      },
      source: 'admin_refund',
    });
  }

  await writeAudit(db, {
    actorId: user.id,
    actorRole: 'admin',
    action: 'REFUND_REQUESTED',
    entityType: 'refund',
    entityId: refundId,
    orderId: order.id,
    metadata: { amount: refundAmount },
  });
  return res.status(201).json({ refund: updated || inserted });
}

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const user = await requireUser(req, res);
    if (!user) return;

    if (req.method === 'GET') {
      const isAdminQuery = req.query?.admin === 'true' || req.query?.scope === 'admin';
      if (isAdminQuery) {
        if (!await isAdmin(user)) return res.status(403).json({ error: 'Administrator access required' });
        const [orders, payments, refunds, webhooks] = await Promise.all([
          db.listOrders({ admin: true }),
          db.listAllPayments(),
          db.listAllRefunds(),
          db.listWebhookEvents(),
        ]);
        const itemsByOrder = {};
        for (const order of orders.slice(0, 80)) {
          itemsByOrder[order.id] = await db.getOrderItems(order.id);
        }
        return res.status(200).json({
          orders: orders.map((order) => ({
            ...order,
            items: itemsByOrder[order.id] || [],
            payment_session_id: undefined,
          })),
          payments,
          refunds,
          webhooks: webhooks.map((event) => ({
            id: event.id,
            dedup_key: event.dedup_key,
            event_type: event.event_type,
            order_id: event.order_id,
            cf_payment_id: event.cf_payment_id,
            cf_refund_id: event.cf_refund_id,
            signature_valid: event.signature_valid,
            source: event.source,
            created_at: event.created_at,
          })),
        });
      }

      const orderId = req.query?.order_id || req.query?.id;
      if (!orderId) return res.status(400).json({ error: 'order_id is required' });
      const order = await db.getOrder(orderId);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      if (order.user_id !== user.id && !await isAdmin(user)) return res.status(404).json({ error: 'Order not found' });
      const [payments, refunds, attempts] = await Promise.all([
        db.listPayments(order.id),
        db.listRefunds(order.id),
        db.listAttempts(order.id),
      ]);
      return res.status(200).json({
        order_id: order.id,
        order_number: order.order_number,
        payment_status: order.payment_status,
        status: order.status,
        total: order.total,
        currency: order.currency || 'INR',
        cf_order_id: order.cf_order_id,
        paid_at: order.paid_at,
        failure_reason: order.failure_reason,
        payments,
        refunds,
        attempts,
        confirmed: order.payment_status === PaymentState.PAID,
      });
    }

    if (req.method === 'POST') {
      const action = req.query?.action || req.body?.action || 'status';
      if (action === 'refund') return handleRefund(req, res, user);
      if (action === 'reconcile') {
        if (!await enforceRateLimit(res, `reconcile:${user.id}:${clientIp(req)}`, 12, 60_000)) return;
        const orderId = req.body?.order_id || req.query?.order_id;
        const order = await db.getOrder(orderId);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.user_id !== user.id && !await isAdmin(user)) return res.status(404).json({ error: 'Order not found' });
        const result = await reconcileOrder(db, order, 'user_reconcile');
        const latest = await db.getOrder(order.id);
        return res.status(200).json({
          result: result.status,
          payment_status: latest.payment_status,
          status: latest.status,
          confirmed: latest.payment_status === PaymentState.PAID,
          order: latest,
        });
      }
      return res.status(400).json({ error: 'Unknown payment action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Payments API error:', err.message);
    return res.status(500).json({ error: 'Unable to process payment request' });
  }
}
