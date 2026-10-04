import { supabase } from "@/lib/supabase";
import type { OrderLine } from "@/lib/supabase-queries";

export type TrackedStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface TrackedOrder {
  order_number: string;
  customer_name: string | null;
  items: OrderLine[];
  total_amount: number;
  delivery_fee: number;
  grand_total: number;
  fulfillment_type: "delivery" | "pickup";
  delivery_address: string | null;
  status: TrackedStatus;
  created_at: string;
  updated_at: string | null;
  /** True when looked up with the phone number or receipt token; name and address are shown only then. */
  verified: boolean;
}

/** Columns are TIMESTAMP (no zone) filled with UTC now(); mark them as UTC for Date parsing. */
function asUtc(timestamp: string) {
  return /(?:[zZ]|[+-]\d\d:?\d\d)$/.test(timestamp) ? timestamp : `${timestamp}Z`;
}

/**
 * Looks up one order by number. The optional key — the customer's phone number or the
 * receipt token from their SMS link — unlocks the name and delivery address
 * (see supabase/order_tracking_migration.sql). Resolves to null when nothing matches.
 */
export async function trackOrder(orderNumber: string, key?: string): Promise<TrackedOrder | null> {
  if (!supabase) throw new Error("Order tracking is unavailable right now.");
  const { data, error } = await supabase.rpc("track_order", {
    p_order_number: orderNumber.trim(),
    p_key: key?.trim() || null,
  });
  if (error) throw new Error("We couldn't look up orders right now. Please try again or call us.");
  if (!data) return null;
  const o = data as TrackedOrder;
  return {
    ...o,
    total_amount: Number(o.total_amount),
    delivery_fee: Number(o.delivery_fee),
    grand_total: Number(o.grand_total),
    created_at: asUtc(o.created_at),
    updated_at: o.updated_at ? asUtc(o.updated_at) : null,
    verified: !!o.verified,
  };
}

/** Steps shown on the tracking timeline, in order. */
export function trackingSteps(fulfillment: "delivery" | "pickup") {
  return [
    { status: "pending", label: "Order placed" },
    { status: "confirmed", label: "Confirmed" },
    { status: "preparing", label: "In the oven" },
    {
      status: "ready",
      label: fulfillment === "delivery" ? "Out for delivery" : "Ready for pickup",
    },
    { status: "completed", label: fulfillment === "delivery" ? "Delivered" : "Picked up" },
  ] as const;
}

/** Path of the tracking page that opens straight to an order's receipt. */
export function receiptPath(orderNumber: string, token?: string | null) {
  const params = new URLSearchParams({ order: orderNumber });
  if (token) params.set("t", token);
  return `/track?${params.toString()}`;
}

const recentKey = "pizza-atelier:last-order";

/** Remembers the visitor's last order in this browser so /track can offer it. */
export function rememberOrder(orderNumber: string, token?: string) {
  try {
    localStorage.setItem(recentKey, JSON.stringify({ orderNumber, token }));
  } catch {
    // Storage blocked (private mode) — tracking still works by phone number.
  }
}

export function recallOrder(): { orderNumber: string; token?: string } | null {
  try {
    const raw = localStorage.getItem(recentKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
