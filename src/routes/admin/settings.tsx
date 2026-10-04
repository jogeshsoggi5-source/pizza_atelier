import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { PageHeader, Panel } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdminStoreSettings, useUpdateStoreSettings } from "@/lib/admin-api";
import type { OpeningHours, StoreSettings } from "@/lib/store-status";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: settings, error } = useAdminStoreSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Business"
        title="Settings"
        description="Control every customer-facing feature of the website. Changes show on the site within a minute."
      />

      {error && (
        <p className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
          {(error as Error).message}. Run <code>supabase/admin_features_migration.sql</code> and{" "}
          <code>supabase/website_settings_migration.sql</code>.
        </p>
      )}

      {settings && (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <OrderingPanel settings={settings} />
            <ReservationsPanel settings={settings} />
            <ContactFormPanel settings={settings} />
            <AnnouncementPanel settings={settings} />
          </div>
          <div className="space-y-6">
            <BusinessInfoPanel settings={settings} />
            <AdminAccessPanel />
          </div>
        </div>
      )}
    </div>
  );
}

/** Saves one or more settings and shows a toast on success. */
function useSave() {
  const update = useUpdateStoreSettings();
  const save = (updates: Partial<StoreSettings>, message: string) =>
    update.mutate(updates, { onSuccess: () => toast.success(message) });
  return { save, pending: update.isPending };
}

function ToggleRow({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: ReactNode;
  description: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="data-[state=checked]:bg-secondary"
      />
    </div>
  );
}

/** Textarea with a save button that enables once the text changes. */
function MessageField({
  id,
  label,
  value,
  placeholder,
  disabled,
  onSave,
}: {
  id: string;
  label: string;
  value: string | null;
  placeholder: string;
  disabled: boolean;
  onSave: (value: string | null) => void;
}) {
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={3}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
      />
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={disabled || draft === (value ?? "")}
          onClick={() => onSave(draft.trim() || null)}
        >
          Save message
        </Button>
      </div>
    </div>
  );
}

