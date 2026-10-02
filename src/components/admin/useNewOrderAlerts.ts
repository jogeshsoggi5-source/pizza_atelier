import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { AdminOrder } from "@/lib/admin-api";

const SOUND_KEY = "admin:order-sound";

function readSoundPref() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

/** A short two-note chime made with Web Audio, so no sound file is needed. */
function playChime() {
  try {
    const ctx = new AudioContext();
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.55);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch {
    // Audio blocked until the admin interacts with the page; the toast still shows.
  }
}

/**
 * Watches the polled order list and announces orders that weren't there before:
 * chime, toast, desktop notification (if allowed) and a count in the tab title.
 */
export function useNewOrderAlerts(orders: AdminOrder[] | undefined) {
  const seen = useRef<Set<string> | null>(null);
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => setSoundOn(readSoundPref()), []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? "on" : "off");
    } catch {
      // Preference just won't persist.
    }
    if (next) {
      playChime();
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  };

  useEffect(() => {
    if (!orders) return;
    // First load: remember what's already there without alerting.
    if (!seen.current) {
      seen.current = new Set(orders.map((o) => o.id));
      return;
    }
    const fresh = orders.filter((o) => !seen.current!.has(o.id) && o.status === "pending");
    orders.forEach((o) => seen.current!.add(o.id));
    if (fresh.length === 0) return;

    if (soundOn) playChime();
    for (const o of fresh) {
      toast.success(`New order ${o.order_number}`, {
        description: `${o.customer_name ?? "Customer"} · ${o.fulfillment_type}`,
      });
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted" &&
        document.hidden
      ) {
        new Notification(`New order ${o.order_number}`, {
          body: `${o.customer_name ?? "Customer"} · ${o.fulfillment_type}`,
        });
      }
    }
  }, [orders, soundOn]);

  const pendingCount = orders?.filter((o) => o.status === "pending").length ?? 0;
  useEffect(() => {
    document.title = pendingCount > 0 ? `(${pendingCount}) Admin — Pizza Atelier` : "Admin — Pizza Atelier";
  }, [pendingCount]);

  return { soundOn, toggleSound, pendingCount };
}
