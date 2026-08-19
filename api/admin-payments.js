import { applySecurityHeaders } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import db from './_lib/db.js';

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;

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
  } catch (err) {
    console.error('Admin payments API error:', err.message);
    return res.status(500).json({ error: 'Unable to load payment operations' });
  }
}
