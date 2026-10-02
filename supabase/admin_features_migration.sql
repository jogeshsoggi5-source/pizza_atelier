-- ============================================
-- Pizza Atelier — Admin features migration (sold-out items, pause orders)
-- Run AFTER admin_migration.sql: SQL Editor → New query → paste → Run.
-- Safe to re-run.
-- ============================================

-- --------------------------------------------
-- 1. Store settings (single row, id = 1)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS store_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  accepting_orders BOOLEAN NOT NULL DEFAULT true,
  -- Shown on the order page while orders are paused.
  paused_message TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public reads settings" ON store_settings;
CREATE POLICY "public reads settings" ON store_settings
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins update settings" ON store_settings;
CREATE POLICY "admins update settings" ON store_settings
  FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- --------------------------------------------
-- 2. Sold-out menu items (ids from src/lib/menu-data.ts)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS sold_out_items (
  item_id TEXT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sold_out_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public reads sold out" ON sold_out_items;
CREATE POLICY "public reads sold out" ON sold_out_items
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "admins manage sold out" ON sold_out_items;
CREATE POLICY "admins manage sold out" ON sold_out_items
  FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- --------------------------------------------
-- 3. Refuse new orders while paused (enforced in the database, not just the UI)
-- --------------------------------------------
DROP POLICY IF EXISTS "public places orders" ON orders;
CREATE POLICY "public places orders" ON orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND COALESCE((SELECT accepting_orders FROM store_settings WHERE id = 1), true)
  );