function OrderingPanel({ settings }: { settings: StoreSettings }) {
  const { save, pending } = useSave();
  const [fee, setFee] = useState(String(settings.delivery_fee));
  const [minimum, setMinimum] = useState(String(settings.min_order_amount));
  useEffect(() => {
    setFee(String(settings.delivery_fee));
    setMinimum(String(settings.min_order_amount));
  }, [settings.delivery_fee, settings.min_order_amount]);

  const feeValue = Number(fee);
  const minimumValue = Number(minimum);
  const pricesValid =
    fee.trim() !== "" &&
    minimum.trim() !== "" &&
    Number.isFinite(feeValue) &&
    Number.isFinite(minimumValue) &&
    feeValue >= 0 &&
    minimumValue >= 0;
  const pricesChanged =
    feeValue !== settings.delivery_fee || minimumValue !== settings.min_order_amount;

  return (
    <Panel title="Online ordering">
      <div className="space-y-6">
        <ToggleRow
          title={settings.accepting_orders ? "Accepting orders" : "Orders paused"}
          description="When paused, customers can still browse the menu but can't place orders. Use this when the kitchen is overloaded or you're closed."
          checked={settings.accepting_orders}
          disabled={pending}
          onChange={(checked) =>
            save({ accepting_orders: checked }, checked ? "Online orders are open" : "Online orders paused")
          }
        />

        <div className="space-y-4 border-t border-border/60 pt-6">
          <ToggleRow
            title="Delivery"
            description="Let customers order for delivery to their address."
            checked={settings.delivery_enabled}
            // At least one of delivery and pickup has to stay on.
            disabled={pending || (settings.delivery_enabled && !settings.pickup_enabled)}
            onChange={(checked) =>
              save({ delivery_enabled: checked }, checked ? "Delivery turned on" : "Delivery turned off")
            }
          />
          <ToggleRow
            title="Pickup"
            description="Let customers order ahead and collect from the restaurant."
            checked={settings.pickup_enabled}
            disabled={pending || (settings.pickup_enabled && !settings.delivery_enabled)}
            onChange={(checked) =>
              save({ pickup_enabled: checked }, checked ? "Pickup turned on" : "Pickup turned off")
            }
          />
        </div>

        <div className="space-y-3 border-t border-border/60 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="delivery-fee">Delivery fee (₹)</Label>
              <Input
                id="delivery-fee"
                type="number"
                min={0}
                step="1"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="min-order">Minimum order (₹)</Label>
              <Input
                id="min-order"
                type="number"
                min={0}
                step="1"
                value={minimum}
                onChange={(e) => setMinimum(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Before delivery fee. 0 means no minimum.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              disabled={pending || !pricesValid || !pricesChanged}
              onClick={() =>
                save({ delivery_fee: feeValue, min_order_amount: minimumValue }, "Prices saved")
              }
            >
              Save prices
            </Button>
          </div>
        </div>

        <div className="border-t border-border/60 pt-6">
          <MessageField
            id="paused-message"
            label="Message shown while orders are paused"
            value={settings.paused_message}
            placeholder="Online ordering is paused right now. Please call us to order."
            disabled={pending}
            onSave={(value) => save({ paused_message: value }, "Message saved")}
          />
        </div>
      </div>
    </Panel>
  );
}

function ReservationsPanel({ settings }: { settings: StoreSettings }) {
  const { save, pending } = useSave();

  return (
    <Panel title="Reservations">
      <div className="space-y-6">
        <ToggleRow
          title={settings.accepting_reservations ? "Accepting reservations" : "Reservations paused"}
          description="When paused, the reservations page shows your message instead of taking bookings."
          checked={settings.accepting_reservations}
          disabled={pending}
          onChange={(checked) =>
            save(
              { accepting_reservations: checked },
              checked ? "Reservations are open" : "Reservations paused",
            )
          }
        />
        <div className="border-t border-border/60 pt-6">
          <MessageField
            id="reservations-message"
            label="Message shown while reservations are paused"
            value={settings.reservations_paused_message}
            placeholder={`Online reservations are paused right now. Please call us at ${settings.phone}.`}
            disabled={pending}
            onSave={(value) => save({ reservations_paused_message: value }, "Message saved")}
          />
        </div>
      </div>
    </Panel>
  );
}

function ContactFormPanel({ settings }: { settings: StoreSettings }) {
  const { save, pending } = useSave();

  return (
    <Panel title="Contact form">
      <ToggleRow
        title={settings.contact_form_enabled ? "Contact form on" : "Contact form off"}
        description="Shows a message form on the contact page. Messages arrive in Messages."
        checked={settings.contact_form_enabled}
        disabled={pending}
        onChange={(checked) =>
          save(
            { contact_form_enabled: checked },
            checked ? "Contact form turned on" : "Contact form turned off",
          )
        }
      />
    </Panel>
  );
}

function AnnouncementPanel({ settings }: { settings: StoreSettings }) {
  const { save, pending } = useSave();
  const [draft, setDraft] = useState(settings.announcement ?? "");
  useEffect(() => setDraft(settings.announcement ?? ""), [settings.announcement]);

  return (
    <Panel
      title="Announcement bar"
      action={
        <span className="text-xs font-medium text-muted-foreground">
          {settings.announcement ? "Showing" : "Hidden"}
        </span>
      }
    >
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          A banner across the top of every page — offers, holiday hours, delays.
        </p>
        {draft.trim() && (
          <div className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground">
            {draft}
          </div>
        )}
        <Input
          value={draft}
          maxLength={200}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g. 20% off all pizzas this weekend!"
          aria-label="Announcement text"
        />
        <div className="flex justify-end gap-2">
          {settings.announcement && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => save({ announcement: null }, "Announcement removed")}
            >
              Remove
            </Button>
          )}
          <Button
            size="sm"
            disabled={pending || !draft.trim() || draft.trim() === (settings.announcement ?? "")}
            onClick={() => save({ announcement: draft.trim() }, "Announcement published")}
          >
            Publish
          </Button>
        </div>
      </div>
    </Panel>
  );
}

type BusinessInfo = Pick<
  StoreSettings,
  "phone" | "email" | "address" | "opening_hours" | "instagram_url" | "facebook_url" | "twitter_url"
