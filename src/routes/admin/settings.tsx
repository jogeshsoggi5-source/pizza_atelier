import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminStoreSettings, useUpdateStoreSettings } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings, error } = useAdminStoreSettings();
  const update = useUpdateStoreSettings();
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (settings) setMessage(settings.paused_message ?? "");
  }, [settings]);

  const accepting = settings?.accepting_orders ?? true;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Business" title="Settings" description="Control how the website takes orders." />

      {error && (
        <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {(error as Error).message}. Run <code>supabase/admin_features_migration.sql</code>.
        </p>
      )}

      <Panel title="Online ordering" className="max-w-2xl">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="font-medium">{accepting ? "Accepting orders" : "Orders paused"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              When paused, customers can still browse the menu but can't place orders. Use this
              when the kitchen is overloaded or you're closed.
            </p>
          </div>
          <Switch
            checked={accepting}
            disabled={!settings || update.isPending}
            onCheckedChange={(checked) =>
              update.mutate(
                { accepting_orders: checked },
                { onSuccess: () => toast.success(checked ? "Online orders are open" : "Online orders paused") },
              )
            }
          />
        </div>

        <div className="mt-6 space-y-2 border-t border-border/60 pt-6">
          <Label htmlFor="paused-message">Message shown while paused</Label>
          <Textarea
            id="paused-message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Online ordering is paused right now. Please call us to order."
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={!settings || update.isPending || message === (settings?.paused_message ?? "")}
              onClick={() =>
                update.mutate(
                  { paused_message: message.trim() || null },
                  { onSuccess: () => toast.success("Message saved") },
                )
              }
            >
              Save message
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Admin access" className="max-w-2xl">
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>
            In Supabase, go to <b>Authentication → Users → Add user</b> and create their login.
          </li>
          <li>
            In the <b>SQL Editor</b>, run:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-charcoal p-3 text-xs text-cream">
              {`INSERT INTO admins (user_id)
  SELECT id FROM auth.users WHERE email = 'their@email.com';`}
            </pre>
          </li>
          <li>To change a password, use the user's menu in Authentication → Users.</li>
        </ol>
      </Panel>
    </div>
  );
}
