import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export interface StoreSettings {
  accepting_orders: boolean;
  paused_message: string | null;
}

const defaultSettings: StoreSettings = { accepting_orders: true, paused_message: null };

export const storeSettingsKey = ["store", "settings"];
export const soldOutKey = ["store", "sold-out"];

/**
 * Store settings set from /admin/settings. Falls back to "open" if Supabase or
 * the table is unavailable, so the public site keeps working.
 */
export async function fetchStoreSettings(): Promise<StoreSettings> {
  if (!supabase) return defaultSettings;
  const { data, error } = await supabase
    .from("store_settings")
    .select("accepting_orders, paused_message")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return defaultSettings;
  return data;
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
