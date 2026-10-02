import { createFileRoute } from "@tanstack/react-router";
import {
  Bike,
  Download,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  Search,
  ShoppingBag,
  Store,
} from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState, PageHeader, Panel, Segmented } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ordersInRange, revenue, salesOrders } from "@/lib/admin-analytics";
import {
  downloadOrdersCsv,
  nextStatus,
  orderStatuses,
  printKitchenTicket,
  useOrderStatusMutation,
  useOrders,
  type AdminOrder,
  type OrderStatus,
} from "@/lib/admin-api";
import { formatPrice } from "@/lib/menu-data";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrdersPage,
});

const activeStatuses: OrderStatus[] = ["pending", "confirmed", "preparing", "ready"];

type StatusFilter = "active" | "all" | OrderStatus;
type RangeFilter = "today" | "7" | "30" | "90";

const ranges = [
  { value: "today", label: "Today" },
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
] as const;

function AdminOrdersPage() {
  const { data: orders = [], isLoading, error, refetch, isFetching } = useOrders();
  const [status, setStatus] = useState<StatusFilter>("active");
  const [range, setRange] = useState<RangeFilter>("7");
  const [search, setSearch] = useState("");

  const inRange = ordersInRange(orders, range === "today" ? 1 : Number(range));
  const countFor = (s: StatusFilter) =>
    s === "all"
      ? inRange.length
      : s === "active"
        ? inRange.filter((o) => activeStatuses.includes(o.status)).length
        : inRange.filter((o) => o.status === s).length;
  const statusOptions = (["active", "all", ...orderStatuses] as StatusFilter[]).map((s) => ({
    value: s,
    label: s,
    count: countFor(s),
  }));

  const term = search.trim().toLowerCase();
  const visible = inRange.filter((o) => {
    if (status === "active" && !activeStatuses.includes(o.status)) return false;
    if (status !== "active" && status !== "all" && o.status !== status) return false;
    if (!term) return true;
    return [o.order_number, o.customer_name, o.customer_phone].some((v) =>
      v?.toLowerCase().includes(term),
    );
  });
  const sales = salesOrders(inRange);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Orders"
        description={
          <>
            {sales.length} orders · {formatPrice(revenue(sales))} in the selected period
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm" className="bg-card" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button
              size="sm"
              className="bg-charcoal text-cream hover:bg-charcoal/90"
              disabled={visible.length === 0}
              onClick={() => downloadOrdersCsv(visible)}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search order #, name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-black/[0.06] bg-card pl-9"
          />
        </div>
        <Segmented value={range} options={ranges} onChange={setRange} />
      </div>
      <Segmented value={status} options={statusOptions} onChange={setStatus} />

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading orders…</p>}
        {error && (
          <p className="text-sm text-primary">Couldn't load orders: {(error as Error).message}</p>
        )}
        {!isLoading && !error && visible.length === 0 && (
          <Panel>
            <EmptyState icon={ShoppingBag}>No orders match these filters.</EmptyState>
          </Panel>
        )}
        {visible.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}

function OrderCard({ order }: { order: AdminOrder }) {
  const mutation = useOrderStatusMutation();
  const next = nextStatus[order.status];
  const update = (status: OrderStatus) => mutation.mutate({ id: order.id, status });

  return (
    <Panel className={`p-4 sm:p-5 ${order.status === "pending" ? "ring-2 ring-gold/50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-lg font-semibold">{order.order_number}</span>
            <StatusBadge status={order.status} />
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {order.fulfillment_type === "delivery" ? (
                <Bike className="h-3.5 w-3.5" />
              ) : (
                <Store className="h-3.5 w-3.5" />
              )}
              <span className="capitalize">{order.fulfillment_type}</span>
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Date(order.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        <p className="font-display text-xl font-bold tabular-nums">{formatPrice(order.grand_total)}</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 text-sm">
          <p className="font-medium">{order.customer_name ?? "—"}</p>
          {order.customer_phone && (
            <a
              href={`tel:${order.customer_phone}`}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-primary"
            >
              <Phone className="h-3.5 w-3.5" /> {order.customer_phone}
            </a>
          )}
          {order.delivery_address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-1.5 text-muted-foreground hover:text-primary"
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {order.delivery_address}
            </a>
          )}
        </div>
        <ul className="space-y-1 rounded-xl bg-muted/50 p-3 text-sm">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                <span className="font-semibold">{item.qty}×</span> {item.name}
                {item.size && <span className="text-muted-foreground"> · {item.size}</span>}
                {item.extras && item.extras.length > 0 && (
                  <span className="block text-xs text-muted-foreground">+ {item.extras.join(", ")}</span>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {formatPrice(item.unit_price * item.qty)}
              </span>
            </li>
          ))}
          {order.delivery_fee > 0 && (
            <li className="flex justify-between border-t border-border/60 pt-1 text-muted-foreground">
              <span>Delivery fee</span>
              <span className="tabular-nums">{formatPrice(order.delivery_fee)}</span>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        {next && (
          <Button size="sm" disabled={mutation.isPending} onClick={() => update(next)} className="capitalize">
            Mark {next}
          </Button>
        )}
        <Select value={order.status} onValueChange={(v) => update(v as OrderStatus)}>
          <SelectTrigger className="h-9 w-36 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderStatuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto text-muted-foreground"
          onClick={() => printKitchenTicket(order)}
        >
          <Printer className="h-4 w-4" /> Print ticket
        </Button>
      </div>
    </Panel>
  );
}
