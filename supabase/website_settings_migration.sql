-- ============================================
-- Pizza Atelier — Website settings migration
-- (delivery/pickup, fees, reservations, contact form, announcement, business info)
-- Run AFTER admin_features_migration.sql: SQL Editor → New query → paste → Run.
-- Safe to re-run.
-- ============================================

-- --------------------------------------------
-- 1. New store settings. Defaults match what the website showed before.
-- --------------------------------------------
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(8, 2) NOT NULL DEFAULT 49,
  ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(8, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS accepting_reservations BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reservations_paused_message TEXT,
  ADD COLUMN IF NOT EXISTS contact_form_enabled BOOLEAN NOT NULL DEFAULT true,
  -- Banner across the top of every page; NULL hides it.
  ADD COLUMN IF NOT EXISTS announcement TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '+1 (555) 012-3456',
  ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT 'hello@pizzaatelier.com',
  ADD COLUMN IF NOT EXISTS address TEXT NOT NULL DEFAULT E'214 Artisan Lane\nBrooklyn, NY 11201',
  ADD COLUMN IF NOT EXISTS opening_hours JSONB NOT NULL DEFAULT
    '[{"days":"Mon – Thu","hours":"11:30 – 22:00"},{"days":"Fri – Sat","hours":"11:30 – 23:00"},{"days":"Sunday","hours":"12:00 – 21:30"}]'::jsonb,
  -- Empty or NULL hides the icon.
  ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT 'https://instagram.com',
  ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT 'https://facebook.com',
  ADD COLUMN IF NOT EXISTS twitter_url TEXT DEFAULT 'https://twitter.com';

-- --------------------------------------------
-- 2. Enforce the switches in the database, not just the UI.
-- --------------------------------------------
DROP POLICY IF EXISTS "public places orders" ON orders;
CREATE POLICY "public places orders" ON orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND COALESCE((
      SELECT s.accepting_orders
        AND CASE orders.fulfillment_type
              WHEN 'delivery' THEN s.delivery_enabled
              WHEN 'pickup' THEN s.pickup_enabled
              ELSE false
            END
        AND orders.total_amount >= s.min_order_amount
      FROM store_settings s WHERE s.id = 1
    ), true)
  );

DROP POLICY IF EXISTS "public books tables" ON reservations;
CREATE POLICY "public books tables" ON reservations
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'pending'
    AND COALESCE((SELECT accepting_reservations FROM store_settings WHERE id = 1), true)
  );

DROP POLICY IF EXISTS "public sends messages" ON contact_messages;
CREATE POLICY "public sends messages" ON contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (COALESCE((SELECT contact_form_enabled FROM store_settings WHERE id = 1), true));
