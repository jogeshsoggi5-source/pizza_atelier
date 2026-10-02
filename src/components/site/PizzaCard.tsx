import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { useSoldOut } from "@/lib/store-status";
import { cn } from "@/lib/utils";
import {
  formatPrice,
  pizzaSizes,
  pizzaUpgrades,
  priceForSize,
  type MenuItem,
  type PizzaSize,
} from "@/lib/menu-data";

/** Menu item card; pizzas with sizePrices also get the size picker and upgrades. */
export function PizzaCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const soldOut = useSoldOut().has(item.id);
  const [size, setSize] = useState<PizzaSize>("small");
  const [upgradeIds, setUpgradeIds] = useState<string[]>([]);
  const [showUpgrades, setShowUpgrades] = useState(false);

  const upgrades = pizzaUpgrades.filter((u) => upgradeIds.includes(u.id));
  const price =
    priceForSize(item, size) +
    upgrades.reduce((sum, u) => sum + u.prices[size], 0);
  const sizeLabel = pizzaSizes.find((s) => s.id === size)?.label;

  const toggleUpgrade = (id: string) =>
    setUpgradeIds((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id],
    );

  const handleAdd = () => {
    if (!item.sizePrices) {
      addItem({ id: item.id, name: item.name, price: item.price });
      toast.success(`${item.name} added to your order`);
      return;
    }
    addItem({
      id: item.id,
      name: item.name,
      price,
      size,
      extras: upgrades.map((u) => u.label),
    });
    toast.success(`${sizeLabel} ${item.name} added to your order`);
  };

  return (
    <article className="hover-lift group flex flex-col overflow-hidden rounded-xl bg-card shadow-card">
      {item.image && (
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            width={800}
            height={608}
            className={cn(
              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
              soldOut && "grayscale",
            )}
          />
          {soldOut && (
            <span className="absolute right-2 top-2 rounded-full bg-charcoal/85 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream sm:right-3 sm:top-3 sm:text-xs">
              Sold out
            </span>
          )}
          {item.tag && (
            <Badge className="absolute left-2 top-2 px-2 text-[10px] sm:left-3 sm:top-3 sm:px-2.5 sm:text-xs bg-gold text-charcoal hover:bg-gold">
              {item.tag}
            </Badge>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-3 sm:p-5">
        {!item.image && item.tag && (
          <Badge className="mb-2 w-fit px-2 text-[10px] sm:text-xs bg-gold text-charcoal hover:bg-gold">
            {item.tag}
          </Badge>
        )}
        <div className="flex flex-col items-start gap-0.5 sm:flex-row sm:justify-between sm:gap-3">
          <h3 className="font-display text-base font-semibold leading-tight sm:text-xl">
            {item.name}
          </h3>
          <span className="font-display text-sm font-semibold text-primary sm:text-lg">
            {formatPrice(price)}
          </span>
        </div>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:mt-2 sm:line-clamp-none sm:text-sm">
            {item.description}
          </p>
        )}

        <div className="mt-auto">
          {item.sizePrices && (
            <>
              <div
                role="radiogroup"
                aria-label={`${item.name} size`}
                className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 sm:mt-4"
              >
                {pizzaSizes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={size === s.id}
                    aria-label={`${s.label}, ${formatPrice(priceForSize(item, s.id))}`}
                    onClick={() => setSize(s.id)}
                    className={cn(
                      "rounded-md py-1 text-xs font-medium leading-tight transition-colors",
                      size === s.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="block text-[10px] font-normal text-muted-foreground">
                      {formatPrice(priceForSize(item, s.id))}
                    </span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                aria-expanded={showUpgrades}
                onClick={() => setShowUpgrades((v) => !v)}
                className="mt-2 flex w-full items-center justify-between text-xs font-medium text-primary"
              >
                <span>
                  Upgrade your pizza
                  {upgrades.length > 0 && ` (${upgrades.length})`}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showUpgrades && "rotate-180",
                  )}
                />
              </button>
              {showUpgrades && (
                <ul className="mt-1.5 space-y-1">
                  {pizzaUpgrades.map((u) => (
                    <li key={u.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={upgradeIds.includes(u.id)}
                          onChange={() => toggleUpgrade(u.id)}
                          className="h-3.5 w-3.5 accent-[var(--primary)]"
                        />
                        <span className="flex-1">{u.label}</span>
                        <span className="text-muted-foreground">
                          +{formatPrice(u.prices[size])}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          <Button
            onClick={handleAdd}
            size="sm"
            disabled={soldOut}
            className="mt-3 w-full px-2 text-xs sm:text-sm"
          >
            {soldOut ? (
              "Sold out"
            ) : (
              <>
                <Plus className="mr-1 h-4 w-4" /> Add
                <span className="hidden sm:inline">&nbsp;to Order</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
