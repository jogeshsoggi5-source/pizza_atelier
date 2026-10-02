import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarCheck,
  ChefHat,
  Clock,
  IndianRupee,
  Receipt,
  ShoppingBag,
  Trophy,
} from "lucide-react";

import { RevenueChart } from "@/components/admin/charts";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import {
  change,
  dailySeries,
  ordersInRange,
  revenue,
  salesOrders,
  topItems,
} from "@/lib/admin-analytics";
import { todayISO, useOrders, useReservations } from "@/lib/admin-api";
import { formatPrice } from "@/lib/menu-data";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function timeAgo(timestamp: string) {
  const mins = Math.round((Date.now() - new Date(timestamp).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return hours < 24 ? `${hours} h ago` : new Date(timestamp).toLocaleDateString();
}

function AdminDashboard() {
  const { data: orders = [], error: ordersError } = useOrders();
  const { data: reservations = [], error: reservationsError } = useReservations();
  const today = todayISO();

  const todaySales = salesOrders(ordersInRange(orders, 1));
  const yesterdaySales = salesOrders(ordersInRange(orders, 1, 1));
  const todayRevenue = revenue(todaySales);
  const avgOrder = todaySales.length ? todayRevenue / todaySales.length : 0;
  const yesterdayAvg = yesterdaySales.length ? revenue(yesterdaySales) / yesterdaySales.length : 0;

  const liveQueue = orders
    .filter((o) => ["pending", "confirmed", "preparing", "ready"].includes(o.status))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  const todaysTables = reservations
    .filter((r) => r.reservation_date === today && r.status !== "cancelled")
    .sort((a, b) => a.reservation_time.localeCompare(b.reservation_time));
  const week = dailySeries(orders, 7);
  const bestSellers = topItems(ordersInRange(orders, 7), 5);

  const error = ordersError ?? reservationsError;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        title={greeting()}
        description="Here's how the kitchen is doing today."
      />

      {error && (
        <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {(error as Error).message}. Have you run the SQL files in <code>supabase/</code>?
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label="Revenue today"
          value={formatPrice(todayRevenue)}
          icon={IndianRupee}
          delta={change(todayRevenue, revenue(yesterdaySales))}
          hint="vs yesterday"
        />
        <StatCard
          label="Orders today"
          value={String(todaySales.length)}
          icon={ShoppingBag}
          delta={change(todaySales.length, yesterdaySales.length)}
          hint="vs yesterday"
        />
        <StatCard
          label="Avg order value"
          value={formatPrice(Math.round(avgOrder))}
          icon={Receipt}
          delta={change(avgOrder, yesterdayAvg)}
          hint="vs yesterday"
        />
        <StatCard
          label="Tables today"
          value={String(todaysTables.length)}
          icon={CalendarCheck}
          hint={`${todaysTables.reduce((s, r) => s + r.party_size, 0)} guests expected`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Revenue · last 7 days"
          action={
            <Link to="/admin/analytics" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <p className="-mt-2 mb-3 font-display text-2xl font-bold tabular-nums">
            {formatPrice(week.reduce((s, d) => s + d.revenue, 0))}
          </p>
          <RevenueChart data={week} height={240} />
        </Panel>

        <Panel title="Best sellers · 7 days">
          {bestSellers.length === 0 ? (
            <EmptyState icon={Trophy}>No sales yet this week.</EmptyState>
          ) : (
            <ol className="space-y-3">
              {bestSellers.map((item, i) => (
                <li key={item.name} className="flex items-center gap-3 text-sm">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i === 0 ? "bg-gold text-charcoal" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{item.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{item.qty} sold</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={
            <span className="flex items-center gap-2">
              Live queue
              {liveQueue.length > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 font-body text-xs font-bold text-cream">
                  {liveQueue.length}
                </span>
              )}
            </span>
          }
          action={
            <Link to="/admin/kitchen" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              Kitchen board <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {liveQueue.length === 0 ? (
            <EmptyState icon={ChefHat}>All caught up — no open orders.</EmptyState>
          ) : (
            <ul className="-mx-2 divide-y divide-border/60">
              {liveQueue.slice(0, 7).map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-2 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {o.order_number}
                      <span className="font-normal text-muted-foreground"> · {o.customer_name}</span>
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {timeAgo(o.created_at)} ·{" "}
                      <span className="capitalize">{o.fulfillment_type}</span> ·{" "}
                      {o.items.reduce((n, i) => n + i.qty, 0)} items
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                  <span className="w-16 shrink-0 text-right font-semibold tabular-nums">
                    {formatPrice(o.grand_total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Today's tables"
          action={
            <Link to="/admin/reservations" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
              All reservations <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {todaysTables.length === 0 ? (
            <EmptyState icon={CalendarCheck}>No tables booked for today.</EmptyState>
          ) : (
            <ul className="-mx-2 divide-y divide-border/60">
              {todaysTables.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-2 py-3 text-sm">
                  <span className="w-14 shrink-0 rounded-md bg-accent py-1 text-center font-semibold tabular-nums text-accent-foreground">
                    {r.reservation_time}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{r.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.party_size} guest{r.party_size !== 1 ? "s" : ""}
                      {r.special_requests && ` · ${r.special_requests}`}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
