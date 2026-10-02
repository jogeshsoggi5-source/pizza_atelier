import { createFileRoute } from "@tanstack/react-router";
import { Crown, Phone, Repeat, Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";

import { EmptyState, PageHeader, Panel, StatCard } from "@/components/admin/ui";
import { Input } from "@/components/ui/input";
import { summarizeCustomers, useOrders } from "@/lib/admin-api";
import { formatPrice } from "@/lib/menu-data";

export const Route = createFileRoute("/admin/customers")({
  component: CustomersPage,
});

const DAY = 86_400_000;

function CustomersPage() {
  const { data: orders = [], isLoading } = useOrders();
  const [search, setSearch] = useState("");
  const customers = summarizeCustomers(orders);

  const repeat = customers.filter((c) => c.orders > 1).length;
  const newThisWeek = customers.filter(
    (c) => Date.now() - new Date(c.firstOrder).getTime() < 7 * DAY,
  ).length;
  // Top 10% of spenders (at least 3 orders) get a VIP badge.
  const vipThreshold = customers[Math.floor(customers.length * 0.1)]?.spent ?? Infinity;

  const term = search.trim().toLowerCase();
  const visible = customers.filter(
    (c) => !term || c.name.toLowerCase().includes(term) || c.phone.includes(term),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business"
        title="Customers"
        description="Built from order history (last 90 days), grouped by phone number."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <StatCard label="Customers" value={String(customers.length)} icon={Users} />
        <StatCard
          label="Repeat customers"
          value={String(repeat)}
          icon={Repeat}
          hint={customers.length ? `${Math.round((repeat / customers.length) * 100)}% come back` : undefined}
        />
        <StatCard label="New this week" value={String(newThisWeek)} icon={UserPlus} />
      </div>

      <Panel>
        <div className="relative mb-4 w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl pl-9"
          />
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : visible.length === 0 ? (
          <EmptyState icon={Users}>No customers yet.</EmptyState>
        ) : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 pb-3 font-medium">Customer</th>
                  <th className="px-3 pb-3 text-right font-medium">Orders</th>
                  <th className="px-3 pb-3 text-right font-medium">Total spent</th>
                  <th className="px-3 pb-3 text-right font-medium">Avg order</th>
                  <th className="px-5 pb-3 text-right font-medium">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visible.map((c) => {
                  const vip = c.orders >= 3 && c.spent >= vipThreshold;
                  return (
                    <tr key={c.phone} className="hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-semibold uppercase text-accent-foreground">
                            {c.name.charAt(0)}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-1.5 font-medium">
                              {c.name}
                              {vip && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-px text-[10px] font-bold uppercase text-accent-foreground">
                                  <Crown className="h-3 w-3" /> VIP
                                </span>
                              )}
                            </p>
                            <a
                              href={`tel:${c.phone}`}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                            >
                              <Phone className="h-3 w-3" /> {c.phone}
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{c.orders}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatPrice(c.spent)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">
                        {formatPrice(Math.round(c.spent / c.orders))}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {new Date(c.lastOrder).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
