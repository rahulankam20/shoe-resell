# SOLEVAULT

Independent footwear storefront with production-grade **Cashfree UPI** checkout.

The original catalog, auth, cart, wishlist, addresses and admin console remain in place. Demo checkout has been replaced by a server-authoritative Cashfree flow: the browser never decides price, stock or payment success.

## Architecture

```
Customer (auth required)
  → POST /api/orders
      validate cart/products/sizes/address on the server
      recalculate MRP, discount, shipping, total
      reserve inventory with optimistic version locks
      insert PAYMENT_PENDING order + items
      create Cashfree order (UPI only) AFTER the DB write
      return payment_session_id only
  → Cashfree JS checkout (UPI)
  → redirect is UX only
  → POST /api/cashfree-webhook  (HMAC over raw body)
      or POST /api/payments?action=reconcile
  → ACID-style settlement:
      claim unique cf_payment_id
      re-read order + inventory
      verify amount/currency/ownership/state
      capture stock once
      insert payment + mark PAID + audit
```

Cashfree is never called while a DB transaction is held. Inventory uses `quantity` / `reserved` / `version` so two shoppers cannot buy the last pair.

## Changed files

**New**
- `api/_lib/cashfree.js` — official Create Order / Get Order / Payments / Refunds + webhook HMAC
- `api/_lib/settlement.js` — idempotent pay/fail/refund processing
- `api/_lib/inventory.js` — reserve / capture / release with version checks
- `api/_lib/state.js` — explicit payment, refund and fulfillment machines
- `api/_lib/db.js`, `auth.js`, `http.js`, `rateLimit.js`, `validation.js`, `audit.js`
- `api/cashfree-webhook.js` — dedicated signed webhook endpoint
- `api/payments.js` — status + reconcile + admin refunds
- `api/reconcile.js` — batch catch-up for missed webhooks
- `api/admin-payments.js` — payment ledger for admin
- `server/__tests__/payment.test.js` — unit/integration/concurrency tests
- `migrations/001_solevault_payments.sql` — unique constraints, CHECKs, indexes
- `CASHFREE.md` — setup, webhook HMAC, secrets rotation

**Updated**
- `api/orders.js` — server-side checkout + Cashfree order create (no more demo charge)
- `src/pages/CheckoutPage.tsx` — Cashfree UPI checkout SDK
- `src/pages/OrderConfirmationPage.tsx` — polls server status, never trusts redirect
- `src/pages/AdminPage.tsx` — payment status, Cashfree IDs, refunds, webhook log
- `src/pages/AccountPage.tsx`, `CartPage.tsx` — payment state in the existing UI

## Database

Existing tables stay: `profiles`, `products`, `brands`, `categories`, `addresses`, `wishlists`, `orders`, `order_items`.

`orders` is extended with:
`payment_status`, `currency`, `cf_order_id`, `payment_session_id`, `cf_environment`, `paid_at`, `failure_reason`, `version`, `idempotency_key`.

New tables:
- `inventory` — `(sku_key PK, product_id, size, quantity, reserved, version)` unique + check `quantity >= 0`, `reserved >= 0`
- `payments` — captured UPI payments bound to order + user
- `payment_attempts` — each Cashfree session
- `webhook_events` — unique `dedup_key`
- `refunds` — unique merchant `refund_id`
- `audit_logs`
- `checkout_idempotency` — unique checkout key
- `cf_order_map` / `cf_payment_map` — unique Cashfree IDs

## Environment

Sandbox and production share the same code path. Switch with env only.

```
CASHFREE_ENV=SANDBOX|PRODUCTION
CASHFREE_APP_ID=
CASHFREE_SECRET_KEY=
CASHFREE_WEBHOOK_SECRET=          # defaults to SECRET_KEY
CASHFREE_API_VERSION=2025-01-01
CASHFREE_MOCK=true                # local/dev without merchant keys
APP_BASE_URL=https://your-domain
RECONCILE_CRON_SECRET=
```

Add Cashfree and database keys **only** via the Secrets tab / Vercel Environment Variables UI. Never put them in `vercel.json`, git, or client bundles. See `.env.example` and `CASHFREE.md`.

If `SUPABASE_SERVICE_ROLE_KEY`, Cashfree secrets, or a reconcile secret were ever committed, **rotate them before deploy**.

Webhook URL to register in the Cashfree dashboard:

```
https://<your-domain>/api/cashfree-webhook
```

Subscribe at least to payment success, failed, user-dropped and refund events. Use the raw body for signature verification (`x-webhook-timestamp` + raw JSON, HMAC-SHA256, Base64).

## Sandbox tests

```
npm test
npm run build
npm run lint
```

Covered:
- success / failure / pending UPI
- duplicate + replay + out-of-order webhooks
- invalid signatures and amount mismatch
- unauthorized / foreign order IDs
- duplicate checkout keys
- concurrent last-unit purchase
- capture rollback
- reconciliation after a missed webhook
- refund uniqueness and state

Cashfree sandbox UPI: create an order in the app, pay with the sandbox UPI intent, confirm `/order-confirmation` stays pending until the webhook/reconcile marks `PAID`.

## Production checklist

1. Set `CASHFREE_ENV=PRODUCTION` and live app id / secret / webhook secret.
2. Register the HTTPS webhook and verify a signed test event.
3. Confirm `APP_BASE_URL` matches the live origin (`return_url` + `notify_url`).
4. Restrict CORS to your domains (already origin-aware).
5. Schedule `GET /api/reconcile` with `x-reconcile-secret` every 1–2 minutes.
6. Never mark PAID from the frontend redirect.
7. Keep inventory `version` updates; do not write `products.stock` as the source of truth.
8. Rotate Cashfree secrets if they leak. Treat any logged secret as compromised.

## Security

- Auth required for checkout, order read (IDOR: users only see their rows; admin is role-gated).
- Authoritative totals recalculated from `products` + `inventory`.
- Cashfree IDs bound to internal order + `user_id`.
- Webhook HMAC + 5 minute timestamp window + unique event keys.
- Rate limits on checkout, webhook and reconcile.
- Security headers: nosniff, DENY framing, no-store, permissions-policy.
- Refunds are admin-only, idempotent and audited.
