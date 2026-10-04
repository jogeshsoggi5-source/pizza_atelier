import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PizzaCard } from "@/components/site/PizzaCard";
import { useCart } from "@/lib/cart-context";
import { useSiteSettings, useSoldOut } from "@/lib/store-status";
import { placeOrder } from "@/lib/supabase-queries";
import {
  categoryLabels,
  formatPrice,
  categoryNotes,
  isSizedCategory,
  menuCategoryOrder,
  menuItems,
  pizzaSizes,
  type MenuItem,
} from "@/lib/menu-data";

export const Route = createFileRoute("/order")({
  validateSearch: (search: Record<string, unknown>): { view?: "cart" } =>
    search.view === "cart" ? { view: "cart" } : {},
  head: () => ({
    meta: [
      { title: "Order Online — Pizza Atelier" },
      {
        name: "description",
        content:
          "Order wood-fired artisan pizzas online for delivery or pickup. Fresh from our oven in 30 minutes.",
      },
      { property: "og:title", content: "Order Online — Pizza Atelier" },
      {
        property: "og:description",
        content: "Delivery or pickup — fresh from the wood-fired oven.",
      },
    ],
  }),
  component: OrderPage,
});

const categories = menuCategoryOrder.filter((c) =>
  menuItems.some((i) => i.category === c),
);
const imageById = new Map(menuItems.map((item) => [item.id, item.image]));

