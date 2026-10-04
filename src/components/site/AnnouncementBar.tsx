import { useSiteSettings } from "@/lib/store-status";

/** Site-wide banner set from /admin/settings; hidden when the announcement is empty. */
export function AnnouncementBar() {
  const { announcement } = useSiteSettings();
  if (!announcement?.trim()) return null;

  return (
    <div className="bg-primary print:hidden px-4 py-2 text-center text-sm font-medium text-primary-foreground">
      {announcement}
    </div>
  );
}
