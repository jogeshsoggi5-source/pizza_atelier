import { Facebook, Instagram, Twitter } from "lucide-react";

import type { StoreSettings } from "@/lib/store-status";

/** Social icons set in /admin/settings; an empty URL hides that icon. */
export function SocialLinks({
  settings,
  className,
  linkClassName,
  iconClassName,
}: {
  settings: StoreSettings;
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}) {
  const links = [
    { label: "Instagram", icon: Instagram, href: settings.instagram_url },
    { label: "Facebook", icon: Facebook, href: settings.facebook_url },
    { label: "Twitter", icon: Twitter, href: settings.twitter_url },
  ].filter((link) => link.href?.trim());

  if (links.length === 0) return null;

  return (
    <div className={className}>
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href!}
          target="_blank"
          rel="noreferrer"
          aria-label={link.label}
          className={linkClassName}
        >
          <link.icon className={iconClassName} />
        </a>
      ))}
    </div>
  );
}
