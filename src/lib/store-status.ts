import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export interface OpeningHours {
  days: string;
  hours: string;
}

export interface StoreSettings {
  accepting_orders: boolean;
  paused_message: string | null;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_fee: number;
  min_order_amount: number;
  accepting_reservations: boolean;
  reservations_paused_message: string | null;
  contact_form_enabled: boolean;
  announcement: string | null;
  phone: string;
  email: string;
  /** One line per row, e.g. street on the first line and city on the second. */
  address: string;
  opening_hours: OpeningHours[];
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
}

/** What the website shows before settings load, or if the migrations haven't been run. */
export const defaultStoreSettings: StoreSettings = {
  accepting_orders: true,
  paused_message: null,
  delivery_enabled: true,
  pickup_enabled: true,
  delivery_fee: 49,
  min_order_amount: 0,
  accepting_reservations: true,
  reservations_paused_message: null,
  contact_form_enabled: true,
  announcement: null,
  phone: "+1 (555) 012-3456",
  email: "hello@pizzaatelier.com",
  address: "214 Artisan Lane\nBrooklyn, NY 11201",
  opening_hours: [
    { days: "Mon – Thu", hours: "11:30 – 22:00" },
    { days: "Fri – Sat", hours: "11:30 – 23:00" },
    { days: "Sunday", hours: "12:00 – 21:30" },
  ],
  instagram_url: "https://instagram.com",
  facebook_url: "https://facebook.com",
  twitter_url: "https://twitter.com",
};

export const storeSettingsKey = ["store", "settings"];
export const soldOutKey = ["store", "sold-out"];

/**
 * Store settings set from /admin/settings. Falls back to the defaults if Supabase
 * or the table is unavailable, so the public site keeps working. Columns added by a
 * migration that hasn't been run yet also keep their defaults.
 */
export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    return await fetchStoreSettingsOrThrow();
  } catch {
    return defaultStoreSettings;
  }
}

/** Like fetchStoreSettings, but surfaces errors (e.g. a missing table) for the admin panel. */
export async function fetchStoreSettingsOrThrow(): Promise<StoreSettings> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("The store_settings row is missing");
  const merged = { ...defaultStoreSettings, ...data } as StoreSettings;
  return {
    ...merged,
    // NUMERIC columns arrive as strings.
    delivery_fee: Number(merged.delivery_fee),
    min_order_amount: Number(merged.min_order_amount),
    opening_hours: Array.isArray(merged.opening_hours) ? merged.opening_hours : [],
  };
}

export async function fetchSoldOutIds(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("sold_out_items").select("item_id");
  if (error || !data) return [];
  return data.map((row: { item_id: string }) => row.item_id);
}

export function useStoreSettings() {
  return useQuery({
    queryKey: storeSettingsKey,
    queryFn: fetchStoreSettings,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Store settings with defaults filled in while loading. */
export function useSiteSettings(): StoreSettings {
  return useStoreSettings().data ?? defaultStoreSettings;
}

/** `tel:` link for a display phone number like "+1 (555) 012-3456". */
export function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function addressLines(address: string) {
  return address
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Set of menu item ids marked sold out in /admin/menu. */
export function useSoldOut() {
  const query = useQuery({
    queryKey: soldOutKey,
    queryFn: fetchSoldOutIds,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  return new Set(query.data ?? []);
}
