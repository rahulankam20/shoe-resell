-- SOLEVAULT Row-Level Security Policies (Idempotent & Type-Safe)
-- CRITICAL: Without these, any user with the anon key can read/write ALL data
-- directly from the browser, bypassing API-layer auth checks.
--
-- The backend uses SUPABASE_SERVICE_ROLE_KEY (bypasses RLS), so these policies
-- only affect direct client-side access via the anon/anonymous key.
--
-- Strategy:
--   - User-scoped tables: users can only read/write their own rows (explicit auth.uid()::text cast)
--   - Public-read tables: products, inventory (anyone can browse)
--   - System-only write/read: webhook_events, cf_order_map, cf_payment_map, checkout_idempotency, audit_logs

-- ============================================================================
-- 1. Enable RLS on every table
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout_idempotency ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_order_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_payment_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. profiles: users can read/update their own; admins can read all
-- ============================================================================
DROP POLICY IF EXISTS "profiles_self_read" ON profiles;
CREATE POLICY "profiles_self_read" ON profiles FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
CREATE POLICY "profiles_self_update" ON profiles FOR UPDATE USING (auth.uid()::text = id) WITH CHECK (auth.uid()::text = id);

DROP POLICY IF EXISTS "profiles_self_insert" ON profiles;
CREATE POLICY "profiles_self_insert" ON profiles FOR INSERT WITH CHECK (auth.uid()::text = id);

-- ============================================================================
-- 3. products: anyone can read; only service role (backend) can write
-- ============================================================================
DROP POLICY IF EXISTS "products_public_read" ON products;
CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);

-- ============================================================================
-- 4. orders: users can read their own orders only
-- ============================================================================
DROP POLICY IF EXISTS "orders_self_read" ON orders;
CREATE POLICY "orders_self_read" ON orders FOR SELECT USING (auth.uid()::text = user_id);

-- ============================================================================
-- 5. order_items: users can read items for their own orders
-- ============================================================================
DROP POLICY IF EXISTS "order_items_self_read" ON order_items;
CREATE POLICY "order_items_self_read" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()::text)
);

-- ============================================================================
-- 6. inventory: public read (for stock display); write via service role only
-- ============================================================================
DROP POLICY IF EXISTS "inventory_public_read" ON inventory;
CREATE POLICY "inventory_public_read" ON inventory FOR SELECT USING (true);

-- ============================================================================
-- 7. payments: users can read payments for their own orders
-- ============================================================================
DROP POLICY IF EXISTS "payments_self_read" ON payments;
CREATE POLICY "payments_self_read" ON payments FOR SELECT USING (auth.uid()::text = user_id);

-- ============================================================================
-- 8. payment_attempts: users can read attempts for their own orders
-- ============================================================================
DROP POLICY IF EXISTS "payment_attempts_self_read" ON payment_attempts;
CREATE POLICY "payment_attempts_self_read" ON payment_attempts FOR SELECT USING (auth.uid()::text = user_id);

-- ============================================================================
-- 9. refunds: users can read refunds for their own orders
-- ============================================================================
DROP POLICY IF EXISTS "refunds_self_read" ON refunds;
CREATE POLICY "refunds_self_read" ON refunds FOR SELECT USING (auth.uid()::text = user_id);

-- ============================================================================
-- 10. webhook_events: no direct client access (system-only)
-- ============================================================================
DROP POLICY IF EXISTS "webhook_events_deny_client" ON webhook_events;
CREATE POLICY "webhook_events_deny_client" ON webhook_events FOR SELECT USING (false);

-- ============================================================================
-- 11. audit_logs: no direct client access (system-only)
-- ============================================================================
DROP POLICY IF EXISTS "audit_logs_deny_client" ON audit_logs;
CREATE POLICY "audit_logs_deny_client" ON audit_logs FOR SELECT USING (false);

-- ============================================================================
-- 12. checkout_idempotency: no direct client access (system-only)
-- ============================================================================
DROP POLICY IF EXISTS "checkout_idempotency_deny_client" ON checkout_idempotency;
CREATE POLICY "checkout_idempotency_deny_client" ON checkout_idempotency FOR SELECT USING (false);

-- ============================================================================
-- 13. cf_order_map: no direct client access (system-only)
-- ============================================================================
DROP POLICY IF EXISTS "cf_order_map_deny_client" ON cf_order_map;
CREATE POLICY "cf_order_map_deny_client" ON cf_order_map FOR SELECT USING (false);

-- ============================================================================
-- 14. cf_payment_map: no direct client access (system-only)
-- ============================================================================
DROP POLICY IF EXISTS "cf_payment_map_deny_client" ON cf_payment_map;
CREATE POLICY "cf_payment_map_deny_client" ON cf_payment_map FOR SELECT USING (false);

-- ============================================================================
-- 15. addresses: users can only read/write their own addresses
-- ============================================================================
DROP POLICY IF EXISTS "addresses_self_read" ON addresses;
CREATE POLICY "addresses_self_read" ON addresses FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "addresses_self_insert" ON addresses;
CREATE POLICY "addresses_self_insert" ON addresses FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "addresses_self_update" ON addresses;
CREATE POLICY "addresses_self_update" ON addresses FOR UPDATE USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "addresses_self_delete" ON addresses;
CREATE POLICY "addresses_self_delete" ON addresses FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================================================
-- 16. wishlists: users can only read/write their own wishlist
-- ============================================================================
DROP POLICY IF EXISTS "wishlists_self_read" ON wishlists;
CREATE POLICY "wishlists_self_read" ON wishlists FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "wishlists_self_insert" ON wishlists;
CREATE POLICY "wishlists_self_insert" ON wishlists FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "wishlists_self_delete" ON wishlists;
CREATE POLICY "wishlists_self_delete" ON wishlists FOR DELETE USING (auth.uid()::text = user_id);
