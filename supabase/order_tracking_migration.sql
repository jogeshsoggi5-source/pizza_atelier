-- ============================================
-- Pizza Atelier — Order tracking & SMS migration
-- Run AFTER admin_migration.sql: SQL Editor → New query → paste → Run.
-- Safe to re-run.
-- ============================================

-- --------------------------------------------
-- 1. Receipt token: a secret per order, used in the tracking link sent by SMS so the
--    customer can open their full receipt without typing their phone number.
-- --------------------------------------------
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_token UUID DEFAULT gen_random_uuid();
UPDATE orders SET receipt_token = gen_random_uuid() WHERE receipt_token IS NULL;

-- When the confirmation SMS went out, or why it failed.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sms_error TEXT;

-- --------------------------------------------
-- 2. Public order lookup. Visitors can't read the orders table (see admin_migration.sql),
--    so this returns one order by its number. Status and bill are shown to anyone with
--    the order number; the customer's name and address only when the caller also gives
--    the phone number it was placed with (last 10 digits) or its receipt token.
-- --------------------------------------------
CREATE OR REPLACE FUNCTION track_order(p_order_number TEXT, p_key TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'order_number', o.order_number,
    'customer_name', CASE WHEN o.verified THEN o.customer_name END,
    'items', o.items,
    'total_amount', o.total_amount,
    'delivery_fee', o.delivery_fee,
    'grand_total', o.grand_total,
    'fulfillment_type', o.fulfillment_type,
    'delivery_address', CASE WHEN o.verified THEN o.delivery_address END,
    'status', o.status,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'verified', o.verified
  )
  FROM (
    SELECT orders.*,
      coalesce(
        receipt_token::text = trim(p_key)
        OR (
          length(regexp_replace(p_key, '\D', '', 'g')) >= 10
          AND right(regexp_replace(coalesce(customer_phone, ''), '\D', '', 'g'), 10)
            = right(regexp_replace(p_key, '\D', '', 'g'), 10)
        ),
        false
      ) AS verified
    FROM orders
    WHERE upper(order_number) = upper(trim(p_order_number))
    LIMIT 1
  ) o;
$$;

REVOKE ALL ON FUNCTION track_order(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION track_order(TEXT, TEXT) TO anon, authenticated;
