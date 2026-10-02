import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, Mail, MessageSquare, Users } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState, PageHeader, Panel, Segmented } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import {
  todayISO,
  useReservationStatusMutation,
  useReservations,
  type AdminReservation,
} from "@/lib/admin-api";

export const Route = createFileRoute("/admin/reservations")({
  component: AdminReservationsPage,
});

const filters = ["upcoming", "pending", "past", "all"] as const;
type Filter = (typeof filters)[number];

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AdminReservationsPage() {
  const { data: reservations = [], isLoading, error } = useReservations();
  const [filter, setFilter] = useState<Filter>("upcoming");
  const today = todayISO();

  const visible = reservations
    .filter((r) => {
      if (filter === "upcoming") return r.reservation_date >= today && r.status !== "cancelled";
      if (filter === "pending") return r.status === "pending";
      if (filter === "past") return r.reservation_date < today;
      return true;
    })
    // Upcoming reads best soonest-first; everything else newest-first.
    .sort((a, b) => {
      const ka = `${a.reservation_date} ${a.reservation_time}`;
      const kb = `${b.reservation_date} ${b.reservation_time}`;
      return filter === "upcoming" || filter === "pending" ? ka.localeCompare(kb) : kb.localeCompare(ka);
    });

  const counts: Record<Filter, number> = {
    upcoming: reservations.filter((r) => r.reservation_date >= today && r.status !== "cancelled").length,
    pending: reservations.filter((r) => r.status === "pending").length,
    past: reservations.filter((r) => r.reservation_date < today).length,
    all: reservations.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Operations" title="Reservations" description="Table requests from the website." />

      <Segmented
        value={filter}
        options={filters.map((f) => ({ value: f, label: f, count: counts[f] }))}
        onChange={setFilter}
      />

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading reservations…</p>}
        {error && (
          <p className="text-sm text-primary">
            Couldn't load reservations: {(error as Error).message}
          </p>
        )}
        {!isLoading && !error && visible.length === 0 && (
          <Panel>
            <EmptyState icon={CalendarCheck}>No reservations here.</EmptyState>
          </Panel>
        )}
        {visible.map((r) => (
          <ReservationCard key={r.id} reservation={r} />
        ))}
      </div>
    </div>
  );
}

function ReservationCard({ reservation: r }: { reservation: AdminReservation }) {
  const mutation = useReservationStatusMutation();
  const update = (status: AdminReservation["status"]) => mutation.mutate({ id: r.id, status });

  return (
    <Panel className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex w-24 shrink-0 flex-col rounded-lg bg-accent px-3 py-2 text-center text-primary">
        <span className="text-xs font-medium uppercase">{formatDate(r.reservation_date).split(",")[0]}</span>
        <span className="text-xl font-bold">{r.reservation_time}</span>
      </div>
      <div className="min-w-0 flex-1 space-y-1 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{r.customer_name}</span>
          <StatusBadge status={r.status} />
        </div>
        <p className="text-muted-foreground">{formatDate(r.reservation_date)}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> {r.party_size} guest{r.party_size !== 1 ? "s" : ""}
          </span>
          <a
            href={`mailto:${r.customer_email}`}
            className="inline-flex items-center gap-1.5 hover:text-primary"
          >
            <Mail className="h-3.5 w-3.5" /> {r.customer_email}
          </a>
        </div>
        {r.special_requests && (
          <p className="flex items-start gap-1.5 text-muted-foreground">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {r.special_requests}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        {r.status === "pending" && (
          <Button size="sm" disabled={mutation.isPending} onClick={() => update("confirmed")}>
            Confirm
          </Button>
        )}
        {r.status === "confirmed" && (
          <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => update("completed")}>
            Seated
          </Button>
        )}
        {(r.status === "pending" || r.status === "confirmed") && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            disabled={mutation.isPending}
            onClick={() => update("cancelled")}
          >
            Cancel
          </Button>
        )}
      </div>
    </Panel>
  );
}
