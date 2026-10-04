import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  preparing: "bg-orange-100 text-orange-800",
  ready: "bg-violet-100 text-violet-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-zinc-200 text-zinc-600",
  // Contact messages
  new: "bg-amber-100 text-amber-800",
  read: "bg-zinc-200 text-zinc-600",
  replied: "bg-emerald-100 text-emerald-800",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
        statusStyles[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}
