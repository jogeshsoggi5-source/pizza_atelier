import type { Session } from "@supabase/supabase-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  fetchSoldOutIds,
  fetchStoreSettingsOrThrow,
  soldOutKey,
  storeSettingsKey,
  type StoreSettings,
} from "@/lib/store-status";
import { supabase } from "@/lib/supabase";
import type { OrderLine } from "@/lib/supabase-queries";

export const orderStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

/** The status an order usually moves to next, for one-click "Mark …" buttons. */
export const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed",
};

export const reservationStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;
export type ReservationStatus = (typeof reservationStatuses)[number];

export interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string | null;
  customer_phone: string | null;
  items: OrderLine[];
  total_amount: number;
  delivery_fee: number;
  grand_total: number;
  fulfillment_type: "delivery" | "pickup";
  delivery_address: string | null;
  status: OrderStatus;
  created_at: string;
}

export interface AdminReservation {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  special_requests: string | null;
  status: ReservationStatus;
  created_at: string;
}

/** Columns are TIMESTAMP (no zone) filled with UTC now(); mark them as UTC for Date parsing. */
function asUtc(timestamp: string) {
  return /(?:[zZ]|[+-]\d\d:?\d\d)$/.test(timestamp) ? timestamp : `${timestamp}Z`;
}

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

/** Tracks the signed-in Supabase user and whether they are listed in `admins`. */
export function useAdminSession() {
  const [state, setState] = useState<{
    loading: boolean;
    session: Session | null;
    isAdmin: boolean;
  }>({ loading: true, session: null, isAdmin: false });

  useEffect(() => {
    if (!supabase) {
      setState({ loading: false, session: null, isAdmin: false });
      return;
    }
    let active = true;

    const resolve = async (session: Session | null) => {
      if (!session) {
        if (active) setState({ loading: false, session: null, isAdmin: false });
        return;
      }
      const { data } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (active) setState({ loading: false, session, isAdmin: !!data });
    };

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) =>
      resolve(data.session),
    );
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        // Defer so we don't query Supabase from inside its own auth callback.
        setTimeout(() => resolve(session), 0);
      },
    );
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signIn(email: string, password: string) {
  const { error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await requireClient().auth.signOut();
}

export async function fetchOrders(): Promise<AdminOrder[]> {
  const { data, error } = await requireClient()
    .from("orders")
    .select(
      "id, order_number, customer_name, customer_phone, items, total_amount, delivery_fee, grand_total, fulfillment_type, delivery_address, status, created_at",
    )
    // Analytics looks back at most 90 days; Supabase caps a request at 1000 rows.
    .gte("created_at", new Date(Date.now() - 90 * 86_400_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map((o: AdminOrder) => ({
    ...o,
    total_amount: Number(o.total_amount),
    delivery_fee: Number(o.delivery_fee),
    grand_total: Number(o.grand_total),
    created_at: asUtc(o.created_at),
  }));
}

export async function setOrderStatus(id: string, status: OrderStatus) {
  const { error } = await requireClient()
    .from("orders")
    .update({
      status,
      updated_at: new Date().toISOString(),
      completed_at: status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchReservations(): Promise<AdminReservation[]> {
  const { data, error } = await requireClient()
    .from("reservations")
    .select(
      "id, customer_name, customer_email, customer_phone, reservation_date, reservation_time, party_size, special_requests, status, created_at",
    )
    .order("reservation_date", { ascending: false })
    .order("reservation_time", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((r: AdminReservation) => ({ ...r, created_at: asUtc(r.created_at) }));
}

export async function setReservationStatus(id: string, status: ReservationStatus) {
  const now = new Date().toISOString();
  const { error } = await requireClient()
    .from("reservations")
    .update({
      status,
      updated_at: now,
      ...(status === "confirmed" && { confirmed_at: now }),
      ...(status === "cancelled" && { cancelled_at: now }),
    })
    .eq("id", id);
  if (error) throw error;
}

export const messageStatuses = ["new", "read", "replied"] as const;
export type MessageStatus = (typeof messageStatuses)[number];

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  message_type: string | null;
  status: MessageStatus;
  created_at: string;
}

export async function fetchMessages(): Promise<ContactMessage[]> {
  const { data, error } = await requireClient()
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, message_type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []).map((m: ContactMessage) => ({ ...m, created_at: asUtc(m.created_at) }));
}

export async function setMessageStatus(id: string, status: MessageStatus) {
  const { error } = await requireClient()
    .from("contact_messages")
    .update({ status, replied_at: status === "replied" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMessage(id: string) {
  const { error } = await requireClient().from("contact_messages").delete().eq("id", id);
  if (error) throw error;
}

const ordersKey = ["admin", "orders"];
const reservationsKey = ["admin", "reservations"];
const messagesKey = ["admin", "messages"];

export function useOrders() {
  return useQuery({ queryKey: ordersKey, queryFn: fetchOrders, refetchInterval: 15_000 });
}

export function useOrderStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      setOrderStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ordersKey }),
    onError: (error: Error) => toast.error(`Couldn't update order: ${error.message}`),
  });
}

export function useReservations() {
  return useQuery({
    queryKey: reservationsKey,
    queryFn: fetchReservations,
    refetchInterval: 30_000,
  });
}

export function useReservationStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      setReservationStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reservationsKey }),
    onError: (error: Error) => toast.error(`Couldn't update reservation: ${error.message}`),
  });
}

