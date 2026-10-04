import { Link } from "@tanstack/react-router";

import { SocialLinks } from "@/components/site/SocialLinks";
import { addressLines, phoneHref, useSiteSettings } from "@/lib/store-status";

export function Footer() {
  const settings = useSiteSettings();

  return (
    <footer className="bg-charcoal text-cream">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <p className="font-logo text-2xl font-semibold">
            Pizza <span className="text-gold">Atelier</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            Where artisan pizza meets creativity. Handcrafted, wood-fired, and made with
            locally sourced ingredients.
          </p>
          <SocialLinks
            settings={settings}
            className="mt-5 flex gap-3"
            linkClassName="rounded-full border border-cream/20 p-2 transition-colors hover:border-gold hover:text-gold"
            iconClassName="h-4 w-4"
          />
        </div>

        <div>
          <h3 className="font-display text-lg">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream/70">
            <li><Link to="/menu" className="transition-colors hover:text-gold">Menu</Link></li>
            <li><Link to="/order" className="transition-colors hover:text-gold">Order Online</Link></li>
            <li><Link to="/reservations" className="transition-colors hover:text-gold">Reservations</Link></li>
            <li><Link to="/gallery" className="transition-colors hover:text-gold">Gallery</Link></li>
            <li><Link to="/about" className="transition-colors hover:text-gold">Our Story</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg">Opening Hours</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream/70">
            {settings.opening_hours.map((row) => (
              <li key={row.days} className="flex justify-between gap-4">
                <span>{row.days}</span>
                <span>{row.hours}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-lg">Contact</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream/70">
            <li>{addressLines(settings.address).join(", ")}</li>
            <li>
              <a href={phoneHref(settings.phone)} className="transition-colors hover:text-gold">
                {settings.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${settings.email}`} className="transition-colors hover:text-gold">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Pizza Atelier. All rights reserved.</p>
          <p>Crafted like art. Baked with passion.</p>
        </div>
      </div>
    </footer>
  );
}
