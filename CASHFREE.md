# Cashfree UPI — production notes

## Secrets

Cashfree and Supabase **service** credentials must be set only in:

- the Secrets tab / Vercel Environment Variables UI, or
- a local `.env` that is gitignored

**Never commit secrets in `vercel.json`, source, or docs.**

Rotate immediately if any of these were ever committed:

- `SUPABASE_SERVICE_ROLE_KEY`
- `CASHFREE_SECRET_KEY`
- `CASHFREE_WEBHOOK_SECRET`
- `RECONCILE_CRON_SECRET`

The publishable Supabase anon key and Google client id are public by design.

## Required server env

| Name | Notes |
| --- | --- |
| `CASHFREE_ENV` | `SANDBOX` or `PRODUCTION` |
| `CASHFREE_APP_ID` | Merchant app id |
| `CASHFREE_SECRET_KEY` | Merchant secret (server only) |
| `CASHFREE_WEBHOOK_SECRET` | Defaults to `CASHFREE_SECRET_KEY` |
| `CASHFREE_API_VERSION` | Default `2025-01-01` |
| `APP_BASE_URL` | Public HTTPS origin for `return_url` / `notify_url` |
| `RECONCILE_CRON_SECRET` | Header `x-reconcile-secret` for `/api/reconcile` |

Optional (multi-instance rate limits):

| Name | Notes |
| --- | --- |
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |

Without Upstash, rate limits fall back to in-memory (local dev only).

## Webhook

Dashboard URL:

```
https://<APP_BASE_URL>/api/cashfree-webhook
```

Verification uses Cashfree's official HMAC:

```
x-webhook-timestamp + raw body
HMAC-SHA256(secret) → Base64
compare to x-webhook-signature (timing-safe)
```

The endpoint disables body parsing and hashes the **exact bytes** received. Do not JSON-parse then re-serialize before verifying.

## Sandbox check

1. Set `CASHFREE_ENV=SANDBOX` and sandbox credentials.
2. Sign in, checkout a pair, confirm Cashfree UPI sheet opens (`Cashfree({ mode })`, not `new`).
3. Confirmation page stays pending until the signed webhook or `/api/payments?action=reconcile` marks `PAID`.
4. Replay the same webhook — one payment, one stock capture.

## Production checklist

1. Rotate any previously committed keys.
2. Set production env in Vercel UI only.
3. Register the HTTPS webhook and confirm a signed test event returns 200.
4. Schedule `GET /api/reconcile` with `x-reconcile-secret` every 1–2 minutes.
5. Never mark `PAID` from the browser redirect.
