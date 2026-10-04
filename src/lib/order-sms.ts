import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";

import type { OrderLine } from "@/lib/supabase-queries";

/**
 * Order-confirmation SMS, sent from the server so provider keys never reach the browser.
 *
 * Configure ONE provider with environment variables (Vercel → Settings → Environment
 * Variables, or .env locally), then redeploy:
 *   Fast2SMS: FAST2SMS_API_KEY
 *   Twilio:   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM (number or MG… service SID)
 * Optional: SMS_PROVIDER (fast2sms | twilio) to choose when several are set,
 *           SMS_COUNTRY_CODE (default 91) for numbers entered without one,
 *           SITE_URL (e.g. https://pizzaatelier.com) for the tracking link.
 */

type Provider = "fast2sms" | "twilio";

export type SmsResult =
  | { status: "sent"; provider: Provider }
  | { status: "already_sent" }
  | { status: "not_configured" }
  | { status: "failed"; error: string };

function env(name: string): string | undefined {
  const value = typeof process !== "undefined" ? process.env?.[name] : undefined;
  return value?.trim() || undefined;
}

function configuredProvider(): Provider | null {
  const hasFast2sms = !!env("FAST2SMS_API_KEY");
  const hasTwilio = !!(env("TWILIO_ACCOUNT_SID") && env("TWILIO_AUTH_TOKEN") && env("TWILIO_FROM"));
  const preferred = env("SMS_PROVIDER")?.toLowerCase();
  if (preferred === "fast2sms" && hasFast2sms) return "fast2sms";
  if (preferred === "twilio" && hasTwilio) return "twilio";
  if (hasFast2sms) return "fast2sms";
  if (hasTwilio) return "twilio";
  return null;
}

/** "+91 98765-43210", "098765 43210" or "9876543210" → { national: "9876543210", e164: "+919876543210" }. */
function normalizePhone(raw: string) {
  const countryCode = (env("SMS_COUNTRY_CODE") ?? "91").replace(/\D/g, "");
  const trimmed = raw.trim();
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+")) return { national: digits.slice(-10), e164: `+${digits}` };
  if (digits.startsWith("00")) return { national: digits.slice(-10), e164: `+${digits.slice(2)}` };
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) return { national: digits, e164: `+${countryCode}${digits}` };
  return { national: digits.slice(-10), e164: `+${digits}` };
}