>;

function pickBusinessInfo(s: StoreSettings): BusinessInfo {
  return {
    phone: s.phone,
    email: s.email,
    address: s.address,
    opening_hours: s.opening_hours,
    instagram_url: s.instagram_url ?? "",
    facebook_url: s.facebook_url ?? "",
    twitter_url: s.twitter_url ?? "",
  };
}

function BusinessInfoPanel({ settings }: { settings: StoreSettings }) {
  const { save, pending } = useSave();
  const saved = pickBusinessInfo(settings);
  const [draft, setDraft] = useState<BusinessInfo>(saved);
  const savedJson = JSON.stringify(saved);
  useEffect(() => setDraft(JSON.parse(savedJson)), [savedJson]);

  const set = <K extends keyof BusinessInfo>(key: K, value: BusinessInfo[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const setHours = (index: number, row: Partial<OpeningHours>) =>
    set(
      "opening_hours",
      draft.opening_hours.map((r, i) => (i === index ? { ...r, ...row } : r)),
    );

  const changed = JSON.stringify(draft) !== savedJson;
  const valid = draft.phone.trim() && draft.email.trim() && draft.address.trim();

  const handleSave = () =>
    save(
      {
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        address: draft.address.trim(),
        opening_hours: draft.opening_hours
          .map((r) => ({ days: r.days.trim(), hours: r.hours.trim() }))
          .filter((r) => r.days || r.hours),
        instagram_url: draft.instagram_url?.trim() || null,
        facebook_url: draft.facebook_url?.trim() || null,
        twitter_url: draft.twitter_url?.trim() || null,
      },
      "Business info saved",
    );

  return (
    <Panel title="Business info">
      <p className="-mt-2 mb-5 text-sm text-muted-foreground">
        Shown in the footer, contact page and reservations page.
      </p>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="biz-phone">Phone</Label>
            <Input id="biz-phone" value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="biz-email">Email</Label>
            <Input
              id="biz-email"
              type="email"
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="biz-address">Address</Label>
          <Textarea
            id="biz-address"
            rows={2}
            value={draft.address}
            onChange={(e) => set("address", e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            One line per row. Also used for the map on the contact page.
          </p>
        </div>

        <div className="space-y-2 border-t border-border/60 pt-5">
          <Label>Opening hours</Label>
          {draft.opening_hours.map((row, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={row.days}
                placeholder="Mon – Thu"
                aria-label="Days"
                onChange={(e) => setHours(i, { days: e.target.value })}
              />
              <Input
                value={row.hours}
                placeholder="11:30 – 22:00"
                aria-label="Hours"
                onChange={(e) => setHours(i, { hours: e.target.value })}
              />
              <Button
                size="icon"
                variant="ghost"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label="Remove row"
                onClick={() =>
                  set(
                    "opening_hours",
                    draft.opening_hours.filter((_, j) => j !== i),
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => set("opening_hours", [...draft.opening_hours, { days: "", hours: "" }])}
          >
            <Plus className="h-3.5 w-3.5" /> Add row
          </Button>
        </div>

        <div className="space-y-3 border-t border-border/60 pt-5">
          <div>
            <Label>Social links</Label>
            <p className="mt-1 text-xs text-muted-foreground">Leave blank to hide an icon.</p>
          </div>
          {(
            [
              ["instagram_url", "Instagram"],
              ["facebook_url", "Facebook"],
              ["twitter_url", "Twitter / X"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="grid items-center gap-1.5 sm:grid-cols-[100px_1fr]">
              <Label htmlFor={`biz-${key}`} className="text-muted-foreground">
                {label}
              </Label>
              <Input
                id={`biz-${key}`}
                type="url"
                placeholder="https://"
                value={draft[key] ?? ""}
                onChange={(e) => set(key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 pt-5">
          {changed && (
            <Button size="sm" variant="ghost" onClick={() => setDraft(JSON.parse(savedJson))}>
              Discard
            </Button>
          )}
          <Button size="sm" disabled={pending || !changed || !valid} onClick={handleSave}>
            Save business info
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function AdminAccessPanel() {
  return (
    <Panel title="Admin access">
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
  );
}
