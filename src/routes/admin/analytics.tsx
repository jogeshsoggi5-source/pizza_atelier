import { createFileRoute } from "@tanstack/react-router";
import { Bike, IndianRupee, Receipt, ShoppingBag, Trophy, XCircle } from "lucide-react";
import { useState } from "react";

import { HourlyChart, RevenueChart } from "@/components/admin/charts";
import { EmptyState, PageHeader, Panel, Segmented, StatCard } from "@/components/admin/ui";
import {
  change,
  dailySeries,
  fulfillmentSplit,
  hourlySeries,
  ordersInRange,
  revenue,
  salesOrders,
  topItems,
} from "@/lib/admin-analytics";
import { useOrders } from "@/lib/admin-api";
import { formatPrice } from "@/lib/menu-data";

export const Route = createFileRoute("/admin/analytics")({
  component: AnalyticsPage,
});

const ranges = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;
type Range = (typeof ranges)[number]["value"];

function AnalyticsPage() {
  const { data: orders = [], isLoading } = useOrders();
  const [range, setRange] = useState<Range>("30");
  const days = Number(range);

  const period = ordersInRange(orders, days);
  const previous = ordersInRange(orders, days, days);
  const sales = salesOrders(period);
  const prevSales = salesOrders(previous);
  const total = revenue(sales);
  const prevTotal = revenue(prevSales);
  const avg = sales.length ? total / sales.length : 0;
  const prevAvg = prevSales.length ? prevTotal / prevSales.length : 0;
  const cancelled = period.filter((o) => o.status === "cancelled").length;
  const split = fulfillmentSplit(period);
  const items = topItems(period, 10);
  const maxQty = Math.max(1, ...items.map((i) => i.qty));
  const deliveryShare = split.total ? split.delivery / split.total : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business"
        title="Analytics"
        description="Sales performance, compared with the period before."
        actions={<Segmented value={range} options={ranges} onChange={setRange} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard label="Revenue" value={formatPrice(total)} icon={IndianRupee} delta={change(total, prevTotal)} hint={`vs previous ${days} days`} />
        <StatCard label="Orders" value={String(sales.length)} icon={ShoppingBag} delta={change(sales.length, prevSales.length)} hint={`vs previous ${days} days`} />
        <StatCard label="Avg order value" value={formatPrice(Math.round(avg))} icon={Receipt} delta={change(avg, prevAvg)} hint={`vs previous ${days} days`} />
        <StatCard
          label="Cancelled"
          value={String(cancelled)}
          icon={XCircle}
          hint={period.length ? `${Math.round((cancelled / period.length) * 100)}% of orders` : "—"}
        />
      </div>

      <Panel title="Revenue per day">
        {isLoading ? (
          <div className="h-[280px] animate-pulse rounded-xl bg-muted" />
        ) : (
          <RevenueChart data={dailySeries(orders, days)} height={280} />
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Busiest hours" className="lg:col-span-3">
          <HourlyChart data={hourlySeries(period)} />
        </Panel>

        <Panel title="Delivery vs pickup" className="lg:col-span-2">
          {split.total === 0 ? (
            <EmptyState icon={Bike}>No orders in this period.</EmptyState>
          ) : (
            <div className="space-y-5">
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div className="bg-primary" style={{ width: `${deliveryShare * 100}%` }} />
                <div className="ml-0.5 flex-1 bg-charcoal" />
              </div>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Delivery
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {Math.round(deliveryShare * 100)}%
                  </dd>
                  <dd className="text-xs text-muted-foreground">{split.delivery} orders</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm bg-charcoal" /> Pickup
                  </dt>
                  <dd className="mt-1 font-display text-2xl font-bold tabular-nums">
                    {100 - Math.round(deliveryShare * 100)}%
                  </dd>
                  <dd className="text-xs text-muted-foreground">{split.pickup} orders</dd>
                </div>
              </dl>
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Top items">
        {items.length === 0 ? (
          <EmptyState icon={Trophy}>No items sold in this period.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 font-medium">Item</th>
                  <th className="hidden pb-3 font-medium sm:table-cell" />
                  <th className="pb-3 text-right font-medium">Sold</th>
                  <th className="pb-3 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((item, i) => (
                  <tr key={item.name}>
                    <td className="py-2.5 pr-3">
                      <span className="mr-2 inline-block w-5 text-muted-foreground tabular-nums">{i + 1}.</span>
                      <span className="font-medium">{item.name}</span>
                    </td>
                    <td className="hidden w-1/3 py-2.5 sm:table-cell">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${(item.qty / maxQty) * 100}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 text-right tabular-nums">{item.qty}</td>
                    <td className="py-2.5 pl-3 text-right font-medium tabular-nums">{formatPrice(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
