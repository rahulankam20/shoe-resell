import crypto from 'crypto';
import { applySecurityHeaders } from './_lib/http.js';
import { requireAdmin } from './_lib/auth.js';
import db from './_lib/db.js';
import { reconcileOrder } from './_lib/settlement.js';
import { PaymentState } from './_lib/state.js';

function timingSafeEqualString(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function authorizedCron(req) {
  const secret = process.env.RECONCILE_CRON_SECRET;
  if (!secret) return false;
  const header = req.headers['x-reconcile-secret'] || req.headers.authorization?.replace('Bearer ', '');
  return timingSafeEqualString(String(header || ''), secret);
}

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!authorizedCron(req)) {
      const admin = await requireAdmin(req, res);
      if (!admin) return;
    }

    const staleMinutes = Number(req.query?.stale_minutes || req.body?.stale_minutes || 2);
    const cutoff = new Date(Date.now() - Math.max(0, staleMinutes) * 60_000).toISOString();
    const pending = await db.listPendingOrders(cutoff);
    const results = [];
    for (const order of pending) {
      try {
        const result = await reconcileOrder(db, order, 'batch_reconcile');
        results.push({ order_id: order.id, order_number: order.order_number, result: result.status });
      } catch (error) {
        results.push({ order_id: order.id, order_number: order.order_number, result: 'error', error: error.message });
      }
    }
    return res.status(200).json({
      scanned: pending.length,
      pending_state: PaymentState.PAYMENT_PENDING,
      results,
    });
  } catch (err) {
    console.error('Reconcile API error:', err.message);
    return res.status(500).json({ error: 'Reconciliation failed' });
  }
}
