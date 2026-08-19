-- SOLEVAULT Cashfree UPI schema
-- Matches api/_lib/db.js, api/orders.js and api/_lib/settlement.js.
-- Apply on a fresh database, or run the ALTER blocks on an existing store.

-- ---------------------------------------------------------------------------
-- Core catalog (existing SOLEVAULT tables, created if missing)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id text PRIMARY KEY,
  email text,
  full_name text,
  phone text,
  role text DEFAULT 'customer',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  id serial PRIMARY KEY,
  brand text NOT NULL,
  brand_slug text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL,
  category_slug text NOT NULL,
  description text,
  images jsonb DEFAULT '[]'::jsonb,
  specifications jsonb DEFAULT '{}'::jsonb,
  mrp numeric NOT NULL,
  sale_price numeric NOT NULL,
  sizes jsonb DEFAULT '[]'::jsonb,
  stock jsonb DEFAULT '{}'::jsonb,
  gender text DEFAULT 'Unisex',
  featured boolean DEFAULT false,
  popularity integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Orders — authoritative checkout + payment state
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  order_number text NOT NULL,
  user_id text NOT NULL,
  email text,
  customer_name text,
  phone text,
  address jsonb,
  payment_method text DEFAULT 'UPI',
  payment_status text NOT NULL DEFAULT 'CREATED',
  status text NOT NULL DEFAULT 'Pending',
  currency text DEFAULT 'INR',
  mrp_total numeric NOT NULL,
  discount_total numeric DEFAULT 0,
  shipping_total numeric DEFAULT 0,
  total numeric NOT NULL,
  cf_order_id text,
  payment_session_id text,
  cf_environment text,
  paid_at timestamptz,
  failure_reason text,
  idempotency_key text,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON orders (order_number);
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_key ON orders (idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id);
CREATE INDEX IF NOT EXISTS orders_payment_status_created_idx ON orders (payment_status, created_at);

CREATE TABLE IF NOT EXISTS order_items (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  product_id integer NOT NULL,
  brand text,
  product_name text,
  image text,
  size text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  mrp numeric NOT NULL,
  sale_price numeric NOT NULL
);

CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items (order_id);

-- ---------------------------------------------------------------------------
-- Inventory — source of truth for stock (optimistic version lock)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
  sku_key text PRIMARY KEY,
  product_id integer NOT NULL,
  size text NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reserved integer NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (product_id, size)
);

CREATE INDEX IF NOT EXISTS inventory_product_id_idx ON inventory (product_id);

-- ---------------------------------------------------------------------------
-- Payments + attempts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  user_id text NOT NULL,
  provider text DEFAULT 'cashfree',
  method text DEFAULT 'upi',
  status text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  cf_order_id text,
  cf_payment_id text,
  payment_message text,
  bank_reference text,
  source text,
  raw jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS payments_cf_payment_id_key ON payments (cf_payment_id) WHERE cf_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments (order_id);

CREATE TABLE IF NOT EXISTS payment_attempts (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  user_id text NOT NULL,
  provider text DEFAULT 'cashfree',
  method text DEFAULT 'upi',
  status text,
  amount numeric,
  currency text DEFAULT 'INR',
  cf_order_id text,
  payment_session_id text,
  created_at timestamptz DEFAULT now()
);

-- insertAttempt() catches Postgres 23505 — this unique index is the matching constraint.
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_session_key
  ON payment_attempts (payment_session_id)
  WHERE payment_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS payment_attempts_order_id_idx ON payment_attempts (order_id);

-- ---------------------------------------------------------------------------
-- Webhook ledger (dedup_key is the unique event key)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_events (
  dedup_key text PRIMARY KEY,
  id serial,
  event_type text NOT NULL,
  order_id text,
  cf_payment_id text,
  cf_refund_id text,
  signature_valid boolean DEFAULT false,
  source text,
  payload jsonb,
  raw_body_hash text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webhook_events_order_id_idx ON webhook_events (order_id);
CREATE INDEX IF NOT EXISTS webhook_events_created_at_idx ON webhook_events (created_at DESC);

-- ---------------------------------------------------------------------------
-- Refunds
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refunds (
  refund_id text PRIMARY KEY,
  id serial,
  order_id integer NOT NULL REFERENCES orders(id),
  payment_id integer,
  user_id text,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'INR',
  status text NOT NULL,
  reason text,
  requested_by text,
  cf_refund_id text,
  raw jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS refunds_cf_refund_id_key ON refunds (cf_refund_id) WHERE cf_refund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS refunds_order_id_idx ON refunds (order_id);

-- ---------------------------------------------------------------------------
-- Audit + idempotency + Cashfree ID maps
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id serial PRIMARY KEY,
  actor_id text,
  actor_role text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  order_id integer,
  from_state text,
  to_state text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_order_id_idx ON audit_logs (order_id);

CREATE TABLE IF NOT EXISTS checkout_idempotency (
  key text PRIMARY KEY,
  user_id text NOT NULL,
  order_id integer NOT NULL REFERENCES orders(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cf_order_map (
  cf_order_id text PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cf_payment_map (
  cf_payment_id text PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders(id),
  user_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 23505 mapping (db.js insertX that treat unique violations as idempotent hits)
-- ---------------------------------------------------------------------------
-- insertIdempotency  → checkout_idempotency.key            PRIMARY KEY
-- claimPaymentId     → cf_payment_map.cf_payment_id        PRIMARY KEY
-- insertCfOrderMap   → cf_order_map.cf_order_id            PRIMARY KEY
-- insertWebhookEvent → webhook_events.dedup_key            PRIMARY KEY
-- insertRefund       → refunds.refund_id                   PRIMARY KEY
-- insertAttempt      → payment_attempts.payment_session_id UNIQUE (partial)
--
-- insertPayment does NOT catch 23505. Uniqueness of a Cashfree payment is
-- enforced by cf_payment_map.cf_payment_id (claimed first) and the partial
-- unique index on payments.cf_payment_id as a second line of defence.
