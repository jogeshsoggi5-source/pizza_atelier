import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

import { PageHeader, Panel } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAdminSoldOut, useToggleSoldOut } from "@/lib/admin-api";
import { categoryLabels, formatPrice, menuCategoryOrder, menuItems } from "@/lib/menu-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/menu")({
  component: MenuAvailabilityPage,
});

function MenuAvailabilityPage() {
  const { data: soldOutIds = [], error } = useAdminSoldOut();
  const toggle = useToggleSoldOut();
  const [search, setSearch] = useState("");
  const soldOut = new Set(soldOutIds);

  const term = search.trim().toLowerCase();
  const categories = menuCategoryOrder
    .map((category) => ({
      category,
      items: menuItems.filter(
        (i) => i.category === category && (!term || i.name.toLowerCase().includes(term)),
      ),
    }))
    .filter((c) => c.items.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business"
        title="Menu"
        description={
          <>
            Turn an item off when you run out — it shows as <b>Sold out</b> on the website
            within a minute. {soldOut.size > 0 && `${soldOut.size} item${soldOut.size === 1 ? "" : "s"} sold out.`}
          </>
        }
      />

      {error && (
        <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {(error as Error).message}. Run <code>supabase/admin_features_migration.sql</code>.
        </p>
      )}

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search menu"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 rounded-xl border-black/[0.06] bg-card pl-9"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {categories.map(({ category, items }) => (
          <Panel
            key={category}
            title={categoryLabels[category]}
            action={
              <span className="text-xs text-muted-foreground">
                {items.filter((i) => !soldOut.has(i.id)).length}/{items.length} available
              </span>
            }
          >
            <ul className="-mx-2 divide-y divide-border/60">
              {items.map((item) => {
                const off = soldOut.has(item.id);
                return (
                  <li key={item.id} className="flex items-center gap-3 px-2 py-2.5">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        loading="lazy"
                        className={cn("h-11 w-11 shrink-0 rounded-lg object-cover", off && "grayscale opacity-50")}
                      />
                    ) : (
                      <span className="h-11 w-11 shrink-0 rounded-lg bg-muted" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className={cn("truncate text-sm font-medium", off && "text-muted-foreground line-through")}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.sizePrices ? `from ${formatPrice(item.price)}` : formatPrice(item.price)}
                      </p>
                    </div>
                    <span className={cn("text-xs font-medium", off ? "text-primary" : "text-secondary")}>
                      {off ? "Sold out" : "Available"}
                    </span>
                    <Switch
                      checked={!off}
                      aria-label={`${item.name} available`}
                      className="data-[state=checked]:bg-secondary"
                      disabled={toggle.isPending && toggle.variables?.itemId === item.id}
                      onCheckedChange={(available) => toggle.mutate({ itemId: item.id, soldOut: !available })}
                    />
                  </li>
                );
              })}
            </ul>
          </Panel>
        ))}
      </div>
    </div>
  );
}
