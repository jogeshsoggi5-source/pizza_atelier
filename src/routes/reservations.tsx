import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import galleryInterior from "@/assets/gallery-interior.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { phoneHref, useSiteSettings } from "@/lib/store-status";
import { createReservation } from "@/lib/supabase-queries";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/reservations")({
  head: () => ({
    meta: [
      { title: "Reservations — Pizza Atelier" },
      {
        name: "description",
        content:
          "Reserve a table at Pizza Atelier in Brooklyn. Wood-fired pizza, warm atmosphere, and a seat by the oven.",
      },
      { property: "og:title", content: "Reservations — Pizza Atelier" },
      { property: "og:description", content: "Reserve your table by the wood-fired oven." },
    ],
  }),
  component: ReservationsPage,
});

const timeSlots = [
  "11:30", "12:00", "12:30", "13:00", "13:30", "14:00",
  "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
];

function ReservationsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const settings = useSiteSettings();
  const paused = !settings.accepting_reservations;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (paused) {
      toast.error("We're not taking reservations online right now.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const date = String(form.get("date") ?? "").trim();
    if (!name || !email || !date) {
      toast.error("Please fill in your name, email, and date.");
      return;
    }
    setSubmitting(true);
    const { error } = await createReservation({
      customer_name: name,
      customer_email: email,
      reservation_date: date,
      reservation_time: String(form.get("time") ?? "19:00"),
      party_size: Number(form.get("guests") ?? 2),
      special_requests: String(form.get("notes") ?? "").trim() || undefined,
    });
    setSubmitting(false);
    if (error) {
      console.error("Failed to save reservation:", error);
      toast.error("We couldn't save your reservation. Please try again or call us.");
      return;
    }
    setSubmitted(true);
    toast.success("Reservation request received!");
  };

  if (submitted) {
    return (
      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-20">
        <div className="max-w-md text-center">
          <CalendarCheck className="mx-auto h-16 w-16 text-secondary" />
          <h1 className="mt-6 font-display text-3xl font-bold md:text-4xl">Request Received!</h1>
          <p className="mt-3 text-muted-foreground">
            Thank you! We'll confirm your reservation by email within the hour. We can't wait
            to host you at the atelier.
          </p>
          <Button className="mt-8" onClick={() => setSubmitted(false)}>
            Make Another Reservation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto grid gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
      <div>
        <p className="eyebrow">Reservations</p>
        <h1 className="mt-3 font-display text-4xl font-bold md:text-6xl">Reserve Your Table</h1>
        <p className="mt-4 max-w-md text-muted-foreground">
          Book a seat by the oven and watch the fire work its magic. For parties of 8 or more,
          call us directly at{" "}
          <a href={phoneHref(settings.phone)} className="font-medium text-primary hover:underline">
            {settings.phone}
          </a>.
        </p>
        <img
          src={galleryInterior}
          alt="The warm dining room at Pizza Atelier"
          loading="lazy"
          width={800}
          height={800}
          className="mt-8 hidden w-full rounded-xl object-cover shadow-card lg:block"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-card p-8 shadow-card">
        {paused && (
          <p className="rounded-lg bg-accent p-3 text-sm font-medium text-accent-foreground">
            {settings.reservations_paused_message ||
              `Online reservations are paused right now. Please call us at ${settings.phone}.`}
          </p>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" name="name" placeholder="Your name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" placeholder="you@email.com" required />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" name="date" type="date" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time">Time</Label>
            <Select name="time" defaultValue="19:00">
              <SelectTrigger id="time">
                <SelectValue placeholder="Select a time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="guests">Guests</Label>
          <Select name="guests" defaultValue="2">
            <SelectTrigger id="guests">
              <SelectValue placeholder="Number of guests" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} {n === 1 ? "guest" : "guests"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Special Requests</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Allergies, celebrations, seating preferences..."
            rows={4}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={submitting || paused}>
          {submitting ? "Sending…" : "Request Reservation"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          We'll confirm by email within the hour during opening times.
        </p>
      </form>
    </div>
  );
}
