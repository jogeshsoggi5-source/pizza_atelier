import type { AdminOrder } from "@/lib/admin-api";

const DAY = 86_400_000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Orders that count toward sales (everything except cancelled). */
export function salesOrders(orders: AdminOrder[]) {
  return orders.filter((o) => o.status !== "cancelled");
}

/** Orders placed within [daysAgoStart, daysAgoEnd) days before today, local time. */
export function ordersInRange(orders: AdminOrder[], days: number, offsetDays = 0) {
  const end = startOfDay(new Date()).getTime() + DAY - offsetDays * DAY;
  const start = end - days * DAY;
  return orders.filter((o) => {
    const t = new Date(o.created_at).getTime();
    return t >= start && t < end;
  });
}

export function revenue(orders: AdminOrder[]) {
  return orders.reduce((sum, o) => sum + o.grand_total, 0);
}

/** Fractional change from `previous` to `current`; null when there's no baseline. */
export function change(current: number, previous: number) {
  return previous > 0 ? (current - previous) / previous : null;
}

/** One row per day for the last `days` days (oldest first), zero-filled. */
export function dailySeries(orders: AdminOrder[], days: number) {
  const today = startOfDay(new Date());
  const rows = Array.from({ length: days }, (_, i) => {
    const date = new Date(today.getTime() - (days - 1 - i) * DAY);
    return {
      key: date.toDateString(),
      label: date.toLocaleDateString(undefined, days <= 7 ? { weekday: "short" } : { day: "numeric", month: "short" }),
      fullLabel: date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }),
      revenue: 0,
      orders: 0,
    };
  });
  const byKey = new Map(rows.map((r) => [r.key, r]));
  for (const o of salesOrders(orders)) {
    const row = byKey.get(new Date(o.created_at).toDateString());
    if (row) {
      row.revenue += o.grand_total;
      row.orders += 1;
    }
  }
  return rows;
}

/** Order counts per hour of day, trimmed to the hours that have orders (plus neighbours). */
export function hourlySeries(orders: AdminOrder[]) {
  const counts = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: "numeric" }),
    orders: 0,
  }));
  for (const o of salesOrders(orders)) counts[new Date(o.created_at).getHours()].orders += 1;
  const active = counts.filter((c) => c.orders > 0).map((c) => c.hour);
  if (active.length === 0) return counts.slice(11, 23);
  return counts.slice(Math.max(0, Math.min(...active) - 1), Math.min(24, Math.max(...active) + 2));
}

export function topItems(orders: AdminOrder[], limit = 8) {
  const byName = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of salesOrders(orders)) {
    for (const item of o.items) {
      const row = byName.get(item.name) ?? { name: item.name, qty: 0, revenue: 0 };
      row.qty += item.qty;
      row.revenue += item.qty * item.unit_price;
      byName.set(item.name, row);
    }
  }
  return [...byName.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
}

export function fulfillmentSplit(orders: AdminOrder[]) {
  const sales = salesOrders(orders);
  const delivery = sales.filter((o) => o.fulfillment_type === "delivery").length;
  return { delivery, pickup: sales.length - delivery, total: sales.length };
}
