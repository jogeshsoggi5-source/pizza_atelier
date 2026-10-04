import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Bike, Check, Loader2, PackageSearch, Printer, Store, XCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/menu-data";
import {
  recallOrder,
  trackOrder,
  trackingSteps,
  type TrackedOrder,
} from "@/lib/order-tracking";
import { addressLines, useSiteSettings } from "@/lib/store-status";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track")({
  validateSearch: (search: Record<string, unknown>): { order?: string; t?: string } => ({
    ...(typeof search.order === "string" && { order: search.order }),
    ...(typeof search.t === "string" && { t: search.t }),
  }),
  head: () => ({
    meta: [
      { title: "Track Your Order — Pizza Atelier" },
      {
        name: "description",
        content: "Track your Pizza Atelier order and view your receipt with your order number.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackPage,
});

type Lookup = { order: string; key?: string };

function TrackPage() {
  const search = Route.useSearch();
  const [lookup, setLookup] = useState<Lookup | null>(
    search.order ? { order: search.order, key: search.t } : null,
  );
  const [recent, setRecent] = useState<ReturnType<typeof recallOrder>>(null);
  useEffect(() => setRecent(recallOrder()), []);

  const query = useQuery({
    queryKey: ["track", lookup?.order, lookup?.key],
    queryFn: () => trackOrder(lookup!.order, lookup?.key),
    enabled: !!lookup,
    retry: false,
    // Keep the status live until the order is finished.
    refetchInterval: (q) => {
      const status = q.state.data?.status;
      return status === "completed" || status === "cancelled" ? false : 30_000;
    },
  });

  const order = query.data;

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="mx-auto max-w-xl text-center print:hidden">
        <p className="eyebrow">Track Order</p>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">Where's My Pizza?</h1>
        <p className="mt-4 text-muted-foreground">
          Enter your order number to see its status and bill.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-2xl space-y-6">
        {!order && (
          <LookupForm
            defaultOrder={search.order ?? ""}
            submitting={query.isFetching}
            onSubmit={setLookup}
          />
        )}

        {!lookup && recent?.token && !search.order && (
          <button
            type="button"
            onClick={() => setLookup({ order: recent.orderNumber, key: recent.token! })}
            className="w-full rounded-xl border border-dashed border-primary/40 bg-accent/40 p-4 text-left text-sm transition-colors hover:bg-accent print:hidden"
          >
            <span className="text-muted-foreground">Your last order: </span>
            <span className="font-semibold">{recent.orderNumber}</span>
            <span className="ml-2 font-medium text-primary">Track it →</span>
          </button>
        )}

        {lookup && query.isLoading && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Looking up your order…
          </p>
        )}

        {lookup && query.error && (
          <p className="rounded-lg bg-accent p-4 text-center text-sm font-medium text-accent-foreground">
            {(query.error as Error).message}
          </p>
        )}

        {lookup && query.isSuccess && !order && (
          <p className="rounded-lg bg-accent p-4 text-center text-sm font-medium text-accent-foreground">
            We couldn't find an order with that number. Check it and try again.
          </p>
        )}

        {order && (
          <>
            <StatusCard order={order} />
            <Receipt order={order} />
            <div className="flex flex-wrap justify-center gap-3 print:hidden">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer className="h-4 w-4" /> Print / Save receipt
              </Button>
              <Button
                variant="ghost"
                onClick={() => setLookup(null)}
              >
                Track another order
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LookupForm({
  defaultOrder,
  submitting,
  onSubmit,
}: {
  defaultOrder: string;
  submitting: boolean;
  onSubmit: (lookup: Lookup) => void;
}) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const order = String(form.get("order") ?? "").trim().toUpperCase();
    const phone = String(form.get("phone") ?? "").trim();
    if (order) onSubmit({ order, key: phone || undefined });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-xl bg-card p-6 shadow-card sm:grid-cols-[1fr_1fr_auto] sm:items-end print:hidden"
    >
      <div className="space-y-1.5">
        <Label htmlFor="track-order">Order number</Label>
        <Input
          id="track-order"
          name="order"
          placeholder="PA-XXXXXX"
          defaultValue={defaultOrder}
          autoCapitalize="characters"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="track-phone">
          Phone number <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input id="track-phone" name="phone" type="tel" placeholder="98765 43210" />
      </div>
      <Button type="submit" disabled={submitting}>
        <PackageSearch className="h-4 w-4" /> Track
      </Button>
    </form>
  );
}

function StatusCard({ order }: { order: TrackedOrder }) {
  const steps = trackingSteps(order.fulfillment_type);
  const cancelled = order.status === "cancelled";
  const current = steps.findIndex((s) => s.status === order.status);
  const currentLabel = cancelled ? "Cancelled" : steps[current]?.label ?? order.status;

  return (
    <div className="rounded-xl bg-card p-6 shadow-card print:hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Order {order.order_number}
          </p>
          <p className="mt-1 font-display text-2xl font-bold">{currentLabel}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
          {order.fulfillment_type === "delivery" ? (
            <Bike className="h-3.5 w-3.5" />
          ) : (
            <Store className="h-3.5 w-3.5" />
          )}
          {order.fulfillment_type}
        </span>
      </div>

      {cancelled ? (
        <p className="mt-5 flex items-start gap-2 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
          This order was cancelled. Please call us if you have any questions.
        </p>
      ) : (
        <ol className="mt-6 grid gap-3 sm:grid-cols-5 sm:gap-2">
          {steps.map((step, i) => {
            const done = i <= current;
            return (
              <li key={step.status} className="flex items-center gap-3 sm:flex-col sm:text-center">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                    done
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-border text-muted-foreground",
                    i === current && "ring-4 ring-secondary/20",
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    done ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {order.updated_at && (
        <p className="mt-5 text-xs text-muted-foreground">
          Last update{" "}
          {new Date(order.updated_at).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}{" "}
          · refreshes automatically
        </p>
      )}
    </div>
  );
}

function Receipt({ order }: { order: TrackedOrder }) {
  const settings = useSiteSettings();

  return (
    <div className="rounded-xl bg-card p-6 shadow-card print:shadow-none sm:p-8">
      <div className="text-center">
        <p className="font-logo text-2xl font-semibold">
          Pizza <span className="text-primary">Atelier</span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {addressLines(settings.address).join(", ")} · {settings.phone}
        </p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Receipt
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-dashed py-4 text-sm">
        <dt className="text-muted-foreground">Order no.</dt>
        <dd className="text-right font-semibold">{order.order_number}</dd>
        <dt className="text-muted-foreground">Date</dt>
        <dd className="text-right">
          {new Date(order.created_at).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </dd>
        {order.customer_name && (
          <>
            <dt className="text-muted-foreground">Customer</dt>
            <dd className="text-right">{order.customer_name}</dd>
          </>
        )}
        <dt className="text-muted-foreground">Type</dt>
        <dd className="text-right capitalize">{order.fulfillment_type}</dd>
        {order.delivery_address && (
          <>
            <dt className="text-muted-foreground">Deliver to</dt>
            <dd className="text-right">{order.delivery_address}</dd>
          </>
        )}
      </dl>

      <table className="mt-4 w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="pb-2 font-medium">Item</th>
            <th className="pb-2 text-center font-medium">Qty</th>
            <th className="pb-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, i) => (
            <tr key={i} className="align-top">
              <td className="py-1.5 pr-2">
                {item.name}
                {item.size && <span className="text-muted-foreground"> · {item.size}</span>}
                {item.extras && item.extras.length > 0 && (
                  <span className="block text-xs text-muted-foreground">
                    + {item.extras.join(", ")}
                  </span>
                )}
                <span className="block text-xs text-muted-foreground">
                  {formatPrice(item.unit_price)} each
                </span>
              </td>
              <td className="py-1.5 text-center tabular-nums">{item.qty}</td>
              <td className="py-1.5 text-right tabular-nums">
                {formatPrice(item.unit_price * item.qty)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 space-y-1.5 border-t border-dashed pt-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPrice(order.total_amount)}</span>
        </div>
        {order.delivery_fee > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery fee</span>
            <span className="tabular-nums">{formatPrice(order.delivery_fee)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(order.grand_total)}</span>
        </div>
      </div>

      {!order.verified && (
        <p className="mt-6 rounded-lg bg-muted/60 p-3 text-center text-xs text-muted-foreground print:hidden">
          Add your phone number when tracking to see your name and delivery address on the receipt.
        </p>
      )}

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Pay on {order.fulfillment_type === "delivery" ? "delivery" : "pickup"} · Thank you for
        ordering from Pizza Atelier!
      </p>
    </div>
  );
}