function AddRow({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const soldOut = useSoldOut().has(item.id);
  return (
    <div
      className={`flex items-center gap-3 rounded-lg bg-card p-3 shadow-card sm:gap-4 sm:p-4 ${soldOut ? "opacity-60" : ""}`}
    >
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-md object-cover sm:h-16 sm:w-16"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-medium">{item.name}</p>
          <span className="text-sm font-semibold text-primary">
            {formatPrice(item.price)}
          </span>
          {soldOut && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sold out
            </span>
          )}
        </div>
        {item.description && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {item.description}
          </p>
        )}
      </div>
      <Button
        size="icon"
        variant="outline"
        disabled={soldOut}
        aria-label={`Add ${item.name} to order`}
        onClick={() => {
          addItem({ id: item.id, name: item.name, price: item.price });
          toast.success(`${item.name} added to your order`);
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function OrderPage() {
  const { view } = Route.useSearch();
  // The navbar cart icon opens ?view=cart: on mobile, show only the order summary.
  const cartOnly = view === "cart";
  const { items, updateQty, removeItem, clear, total, count } = useCart();
  const [fulfillmentChoice, setFulfillment] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [placedOrder, setPlacedOrder] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const settings = useSiteSettings();
  // Delivery and pickup can each be switched off in /admin/settings.
  const fulfillment = !settings.delivery_enabled
    ? "pickup"
    : !settings.pickup_enabled
      ? "delivery"
      : fulfillmentChoice;
  const ordersPaused =
    !settings.accepting_orders || (!settings.delivery_enabled && !settings.pickup_enabled);
  const belowMinimum = items.length > 0 && total < settings.min_order_amount;
  const soldOut = useSoldOut();

  const deliveryFee = fulfillment === "delivery" ? settings.delivery_fee : 0;
  const grandTotal = total + deliveryFee;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (ordersPaused) {
      toast.error("We're not taking online orders right now.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty — add something delicious first!");
      return;
    }
    if (belowMinimum) {
      toast.error(`The minimum order is ${formatPrice(settings.min_order_amount)}.`);
      return;
    }
    const unavailable = items.find((i) => soldOut.has(i.productId ?? i.id));
    if (unavailable) {
      toast.error(`${unavailable.name} just sold out — please remove it from your order.`);
      return;
    }
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();
    if (!name || !phone || (fulfillment === "delivery" && !address)) {
      toast.error("Please fill in all required fields.");
      return;
    }
    const orderNumber = `PA-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    setSubmitting(true);
    const { error } = await placeOrder({
      order_number: orderNumber,
      customer_name: name,
      customer_phone: phone,
      items: items.map((item) => ({
        name: item.name,
        size: item.size
          ? pizzaSizes.find((s) => s.id === item.size)?.label
          : undefined,
        extras: item.extras,
        qty: item.qty,
        unit_price: item.price,
      })),
      total_amount: total,
      delivery_fee: deliveryFee,
      grand_total: total + deliveryFee,
      fulfillment_type: fulfillment,
      delivery_address: fulfillment === "delivery" ? address : undefined,
    });
    setSubmitting(false);
    if (error) {
      console.error("Failed to place order:", error);
      toast.error("We couldn't place your order. Please try again or call us.");
      return;
    }
    setPlacedOrder(orderNumber);
    clear();
  };

  if (placedOrder) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-20">
        <div className="max-w-md text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-secondary" />
          <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">
            Order Confirmed!
          </h1>
          <p className="mt-3 text-muted-foreground">
            Your order{" "}
            <span className="font-semibold text-foreground">{placedOrder}</span>{" "}
            is in the oven.{" "}
            {fulfillment === "delivery"
              ? "It will be at your door in about 30–40 minutes."
              : "It will be ready for pickup in about 20 minutes."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => setPlacedOrder(null)}>Order Again</Button>
            <Button asChild variant="outline">
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`container mx-auto px-4 ${cartOnly ? "py-6 lg:py-24" : "py-16 md:py-24"}`}
    >
      {cartOnly && (
        <Link
          to="/order"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" /> Add more items
        </Link>
      )}
      <div
        className={`mx-auto max-w-xl text-center ${cartOnly ? "hidden lg:block" : ""}`}
      >
        <p className="eyebrow">Order Online</p>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">
          Fresh to Your Door
        </h1>
        <p className="mt-4 text-muted-foreground">
          Build your order below, then check out for delivery or pickup.
        </p>
      </div>

      <div
        className={`grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-[1fr_380px] ${cartOnly ? "" : "mt-14"}`}
      >
        {/* Menu */}
        <div className={cartOnly ? "hidden lg:block" : undefined}>
          {categories.map((category, index) => {
            const items = menuItems.filter(
              (item) => item.category === category,
            );
            return (
              <div key={category} className={index > 0 ? "mt-10" : undefined}>
                <h2 className="font-display text-2xl font-bold">
                  {categoryLabels[category]}
                </h2>
                {categoryNotes[category] && (
                  <p className="mt-1 text-sm font-medium text-primary">
                    {categoryNotes[category]}
                  </p>
                )}
                {isSizedCategory(category) ? (
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-6">
                    {items.map((pizza) => (
                      <PizzaCard key={pizza.id} item={pizza} />
                    ))}
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {items.map((item) => (
                      <AddRow key={item.id} item={item} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cart & checkout */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-xl bg-card p-6 shadow-card">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Your Order</h2>
              {count > 0 && (
                <span className="ml-auto text-sm text-muted-foreground">
                  {count} item{count !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {items.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Your cart is empty. Add a pizza to get started!
              </p>
            ) : (
              <ul className="mt-5 space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {imageById.get(item.productId ?? item.id) ? (
                        <img
                          src={imageById.get(item.productId ?? item.id)}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium leading-snug">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.size && (
                          <span className="font-medium text-foreground">
                            {pizzaSizes.find((s) => s.id === item.size)?.label}{" "}
                            ·{" "}
                          </span>
                        )}
                        {formatPrice(item.price)} each
                        {item.extras && item.extras.length > 0 && (
                          <span className="block">
                            + {item.extras.join(", ")}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        aria-label={`Decrease ${item.name} quantity`}
                        onClick={() => updateQty(item.id, item.qty - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">
                        {item.qty}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() => updateQty(item.id, item.qty + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div
              className={`mt-6 grid gap-2 ${settings.delivery_enabled && settings.pickup_enabled ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {settings.delivery_enabled && (
                <Button
                  type="button"
                  variant={fulfillment === "delivery" ? "default" : "outline"}
                  onClick={() => setFulfillment("delivery")}
                >
                  {settings.pickup_enabled ? "Delivery" : "Delivery only"}
                </Button>
              )}
              {settings.pickup_enabled && (
                <Button
                  type="button"
                  variant={fulfillment === "pickup" ? "default" : "outline"}
                  onClick={() => setFulfillment("pickup")}
                >
                  {settings.delivery_enabled ? "Pickup" : "Pickup only"}
                </Button>
              )}
            </div>

            {ordersPaused && (
              <p className="mt-6 rounded-lg bg-accent p-3 text-sm font-medium text-accent-foreground">
                {settings.paused_message ||
                  "Online ordering is paused right now. Please call us to order."}
              </p>
            )}

            {belowMinimum && !ordersPaused && (
              <p className="mt-6 rounded-lg bg-accent p-3 text-sm font-medium text-accent-foreground">
                Minimum order is {formatPrice(settings.min_order_amount)} — add{" "}
                {formatPrice(settings.min_order_amount - total)} more to check out.
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" placeholder="Your name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              {fulfillment === "delivery" && (
                <div className="space-y-1.5">
                  <Label htmlFor="address">Delivery Address *</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Street, city, zip"
                  />
                </div>
              )}

              <div className="space-y-1.5 border-t pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(total)}</span>
                </div>
                {fulfillment === "delivery" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery fee</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(grandTotal)}</span>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting || ordersPaused || belowMinimum}
              >
                {submitting ? "Placing order…" : `Place Order — ${formatPrice(grandTotal)}`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Pay at the door or on pickup. Online payment coming soon.
              </p>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
