import { applySecurityHeaders, getRawBody, clientIp } from './_lib/http.js';
import { enforceRateLimit } from './_lib/rateLimit.js';
import db from './_lib/db.js';
import { cashfreeConfig, verifyWebhookSignature, parseWebhookPayload } from './_lib/cashfree.js';
import { recordWebhookEvent, processPaymentEvent, processRefundEvent } from './_lib/settlement.js';



export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!await enforceRateLimit(res, `webhook:${clientIp(req)}`, 120, 60_000)) return;

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];
  const cfg = cashfreeConfig();

  const mockAllowed = cfg.environment === 'MOCK' && req.headers['x-mock-webhook'] === 'solevault';
  const verified = mockAllowed
    ? { ok: true }
    : verifyWebhookSignature({
      signature,
      timestamp,
      rawBody,
      secret: cfg.webhookSecret,
    });

  if (!verified.ok) {
    console.error('Cashfree webhook rejected:', verified.reason);
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  let parsed;
  try {
    parsed = parseWebhookPayload(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  try {
    const recorded = await recordWebhookEvent(db, {
      parsed,
      rawBody,
      verified: true,
      source: 'webhook',
    });
    if (recorded.duplicate) {
      return res.status(200).json({ ok: true, duplicate: true });
    }

    const type = String(parsed.type || '').toUpperCase();
    let result;
    if (type.includes('REFUND')) {
      result = await processRefundEvent(db, { parsed, source: 'webhook' });
    } else {
      result = await processPaymentEvent(db, { parsed, source: 'webhook' });
    }
    return res.status(200).json({ ok: true, result: result.status });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
