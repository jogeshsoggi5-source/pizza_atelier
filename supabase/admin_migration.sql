-- ============================================
-- Pizza Atelier — Admin panel migration
-- Run once in Supabase: SQL Editor → New query → paste → Run.
-- Safe to re-run.
-- ============================================

-- --------------------------------------------
-- 1. Orders: store the customer and cart lines on the order itself.
--    The website menu lives in code (src/lib/menu-data.ts), so cart lines are
--    kept as JSON instead of rows in order_items → menu_items.
-- --------------------------------------------
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Reservations come from a public form with no customer account.
ALTER TABLE reservations ALTER COLUMN customer_id DROP NOT NULL;

-- --------------------------------------------
-- 2. Admins: Supabase Auth users allowed into /admin.
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

-- --------------------------------------------
-- 3. Row Level Security.
--    Visitors may only INSERT orders and reservations; only admins can read or
--    change them. Customer and staff tables become admin-only.
-- --------------------------------------------
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read self" ON admins;
CREATE POLICY "admins read self" ON admins
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "public places orders" ON orders;
CREATE POLICY "public places orders" ON orders
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
DROP POLICY IF EXISTS "admins manage orders" ON orders;
CREATE POLICY "admins manage orders" ON orders
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admins manage order items" ON order_items;
CREATE POLICY "admins manage order items" ON order_items
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public books tables" ON reservations;
CREATE POLICY "public books tables" ON reservations
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
DROP POLICY IF EXISTS "admins manage reservations" ON reservations;
CREATE POLICY "admins manage reservations" ON reservations
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public sends messages" ON contact_messages;
CREATE POLICY "public sends messages" ON contact_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "admins manage messages" ON contact_messages;
CREATE POLICY "admins manage messages" ON contact_messages
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admins manage customers" ON customers;
CREATE POLICY "admins manage customers" ON customers
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admins manage staff" ON staff;
CREATE POLICY "admins manage staff" ON staff
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "public reads menu" ON menu_items;
CREATE POLICY "public reads menu" ON menu_items
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins manage menu" ON menu_items;
CREATE POLICY "admins manage menu" ON menu_items
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- --------------------------------------------
-- 4. Make yourself an admin.
--    First create a user: Authentication → Users → Add user (email + password,
--    tick "Auto Confirm User"). Then replace the email below and run this line.
-- --------------------------------------------
-- INSERT INTO admins (user_id)
--   SELECT id FROM auth.users WHERE email = 'you@example.com'
--   ON CONFLICT DO NOTHING;
