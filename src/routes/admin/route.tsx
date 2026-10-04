import { Link, Outlet, createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BellOff,
  CalendarCheck,
  ChefHat,
  ExternalLink,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

import { useNewOrderAlerts } from "@/components/admin/useNewOrderAlerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  signIn,
  signOut,
  useAdminSession,
  useAdminStoreSettings,
  useMessages,
  useOrders,
  useReservations,
  useUpdateStoreSettings,
  todayISO,
} from "@/lib/admin-api";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Pizza Atelier" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

type NavLink = {
  to:
    | "/admin"
    | "/admin/orders"
    | "/admin/kitchen"
    | "/admin/reservations"
    | "/admin/messages"
    | "/admin/analytics"
    | "/admin/customers"
    | "/admin/menu"
    | "/admin/settings";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  badge?: "orders" | "reservations" | "messages";
};

const navGroups: { title: string; links: NavLink[] }[] = [
  {
    title: "Operations",
    links: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/orders", label: "Orders", icon: ShoppingBag, badge: "orders" },
      { to: "/admin/kitchen", label: "Kitchen board", icon: ChefHat },
      { to: "/admin/reservations", label: "Reservations", icon: CalendarCheck, badge: "reservations" },
      { to: "/admin/messages", label: "Messages", icon: Mail, badge: "messages" },
    ],
  },
  {
    title: "Business",
    links: [
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/customers", label: "Customers", icon: Users },
      { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function AdminLayout() {
  const { loading, session, isAdmin } = useAdminSession();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-charcoal">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (!supabase) {
    return (
      <AuthScreen title="Supabase not configured">
        <p className="text-sm text-cream/60">
          Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to use the
          admin panel.
        </p>
      </AuthScreen>
    );
  }

  if (!session) return <LoginForm />;

  if (!isAdmin) {
    return (
      <AuthScreen title="No admin access">
        <ShieldAlert className="mx-auto h-10 w-10 text-primary" />
        <p className="mt-3 text-sm text-cream/60">
          {session.user.email} is signed in but isn't listed in the <code>admins</code> table.
        </p>
        <Button
          className="mt-6 border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream"
          variant="outline"
          onClick={() => signOut()}
        >
          Sign out
        </Button>
      </AuthScreen>
    );
  }

  return <AdminShell email={session.user.email ?? ""} />;
}

function AdminShell({ email }: { email: string }) {
  const { data: orders, dataUpdatedAt } = useOrders();
  const { data: reservations } = useReservations();
  const { data: messages } = useMessages();
  const { soundOn, toggleSound, pendingCount } = useNewOrderAlerts(orders);
  const today = todayISO();
  const pendingReservations =
    reservations?.filter((r) => r.status === "pending" && r.reservation_date >= today).length ?? 0;
  const newMessages = messages?.filter((m) => m.status === "new").length ?? 0;
  const badges = { orders: pendingCount, reservations: pendingReservations, messages: newMessages };

  return (
    <div className="min-h-screen bg-[oklch(0.975_0.008_80)] md:flex">
      {/* Sidebar */}
      <aside className="bg-charcoal text-cream md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div className="flex items-center justify-between px-5 py-4 md:px-6 md:py-7">
          <Link to="/admin" className="block">
            <span className="font-logo text-2xl font-semibold tracking-wide">
              Pizza <span className="text-gold">Atelier</span>
            </span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.3em] text-cream/40">
              Control Room
            </span>
          </Link>
          <button
            onClick={() => signOut()}
            className="rounded-md p-2 text-cream/60 hover:bg-cream/10 hover:text-cream md:hidden"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:block md:flex-1 md:space-y-6 md:overflow-y-auto md:pb-0">
          {navGroups.map((group) => (
            <div key={group.title} className="flex gap-1 md:block md:space-y-0.5">
              <p className="hidden px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/35 md:block">
                {group.title}
              </p>
              {group.links.map((link) => {
                const count = link.badge ? badges[link.badge] : 0;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    activeOptions={{ exact: link.exact }}
                    className="group relative flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-cream/65 transition-colors hover:bg-cream/[0.06] hover:text-cream"
                    activeProps={{
                      className:
                        "!bg-gold/[0.12] !text-gold before:absolute before:inset-y-1.5 before:-left-3 before:hidden before:w-1 before:rounded-r-full before:bg-gold md:before:block",
                    }}
                  >
                    <link.icon className="h-4 w-4" />
                    <span className="whitespace-nowrap">{link.label}</span>
                    {count > 0 && (
                      <span className="ml-auto rounded-full bg-primary px-1.5 py-px text-[10px] font-bold text-cream">
                        {count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="hidden border-t border-cream/10 p-4 md:block">
          <div className="flex items-center gap-3 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-semibold uppercase text-charcoal">
              {email.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{email}</p>
              <p className="text-xs text-cream/40">Administrator</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-md py-2 text-xs text-cream/60 hover:bg-cream/[0.06] hover:text-cream"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Website
            </a>
            <button
              onClick={() => signOut()}
              className="flex items-center justify-center gap-1.5 rounded-md py-2 text-xs text-cream/60 hover:bg-cream/[0.06] hover:text-cream"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <TopBar soundOn={soundOn} onToggleSound={toggleSound} updatedAt={dataUpdatedAt} />
        <main className="mx-auto max-w-7xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function TopBar({
  soundOn,
  onToggleSound,
  updatedAt,
}: {
  soundOn: boolean;
  onToggleSound: () => void;
  updatedAt: number;
}) {
  const { data: settings } = useAdminStoreSettings();
  const update = useUpdateStoreSettings();
  const accepting = settings?.accepting_orders ?? true;

  return (
    <div className="sticky top-0 z-30 border-b border-black/[0.06] bg-[oklch(0.975_0.008_80)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
          </span>
          Live
          {updatedAt > 0 && (
            <span className="hidden sm:inline">
              · synced {new Date(updatedAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              accepting
                ? "border-secondary/30 bg-secondary/10 text-secondary"
                : "border-primary/30 bg-primary/10 text-primary",
            )}
          >
            {accepting ? "Accepting orders" : "Orders paused"}
            <Switch
              checked={accepting}
              disabled={!settings || update.isPending}
              onCheckedChange={(checked) =>
                update.mutate(
                  { accepting_orders: checked },
                  {
                    onSuccess: () =>
                      toast.success(checked ? "Online orders are open" : "Online orders paused"),
                  },
                )
              }
              className="scale-75 data-[state=checked]:bg-secondary"
            />
          </label>
          <button
            onClick={onToggleSound}
            className="rounded-full border border-black/[0.06] bg-card p-2 text-muted-foreground hover:text-foreground"
            aria-label={soundOn ? "Mute new-order alerts" : "Turn on new-order alerts"}
            title={soundOn ? "New-order sound on" : "New-order sound off"}
          >
            {soundOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      await signIn(String(form.get("email") ?? ""), String(form.get("password") ?? ""));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "h-11 border-cream/15 bg-cream/[0.04] text-cream placeholder:text-cream/30 focus-visible:ring-gold";

  return (
    <AuthScreen title="Sign in to the control room">
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-cream/70">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className={inputClass}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-cream/70">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={inputClass}
          />
        </div>
        <Button
          type="submit"
          className="h-11 w-full bg-gold font-semibold text-charcoal hover:bg-gold/90"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthScreen>
  );
}

function AuthScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-charcoal px-4">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-primary/15 blur-3xl" />
      <div className="relative w-full max-w-sm rounded-2xl border border-cream/10 bg-cream/[0.03] p-8 text-center shadow-2xl backdrop-blur">
        <p className="font-logo text-3xl font-semibold tracking-wide text-cream">
          Pizza <span className="text-gold">Atelier</span>
        </p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cream/40">
          Control Room
        </p>
        <h1 className="mb-7 mt-5 text-sm text-cream/60">{title}</h1>
        {children}
      </div>
    </div>
  );
}
