import crypto from 'crypto';
import { amountsMatch } from './state.js';

const API_VERSION = process.env.CASHFREE_API_VERSION || '2025-01-01';
const WEBHOOK_MAX_AGE_MS = 5 * 60 * 1000;
// Default 7 s — fires before Vercel Hobby's 10 s hard cap so the catch block
// has time to send a JSON response instead of letting Cloudflare return a
// bodyless 502. Override with CASHFREE_TIMEOUT_MS in env for other tiers.
const FETCH_TIMEOUT_MS = Math.max(1000, Number(process.env.CASHFREE_TIMEOUT_MS || 7000));

export function cashfreeConfig() {
  const env = String(process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase();
  const appId = process.env.CASHFREE_APP_ID || '';
  const secret = process.env.CASHFREE_SECRET_KEY || '';
  const mockForced = String(process.env.CASHFREE_MOCK || '').toLowerCase() === 'true';
  const configured = Boolean(appId && secret) && !mockForced;
  const environment = configured ? (env === 'PRODUCTION' ? 'PRODUCTION' : 'SANDBOX') : 'MOCK';
  const baseUrl = environment === 'PRODUCTION'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';
  return {
    appId,
    secret,
    environment,
    configured,
    baseUrl,
    apiVersion: API_VERSION,
    webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET || secret,
  };
}

function headers(cfg, extra = {}) {
  return {
    'Content-Type': 'application/json',
    'x-api-version': cfg.apiVersion,
    'x-client-id': cfg.appId,
    'x-client-secret': cfg.secret,
    ...extra,
  };
}

function cashfreeHost(baseUrl) {
  try { return new URL(baseUrl).host; } catch { return 'cashfree'; }
}

function logCashfreeFailure(fields) {
  console.error('Cashfree request failed:', {
    host: fields.host,
    method: fields.method,
    path: fields.path,
    status: fields.status || null,
    code: fields.code || null,
    type: fields.type || null,
    message: fields.message || null,
    elapsedMs: fields.elapsedMs,
    timedOut: Boolean(fields.timedOut),
  });
}

export async function cfFetch(path, { method = 'GET', body, idempotencyKey } = {}) {
  const cfg = cashfreeConfig();
  if (!cfg.configured) {
    const err = new Error('Cashfree is not configured');
    err.code = 'CASHFREE_NOT_CONFIGURED';
    throw err;
  }
  const extra = {};
  if (idempotencyKey) extra['x-idempotency-key'] = idempotencyKey;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const started = Date.now();
  const host = cashfreeHost(cfg.baseUrl);
  try {
    const response = await fetch(`${cfg.baseUrl}${path}`, {
      method,
      headers: headers(cfg, extra),
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await response.text();
    let data = {};
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: String(text || '').slice(0, 300) }; }
    if (!response.ok) {
      const err = new Error(data.message || data.error || `Cashfree request failed (${response.status})`);
      err.code = data.code || 'CASHFREE_API_ERROR';
      err.status = response.status;
      err.details = { type: data.type, code: data.code };
      logCashfreeFailure({
        host,
        method,
        path,
        status: response.status,
        code: data.code,
        type: data.type,
        message: data.message || data.error || err.message,
        elapsedMs: Date.now() - started,
      });
      throw err;
    }
    return data;
  } catch (error) {
    const elapsedMs = Date.now() - started;
    const timedOut = error?.name === 'AbortError';
    if (timedOut) {
      logCashfreeFailure({
        host,
        method,
        path,
        code: 'CASHFREE_TIMEOUT',
        message: `Cashfree request timed out after ${FETCH_TIMEOUT_MS}ms`,
        elapsedMs,
        timedOut: true,
      });
      const err = new Error(`Cashfree request timed out after ${FETCH_TIMEOUT_MS}ms`);
      err.code = 'CASHFREE_TIMEOUT';
      throw err;
    }
    if (!error?.status) {
      logCashfreeFailure({
        host,
        method,
        path,
        code: error?.code || error?.name,
        message: error?.message,
        elapsedMs,
      });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function createCashfreeOrder({ orderId, amount, currency, customer, returnUrl, notifyUrl, note }) {
  const cfg = cashfreeConfig();
  if (!cfg.configured) {
    return {
      order_id: orderId,
      cf_order_id: `mock_cf_${orderId}`,
      payment_session_id: `mock_session_${orderId}`,
      order_status: 'ACTIVE',
      order_amount: amount,
      order_currency: currency,
      mock: true,
    };
  }
  return cfFetch('/orders', {
    method: 'POST',
    idempotencyKey: orderId,
    body: {
      order_id: orderId,
      order_amount: Number(Number(amount).toFixed(2)),
      order_currency: currency || 'INR',
      customer_details: {
        customer_id: String(customer.id).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || `cust_${Date.now()}`,
        customer_name: customer.full_name,
        customer_email: customer.email,
        customer_phone: customer.phone,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
        payment_methods: 'upi',
      },
      order_note: note || 'SOLEVAULT UPI order',
      order_tags: {
        channel: 'upi',
        store: 'solevault',
      },
    },
  });
}

export async function getCashfreeOrder(orderId) {
  const cfg = cashfreeConfig();
  if (!cfg.configured) {
    return { order_id: orderId, order_status: 'ACTIVE', order_amount: 0, order_currency: 'INR', mock: true };
  }
  return cfFetch(`/orders/${encodeURIComponent(orderId)}`);
}

export async function getCashfreePayments(orderId) {
  const cfg = cashfreeConfig();
  if (!cfg.configured) return [];
  return cfFetch(`/orders/${encodeURIComponent(orderId)}/payments`);
}

export async function createCashfreeRefund({ orderId, refundId, amount, note }) {
  const cfg = cashfreeConfig();
  if (!cfg.configured) {
    return {
      refund_id: refundId,
      cf_refund_id: `mock_rf_${refundId}`,
      order_id: orderId,
      refund_amount: amount,
      refund_status: 'SUCCESS',
      refund_currency: 'INR',
      mock: true,
    };
  }
  return cfFetch(`/orders/${encodeURIComponent(orderId)}/refunds`, {
    method: 'POST',
    idempotencyKey: refundId,
    body: {
      refund_amount: Number(Number(amount).toFixed(2)),
      refund_id: refundId,
      refund_note: String(note || 'SOLEVAULT refund').slice(0, 100),
      refund_speed: 'STANDARD',
    },
  });
}

export function computeWebhookSignature(timestamp, rawBody, secret) {
  const signed = `${timestamp}${rawBody}`;
  return crypto.createHmac('sha256', secret).update(signed).digest('base64');
}

export function verifyWebhookSignature({ signature, timestamp, rawBody, secret, now = Date.now() }) {
  if (!signature || !timestamp || rawBody == null) {
    return { ok: false, reason: 'missing_signature_headers' };
  }
  if (!secret) return { ok: false, reason: 'missing_webhook_secret' };
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'invalid_timestamp' };
  if (Math.abs(now - ts) > WEBHOOK_MAX_AGE_MS) return { ok: false, reason: 'stale_timestamp' };
  const expected = computeWebhookSignature(timestamp, rawBody, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { ok: false, reason: 'signature_mismatch' };
  }
  return { ok: true };
}

export function parseWebhookPayload(rawBody) {
  const payload = typeof rawBody === 'string' ? JSON.parse(rawBody || '{}') : (rawBody || {});
  const type = payload.type || payload.event || '';
  const data = payload.data || {};
  const order = data.order || payload.order || {};
  const payment = data.payment || payload.payment || {};
  const refund = data.refund || payload.refund || {};
  return {
    type,
    eventTime: payload.event_time || payload.eventTime || '',
    orderId: order.order_id || payment.order_id || refund.order_id || '',
    cfOrderId: String(order.cf_order_id || ''),
    cfPaymentId: String(payment.cf_payment_id || refund.cf_payment_id || ''),
    orderAmount: Number(order.order_amount || payment.order_amount || 0),
    paymentAmount: Number(payment.payment_amount || order.order_amount || 0),
    currency: payment.payment_currency || order.order_currency || 'INR',
    paymentStatus: String(payment.payment_status || '').toUpperCase(),
    orderStatus: String(order.order_status || '').toUpperCase(),
    paymentGroup: payment.payment_group || payment.payment_method?.upi ? 'upi' : '',
    paymentMessage: payment.payment_message || '',
    bankReference: payment.bank_reference || '',
    refundId: refund.refund_id || '',
    cfRefundId: String(refund.cf_refund_id || ''),
    refundAmount: Number(refund.refund_amount || 0),
    refundStatus: String(refund.refund_status || '').toUpperCase(),
    payload,
  };
}

export function isSuccessfulPayment(parsed) {
  return parsed.paymentStatus === 'SUCCESS' || parsed.orderStatus === 'PAID';
}

export function validateCapturedPayment({ parsed, expectedAmount, expectedCurrency = 'INR', expectedOrderId }) {
  if (expectedOrderId && parsed.orderId && parsed.orderId !== expectedOrderId) {
    return { ok: false, reason: 'order_id_mismatch' };
  }
  if (!amountsMatch(parsed.paymentAmount || parsed.orderAmount, expectedAmount)) {
    return { ok: false, reason: 'amount_mismatch' };
  }
  if (String(parsed.currency || 'INR').toUpperCase() !== String(expectedCurrency).toUpperCase()) {
    return { ok: false, reason: 'currency_mismatch' };
  }
  if (!isSuccessfulPayment(parsed) && parsed.paymentStatus && parsed.paymentStatus !== 'SUCCESS') {
    return { ok: false, reason: 'not_successful' };
  }
  return { ok: true };
}

export function redactSecrets(value) {
  try {
    return JSON.stringify(value).replace(
      /("(?:x-client-secret|secret|authorization|password|CASHFREE_SECRET_KEY|CASHFREE_WEBHOOK_SECRET)"\s*:\s*")[^"]+/gi,
      '$1[REDACTED]',
    );
  } catch {
    return '[unserializable]';
  }
}
