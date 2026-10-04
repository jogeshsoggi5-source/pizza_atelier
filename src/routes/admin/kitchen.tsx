import { createFileRoute } from "@tanstack/react-router";
import { Bike, Clock, Printer, Store } from "lucide-react";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  nextStatus,
  printKitchenTicket,
  useOrderStatusMutation,
  useOrders,
  type AdminOrder,
  type OrderStatus,
} from "@/lib/admin-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/kitchen")({
  component: KitchenBoard,
});

const columns: { status: OrderStatus; title: string; accent: string }[] = [
  { status: "pending", title: "New", accent: "bg-amber-500" },
  { status: "confirmed", title: "Confirmed", accent: "bg-sky-500" },
  { status: "preparing", title: "In the oven", accent: "bg-orange-500" },
  { status: "ready", title: "Ready", accent: "bg-violet-500" },
];

/** Re-renders every 30s so the "minutes waiting" timers stay current. */
function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function KitchenBoard() {
  const { data: orders = [] } = useOrders();
  const now = useNow();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Kitchen board"
        description="Move each order along as it's made. Orders waiting over 20 minutes turn red."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const colOrders = orders
            .filter((o) => o.status === col.status)
            .sort((a, b) => a.created_at.localeCompare(b.created_at));
          return (
            <div key={col.status} className="flex flex-col rounded-2xl bg-black/[0.035] p-3">
              <div className="flex items-center gap-2 px-1 pb-3">
                <span className={cn("h-2 w-2 rounded-full", col.accent)} />
                <h2 className="text-sm font-semibold">{col.title}</h2>
                <span className="ml-auto rounded-full bg-card px-2 text-xs font-semibold text-muted-foreground">
                  {colOrders.length}
                </span>
              </div>
              <div className="space-y-3">
                {colOrders.length === 0 && (
                  <p className="rounded-xl border border-dashed border-black/10 py-8 text-center text-xs text-muted-foreground">
                    Nothing here
                  </p>
                )}
                {colOrders.map((o) => (
                  <TicketCard key={o.id} order={o} now={now} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TicketCard({ order, now }: { order: AdminOrder; now: number }) {
  const mutation = useOrderStatusMutation();
  const next = nextStatus[order.status];
  const minutes = Math.max(0, Math.round((now - new Date(order.created_at).getTime()) / 60_000));
  const late = minutes >= 20;

  return (
    <div className="rounded-xl border border-black/[0.06] bg-card p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display font-semibold">{order.order_number}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
            late ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Clock className="h-3 w-3" /> {minutes}m
        </span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        {order.fulfillment_type === "delivery" ? <Bike className="h-3 w-3" /> : <Store className="h-3 w-3" />}
        <span className="capitalize">{order.fulfillment_type}</span> · {order.customer_name}
      </p>
      <ul className="mt-3 space-y-1 border-t border-dashed border-border pt-3 text-sm">
        {order.items.map((item, i) => (
          <li key={i}>
            <span className="font-bold">{item.qty}×</span> {item.name}
            {item.size && <span className="text-muted-foreground"> · {item.size}</span>}
            {item.extras && item.extras.length > 0 && (
              <span className="block pl-5 text-xs text-muted-foreground">+ {item.extras.join(", ")}</span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        {next && (
          <Button
            size="sm"
            className="h-8 flex-1 capitalize"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ id: order.id, status: next, phone: order.customer_phone })}
          >
            {next === "completed" ? "Hand over" : `Mark ${next}`}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5"
          aria-label="Print ticket"
          onClick={() => printKitchenTicket(order)}
        >
          <Printer className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
