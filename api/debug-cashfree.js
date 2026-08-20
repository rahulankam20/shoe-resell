// GET /api/debug-cashfree
// Diagnostic-only endpoint. No auth, no DB, no cart.
// Calls Cashfree sandbox with the same cfFetch() used by api/orders.js.
// Returns full JSON result — success or failure — never hangs or returns a bodyless crash.
// REMOVE OR GATE BEHIND A SECRET before going to production.

import { cashfreeConfig, cfFetch } from './_lib/cashfree.js';
import { applySecurityHeaders } from './_lib/http.js';



const PROBE_TIMEOUT_MS = 5000;

export default async function handler(req, res) {
  applySecurityHeaders(req, res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const cfg = cashfreeConfig();
  const started = Date.now();

  // Step 1: DNS + TLS probe — raw fetch to Cashfree host, no credentials
  let dnsProbe = null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const dnsStart = Date.now();
    try {
      await fetch(
        cfg.environment === 'PRODUCTION'
          ? 'https://api.cashfree.com/pg'
          : 'https://sandbox.cashfree.com/pg',
        { method: 'GET', signal: controller.signal },
      );
      dnsProbe = { ok: true, elapsedMs: Date.now() - dnsStart };
    } catch (err) {
      dnsProbe = {
        ok: false,
        elapsedMs: Date.now() - dnsStart,
        name: err?.name,
        code: err?.code,
        message: err?.message,
        timedOut: err?.name === 'AbortError',
      };
    } finally {
      clearTimeout(t);
    }
  } catch (outerErr) {
    dnsProbe = { ok: false, message: outerErr?.message };
  }

  // Step 2: Real Cashfree create-order call via cfFetch (identical code path to api/orders.js)
  let cfProbe = null;
  const dummyOrderId = `debug_probe_${Date.now()}`;
  try {
    // Use a hard outer timeout so this endpoint NEVER hangs
    let probeTimer;
    const probeResult = await Promise.race([
      cfFetch('/orders', {
        method: 'POST',
        idempotencyKey: dummyOrderId,
        body: {
          order_id: dummyOrderId,
          order_amount: 1.00,
          order_currency: 'INR',
          customer_details: {
            customer_id: 'debug_probe_customer',
            customer_name: 'Debug Probe',
            customer_email: 'debug@probe.local',
            customer_phone: '9999999999',
          },
          order_meta: {
            return_url: 'https://probe.local/return',
            notify_url: 'https://probe.local/webhook',
            payment_methods: 'upi',
          },
          order_note: 'debug probe — safe to ignore',
        },
      }),
      new Promise((_resolve, reject) => {
        probeTimer = setTimeout(() => {
          reject(Object.assign(new Error(`Debug probe timed out after ${PROBE_TIMEOUT_MS}ms`), {
            code: 'PROBE_TIMEOUT',
            name: 'TimeoutError',
          }));
        }, PROBE_TIMEOUT_MS);
      }),
    ]);
    clearTimeout(probeTimer);
    cfProbe = {
      ok: true,
      elapsedMs: Date.now() - started,
      cf_order_id: probeResult?.cf_order_id,
      order_status: probeResult?.order_status,
      has_session: Boolean(probeResult?.payment_session_id),
    };
  } catch (err) {
    cfProbe = {
      ok: false,
      elapsedMs: Date.now() - started,
      name: err?.name,
      code: err?.code,
      httpStatus: err?.status,
      message: err?.message,
      timedOut: err?.name === 'AbortError' || err?.code === 'CASHFREE_TIMEOUT' || err?.code === 'PROBE_TIMEOUT',
      details: err?.details ?? null,
    };
  }

  // Diagnosis hint based on result
  let diagnosis = null;
  if (!dnsProbe?.ok && dnsProbe?.timedOut) {
    diagnosis = '(a) DNS resolution or TCP connection to Cashfree is timing out — likely an egress firewall or DNS block on this runtime';
  } else if (!dnsProbe?.ok && /certificate|tls|ssl/i.test(dnsProbe?.message || '')) {
    diagnosis = '(b) TLS/certificate handshake failure — runtime may have outdated CA bundle';
  } else if (!dnsProbe?.ok) {
    diagnosis = `(c) Outbound network failure to Cashfree host: ${dnsProbe?.message}`;
  } else if (dnsProbe?.ok && cfProbe?.timedOut) {
    diagnosis = '(d) DNS/TLS works but Cashfree API request times out — platform-level egress throttle or short function timeout killing the call';
  } else if (dnsProbe?.ok && !cfProbe?.ok) {
    diagnosis = `Cashfree API returned an error (HTTP ${cfProbe?.httpStatus}): ${cfProbe?.message}`;
  } else if (cfProbe?.ok) {
    diagnosis = 'All clear — Cashfree is reachable and credentials are valid from this runtime. The 502 is likely caused by a different code path.';
  }

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    environment: cfg.environment,
    configured: cfg.configured,
    cashfree_host: cfg.environment === 'PRODUCTION' ? 'api.cashfree.com' : 'sandbox.cashfree.com',
    probe_timeout_ms: PROBE_TIMEOUT_MS,
    dns_tls_probe: dnsProbe,
    cashfree_api_probe: cfProbe,
    total_elapsed_ms: Date.now() - started,
    diagnosis,
  });
}