export function useMessages() {
  return useQuery({ queryKey: messagesKey, queryFn: fetchMessages, refetchInterval: 60_000 });
}

export function useMessageStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MessageStatus }) =>
      setMessageStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messagesKey }),
    onError: (error: Error) => toast.error(`Couldn't update message: ${error.message}`),
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messagesKey }),
    onError: (error: Error) => toast.error(`Couldn't delete message: ${error.message}`),
  });
}

export function useAdminStoreSettings() {
  return useQuery({
    queryKey: [...storeSettingsKey, "admin"],
    queryFn: fetchStoreSettingsOrThrow,
    retry: false,
  });
}

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<StoreSettings>) => {
      const { error } = await requireClient()
        .from("store_settings")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: storeSettingsKey }),
    onError: (error: Error) =>
      toast.error(
        /column/i.test(error.message)
          ? `Couldn't save settings: ${error.message}. Run supabase/website_settings_migration.sql.`
          : `Couldn't save settings: ${error.message}`,
      ),
  });
}

export function useAdminSoldOut() {
  return useQuery({ queryKey: soldOutKey, queryFn: fetchSoldOutIds });
}

export function useToggleSoldOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, soldOut }: { itemId: string; soldOut: boolean }) => {
      const client = requireClient();
      const { error } = soldOut
        ? await client.from("sold_out_items").upsert({ item_id: itemId })
        : await client.from("sold_out_items").delete().eq("item_id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: soldOutKey }),
    onError: (error: Error) => toast.error(`Couldn't update item: ${error.message}`),
  });
}

export interface CustomerSummary {
  phone: string;
  name: string;
  orders: number;
  spent: number;
  firstOrder: string;
  lastOrder: string;
  lastAddress: string | null;
}

/** Groups non-cancelled orders by phone number into customer summaries, top spenders first. */
export function summarizeCustomers(orders: AdminOrder[]): CustomerSummary[] {
  const byPhone = new Map<string, CustomerSummary>();
  for (const o of orders) {
    if (o.status === "cancelled" || !o.customer_phone) continue;
    const key = o.customer_phone.replace(/[^\d+]/g, "");
    const c = byPhone.get(key);
    if (!c) {
      byPhone.set(key, {
        phone: o.customer_phone,
        name: o.customer_name ?? "—",
        orders: 1,
        spent: o.grand_total,
        firstOrder: o.created_at,
        lastOrder: o.created_at,
        lastAddress: o.delivery_address,
      });
      continue;
    }
    c.orders += 1;
    c.spent += o.grand_total;
    if (o.created_at < c.firstOrder) c.firstOrder = o.created_at;
    if (o.created_at > c.lastOrder) {
      c.lastOrder = o.created_at;
      c.name = o.customer_name ?? c.name;
      c.lastAddress = o.delivery_address ?? c.lastAddress;
    }
  }
  return [...byPhone.values()].sort((a, b) => b.spent - a.spent);
}