/** Plain-ASCII money ("Rs.") keeps the SMS in the cheaper GSM character set. */
const money = (n: number) => `Rs.${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

interface SmsOrder {
  order_number: string;
  customer_name: string | null;
  items: OrderLine[];
  total_amount: number;
  delivery_fee: number;
  grand_total: number;
  fulfillment_type: "delivery" | "pickup";
  receipt_token?: string | null;
}

export function buildConfirmationSms(order: SmsOrder, trackUrl: string) {
  const firstName = order.customer_name?.trim().split(/\s+/)[0];
  const maxLines = 8;
  const lines = order.items.slice(0, maxLines).map((i) => {
    const detail = [i.size, ...(i.extras ?? [])].filter(Boolean).join(", ");
    return `${i.qty}x ${i.name}${detail ? ` (${detail})` : ""} ${money(i.unit_price * i.qty)}`;
  });
  if (order.items.length > maxLines) lines.push(`+${order.items.length - maxLines} more item(s)`);
  const eta =
    order.fulfillment_type === "delivery"
      ? "It will reach you in about 30-40 min."
      : "It will be ready for pickup in about 20 min.";

  return [
    "PIZZA ATELIER",
    `${firstName ? `Hi ${firstName}, your` : "Your"} order ${order.order_number} is confirmed. ${eta}`,
    "",
    "BILL",
    ...lines,
    `Subtotal ${money(order.total_amount)}`,
    ...(order.delivery_fee > 0 ? [`Delivery ${money(order.delivery_fee)}`] : []),
    `TOTAL ${money(order.grand_total)} - pay on ${order.fulfillment_type}`,
    "",
    `Track order & receipt: ${trackUrl}`,
    "Thank you!",
  ].join("\n");
}

async function sendFast2sms(phone: string, message: string) {
  // Quick SMS route; see https://docs.fast2sms.com. Indian 10-digit numbers only.
  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: { authorization: env("FAST2SMS_API_KEY")!, "content-type": "application/json" },
    body: JSON.stringify({ route: "q", message, language: "english", flash: 0, numbers: phone }),
  });
  const body = (await res.json().catch(() => ({}))) as { return?: boolean; message?: unknown };
  if (!res.ok || body.return !== true) {
    const detail = Array.isArray(body.message) ? body.message.join(" ") : body.message;
    throw new Error(`Fast2SMS: ${detail ?? res.statusText}`);
  }
}

async function sendTwilio(phone: string, message: string) {
  const sid = env("TWILIO_ACCOUNT_SID")!;
  const from = env("TWILIO_FROM")!;
  const form = new URLSearchParams({ To: phone, Body: message });
  form.set(from.startsWith("MG") ? "MessagingServiceSid" : "From", from);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${btoa(`${sid}:${env("TWILIO_AUTH_TOKEN")}`)}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(`Twilio: ${body.message ?? res.statusText}`);
  }
}

/** Which provider is set up, for the admin Settings page. Reveals no secrets. */
export const getSmsStatus = createServerFn({ method: "GET" }).handler(async () => {
  return { provider: configuredProvider() };
});

/**
 * Texts the customer their confirmation and bill. Called by the admin panel after an
 * order is confirmed; the caller's Supabase session must belong to an admin.
 */
export const sendOrderConfirmationSms = createServerFn({ method: "POST" })
  .validator((data: { orderId: string; accessToken: string; origin: string; force?: boolean }) => {
    if (!data?.orderId || !data.accessToken) throw new Error("Missing order or session");
    return data;
  })
  .handler(async ({ data }): Promise<SmsResult> => {
    const url = import.meta.env.VITE_SUPABASE_URL ?? env("VITE_SUPABASE_URL");
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? env("VITE_SUPABASE_ANON_KEY");
    if (!url || !anonKey) return { status: "failed", error: "Supabase is not configured" };

    // Acts as the signed-in admin, so row-level security still applies.
    const db = createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: isAdmin } = await db.rpc("is_admin");
    if (!isAdmin) return { status: "failed", error: "Only admins can send order messages" };

    const { data: order, error } = await db.from("orders").select("*").eq("id", data.orderId).maybeSingle();
    if (error || !order) return { status: "failed", error: error?.message ?? "Order not found" };
    if (order.sms_sent_at && !data.force) return { status: "already_sent" };
    if (!order.customer_phone) return { status: "failed", error: "Order has no phone number" };

    const provider = configuredProvider();
    if (!provider) return { status: "not_configured" };

    const site = (env("SITE_URL") ?? (/^https?:\/\//.test(data.origin) ? data.origin : "")).replace(/\/$/, "");
    const params = new URLSearchParams({ order: order.order_number });
    if (order.receipt_token) params.set("t", order.receipt_token);
    const message = buildConfirmationSms(order as SmsOrder, `${site}/track?${params.toString()}`);

    const phone = normalizePhone(order.customer_phone);
    try {
      if (provider === "fast2sms") await sendFast2sms(phone.national, message);
      else await sendTwilio(phone.e164, message);
    } catch (e) {
      const message = e instanceof Error ? e.message : "SMS failed";
      await db.from("orders").update({ sms_error: message }).eq("id", data.orderId);
      return { status: "failed", error: message };
    }

    await db
      .from("orders")
      .update({ sms_sent_at: new Date().toISOString(), sms_error: null })
      .eq("id", data.orderId);
    return { status: "sent", provider };
  });
