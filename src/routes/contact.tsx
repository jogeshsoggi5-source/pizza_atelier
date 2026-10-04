import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, Mail, MapPin, Phone } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { SocialLinks } from "@/components/site/SocialLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addressLines, phoneHref, useSiteSettings } from "@/lib/store-status";
import { saveContactMessage } from "@/lib/supabase-queries";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Pizza Atelier" },
      {
        name: "description",
        content:
          "Find Pizza Atelier at 214 Artisan Lane, Brooklyn. Call, email, or drop by — see our opening hours and directions.",
      },
      { property: "og:title", content: "Contact — Pizza Atelier" },
      {
        property: "og:description",
        content: "Find us in Brooklyn — hours, phone, email, and directions.",
      },
    ],
  }),
  component: ContactPage,
});

const messageTypes = [
  { value: "general", label: "General question" },
  { value: "catering", label: "Catering & events" },
  { value: "feedback", label: "Feedback" },
  { value: "complaint", label: "Complaint" },
];

function ContactPage() {
  const settings = useSiteSettings();
  const address = addressLines(settings.address);

  const details = [
    { icon: MapPin, title: "Address", lines: address },
    { icon: Phone, title: "Phone", lines: [settings.phone], href: phoneHref(settings.phone) },
    { icon: Mail, title: "Email", lines: [settings.email], href: `mailto:${settings.email}` },
    {
      icon: Clock,
      title: "Opening Hours",
      lines: settings.opening_hours.map((row) => `${row.days}: ${row.hours}`),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">Come Say Ciao</h1>
        <p className="mt-4 text-muted-foreground">
          Questions, catering, or just craving a slice? We'd love to hear from you.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {details.map((detail) => (
          <div key={detail.title} className="rounded-xl bg-card p-6 text-center shadow-card">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-primary">
              <detail.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">{detail.title}</h2>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {detail.lines.map((line) =>
                detail.href ? (
                  <a
                    key={line}
                    href={detail.href}
                    className="block break-words transition-colors hover:text-primary"
                  >
                    {line}
                  </a>
                ) : (
                  <p key={line}>{line}</p>
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <div
        className={`mt-10 grid gap-6 ${settings.contact_form_enabled ? "lg:grid-cols-2" : ""}`}
      >
        {settings.contact_form_enabled && <ContactForm />}
        <div className="overflow-hidden rounded-xl shadow-card">
          <iframe
            title="Pizza Atelier location on Google Maps"
            src={`https://www.google.com/maps?q=${encodeURIComponent(address.join(", "))}&output=embed`}
            className="h-[400px] w-full border-0 lg:h-full lg:min-h-[400px]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="eyebrow">Follow Us</p>
        <SocialLinks
          settings={settings}
          className="mt-4 flex justify-center gap-4"
          linkClassName="rounded-full border p-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          iconClassName="h-5 w-5"
        />
      </div>
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    if (!name || !email || !message) {
      toast.error("Please fill in your name, email, and message.");
      return;
    }
    setSubmitting(true);
    const { error } = await saveContactMessage({
      name,
      email,
      phone: String(form.get("phone") ?? "").trim() || undefined,
      subject: String(form.get("subject") ?? "").trim() || undefined,
      message,
      message_type: String(form.get("type") ?? "general"),
    });
    setSubmitting(false);
    if (error) {
      console.error("Failed to send message:", error);
      toast.error("We couldn't send your message. Please call or email us instead.");
      return;
    }
    formEl.reset();
    setSent(true);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-card p-8 text-center shadow-card">
        <CheckCircle2 className="h-12 w-12 text-secondary" />
        <h2 className="mt-4 font-display text-2xl font-bold">Message sent!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks for reaching out — we'll get back to you soon.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-card p-8 shadow-card">
      <h2 className="font-display text-2xl font-bold">Send us a message</h2>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Name *</Label>
          <Input id="contact-name" name="name" placeholder="Your name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email *</Label>
          <Input id="contact-email" name="email" type="email" placeholder="you@email.com" required />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input id="contact-phone" name="phone" type="tel" placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-type">Topic</Label>
          <Select name="type" defaultValue="general">
            <SelectTrigger id="contact-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {messageTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">Subject</Label>
        <Input id="contact-subject" name="subject" placeholder="Optional" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message *</Label>
        <Textarea id="contact-message" name="message" rows={5} required />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
