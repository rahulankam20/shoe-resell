import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { getRawBody } from '../../api/_lib/http.js';
import { computeWebhookSignature, verifyWebhookSignature } from '../../api/_lib/cashfree.js';

const SECRET = 'test_cashfree_secret';

function spacedPayload() {
  return '{ "type" : "PAYMENT_SUCCESS_WEBHOOK", "event_time" : "2026-04-12T10:00:00+05:30", "data" : { "order" : { "order_id" : "SVTESTORDER01", "order_amount" : 5148, "order_currency" : "INR", "order_status" : "PAID", "cf_order_id" : "cf_10" }, "payment" : { "cf_payment_id" : "pay_raw_1", "payment_status" : "SUCCESS", "payment_amount" : 5148, "payment_currency" : "INR", "payment_group" : "upi", "payment_message" : "ok" } } }';
}

function mockRes() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; },
    end() { return this; },
  };
}

function streamReq(raw, headers = {}) {
  const req = Readable.from([Buffer.from(raw)]);
  req.method = 'POST';
  req.headers = {
    'content-type': 'application/json',
    ...headers,
  };
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

async function loadHandler() {
  process.env.NEXT_PUBLIC_SUPABASE_URL ||= 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'test-service-role';
  process.env.CASHFREE_WEBHOOK_SECRET = SECRET;
  process.env.CASHFREE_SECRET_KEY = SECRET;
  delete process.env.CASHFREE_APP_ID;
  delete process.env.CASHFREE_MOCK;
  const mod = await import('../../api/cashfree-webhook.js');
  return mod.default;
}

test('getRawBody reads the request stream as the exact bytes sent', async () => {
  const raw = spacedPayload();
  const req = streamReq(raw);
  const body = await getRawBody(req);
  assert.equal(body, raw);
  assert.notEqual(body, JSON.stringify(JSON.parse(raw)));
});

test('HTTP webhook handler verifies HMAC against the exact Buffer body, not re-serialized JSON', async () => {
  const handler = await loadHandler();
  const raw = spacedPayload();
  const timestamp = String(Date.now());
  const signature = computeWebhookSignature(timestamp, raw, SECRET);

  assert.equal(verifyWebhookSignature({ signature, timestamp, rawBody: raw, secret: SECRET }).ok, true);
  assert.equal(verifyWebhookSignature({
    signature,
    timestamp,
    rawBody: JSON.stringify(JSON.parse(raw)),
    secret: SECRET,
  }).ok, false);

  const req = streamReq(raw, {
    'x-webhook-signature': signature,
    'x-webhook-timestamp': timestamp,
  });
  const res = mockRes();
  await handler(req, res);

  assert.notEqual(res.statusCode, 401, `signature rejected against exact bytes: ${JSON.stringify(res.body)}`);
  assert.ok(res.statusCode === 200 || res.statusCode === 500);

  const badReq = streamReq(raw, {
    'x-webhook-signature': 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    'x-webhook-timestamp': timestamp,
  });
  const badRes = mockRes();
  await handler(badReq, badRes);
  assert.equal(badRes.statusCode, 401);
  assert.equal(badRes.body.error, 'Invalid webhook signature');
});
