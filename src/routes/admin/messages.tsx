import { createFileRoute } from "@tanstack/react-router";
import { Inbox, Mail, Phone, Trash2 } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { EmptyState, PageHeader, Panel, Segmented } from "@/components/admin/ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  useDeleteMessage,
  useMessageStatusMutation,
  useMessages,
  type ContactMessage,
} from "@/lib/admin-api";

export const Route = createFileRoute("/admin/messages")({
  component: AdminMessagesPage,
});

const filters = ["new", "read", "replied", "all"] as const;
type Filter = (typeof filters)[number];

function AdminMessagesPage() {
  const { data: messages = [], isLoading, error } = useMessages();
  const [filter, setFilter] = useState<Filter>("new");

  const visible = filter === "all" ? messages : messages.filter((m) => m.status === filter);
  const counts: Record<Filter, number> = {
    new: messages.filter((m) => m.status === "new").length,
    read: messages.filter((m) => m.status === "read").length,
    replied: messages.filter((m) => m.status === "replied").length,
    all: messages.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Messages"
        description="Questions, catering requests and feedback from the contact form."
      />

      <Segmented
        value={filter}
        options={filters.map((f) => ({ value: f, label: f, count: counts[f] }))}
        onChange={setFilter}
      />

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading messages…</p>}
        {error && (
          <p className="text-sm text-primary">Couldn't load messages: {(error as Error).message}</p>
        )}
        {!isLoading && !error && visible.length === 0 && (
          <Panel>
            <EmptyState icon={Inbox}>No messages here.</EmptyState>
          </Panel>
        )}
        {visible.map((m) => (
          <MessageCard key={m.id} message={m} />
        ))}
      </div>
    </div>
  );
}

function MessageCard({ message: m }: { message: ContactMessage }) {
  const mutation = useMessageStatusMutation();
  const remove = useDeleteMessage();
  const update = (status: ContactMessage["status"]) => mutation.mutate({ id: m.id, status });
  const replySubject = `Re: ${m.subject || "Your message to Pizza Atelier"}`;

  return (
    <Panel className="space-y-3 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{m.name}</span>
            <StatusBadge status={m.status} />
            {m.message_type && (
              <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold capitalize text-accent-foreground">
                {m.message_type}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
            <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 hover:text-primary">
              <Mail className="h-3.5 w-3.5" /> {m.email}
            </a>
            {m.phone && (
              <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary">
                <Phone className="h-3.5 w-3.5" /> {m.phone}
              </a>
            )}
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(m.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
        </span>
      </div>

      <div className="rounded-lg bg-muted/50 p-3 text-sm">
        {m.subject && <p className="mb-1 font-medium">{m.subject}</p>}
        <p className="whitespace-pre-wrap text-muted-foreground">{m.message}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild>
          <a
            href={`mailto:${m.email}?subject=${encodeURIComponent(replySubject)}`}
            onClick={() => m.status !== "replied" && update("replied")}
          >
            Reply by email
          </a>
        </Button>
        {m.status === "new" && (
          <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => update("read")}>
            Mark as read
          </Button>
        )}
        {m.status !== "new" && (
          <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => update("new")}>
            Mark as unread
          </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-muted-foreground hover:text-destructive"
              disabled={remove.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this message?</AlertDialogTitle>
              <AlertDialogDescription>
                The message from {m.name} will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction onClick={() => remove.mutate(m.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Panel>
  );
}