/** Downloads orders as a CSV file that opens in Excel / Google Sheets. */
export function downloadOrdersCsv(orders: AdminOrder[]) {
  const header = [
    "Order", "Date", "Status", "Type", "Customer", "Phone", "Address",
    "Items", "Subtotal", "Delivery fee", "Total",
  ];
  const rows = orders.map((o) => [
    o.order_number,
    new Date(o.created_at).toLocaleString(),
    o.status,
    o.fulfillment_type,
    o.customer_name ?? "",
    o.customer_phone ?? "",
    o.delivery_address ?? "",
    o.items
      .map((i) => `${i.qty}x ${i.name}${i.size ? ` (${i.size})` : ""}`)
      .join("; "),
    o.total_amount,
    o.delivery_fee,
    o.grand_total,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Opens a print dialog with an 80mm kitchen ticket for the order. */
export function printKitchenTicket(o: AdminOrder) {
  const w = window.open("", "_blank", "width=380,height=600");
  if (!w) {
    toast.error("Allow pop-ups to print tickets.");
    return;
  }
  const esc = (v: string) =>
    v.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const lines = o.items
    .map(
      (i) => `<tr><td><b>${i.qty}×</b> ${esc(i.name)}${i.size ? ` <i>(${esc(i.size)})</i>` : ""}${
        i.extras?.length ? `<br><small>+ ${esc(i.extras.join(", "))}</small>` : ""
      }</td><td class="r">${money(i.unit_price * i.qty)}</td></tr>`,
    )
    .join("");
  w.document.write(`<!doctype html><html><head><title>${esc(o.order_number)}</title><style>
    body{font:13px/1.4 ui-monospace,Menlo,Consolas,monospace;width:72mm;margin:0 auto;padding:4mm 0;color:#000}
    h1{font-size:18px;text-align:center;margin:0}
    .c{text-align:center}.r{text-align:right;white-space:nowrap;vertical-align:top}
    hr{border:0;border-top:1px dashed #000;margin:8px 0}
    table{width:100%;border-collapse:collapse}td{padding:2px 0;vertical-align:top}
    .big{font-size:16px;font-weight:700}
  </style></head><body>
    <h1>Pizza Atelier</h1>
    <p class="c">${new Date(o.created_at).toLocaleString()}</p>
    <hr><p class="c big">${esc(o.order_number)} · ${o.fulfillment_type.toUpperCase()}</p><hr>
    <p><b>${esc(o.customer_name ?? "")}</b><br>${esc(o.customer_phone ?? "")}${
      o.delivery_address ? `<br>${esc(o.delivery_address)}` : ""
    }</p><hr>
    <table>${lines}</table><hr>
    <table>
      <tr><td>Subtotal</td><td class="r">${money(o.total_amount)}</td></tr>
      ${o.delivery_fee ? `<tr><td>Delivery</td><td class="r">${money(o.delivery_fee)}</td></tr>` : ""}
      <tr class="big"><td>Total</td><td class="r">${money(o.grand_total)}</td></tr>
    </table><hr><p class="c">Pay on ${o.fulfillment_type === "delivery" ? "delivery" : "pickup"}</p>
  </body></html>`);
  w.document.close();
  w.focus();
  w.print();
}

/** Today's date as YYYY-MM-DD in the viewer's timezone. */
export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isToday(timestamp: string) {
  const d = new Date(timestamp);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}
