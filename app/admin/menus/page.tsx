import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { getAllMenus } from "@/lib/data/menus";
import { listCmsDocuments } from "@/lib/data/adminCms";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { MenuManager } from "@/components/admin/menus/MenuManager";

export const metadata = {
  title: "Menu Management | Admin",
};

export default async function MenuManagementPage() {
  const auth = await getCurrentAdminSession("settings:manage");
  if (!auth.ok) redirect("/admin/login");

  const [menus, pagesData] = await Promise.all([
    getAllMenus(),
    listCmsDocuments("pages", auth.session, { status: "published" }),
  ]);

  // Build page options for the internal page picker
  const pages = pagesData
    .filter((p) => typeof p.slug === "string" && typeof p.title === "string")
    .map((p) => ({
      slug: p.slug as string,
      title: p.title as string,
    }));

  // Add well-known routes that aren't CMS pages
  const knownRoutes = [
    { slug: "sermons", title: "Sermons" },
    { slug: "events", title: "Events" },
    { slug: "announcements", title: "Announcements" },
    { slug: "ministries", title: "Ministries" },
    { slug: "resources", title: "Resources" },
    { slug: "contact", title: "Contact" },
    { slug: "give", title: "Give" },
    { slug: "live", title: "Live Stream" },
    { slug: "im-new", title: "I'm New" },
    { slug: "about", title: "About" },
    { slug: "our-beliefs", title: "Our Beliefs" },
    { slug: "our-leaders", title: "Our Leaders" },
    { slug: "plan-your-visit", title: "Plan Your Visit" },
    { slug: "volunteer", title: "Volunteer" },
    { slug: "submit-announcement", title: "Submit Announcement" },
    { slug: "church-calendar", title: "Church Calendar" },
    { slug: "church-bulletin", title: "Church Bulletin" },
    { slug: "prayer-request", title: "Prayer Request" },
    { slug: "maintenance-request", title: "Maintenance Request" },
    { slug: "membership-transfer", title: "Membership Transfer" },
  ];

  // Merge, avoiding duplicates
  const existingSlugs = new Set(pages.map((p) => p.slug));
  for (const route of knownRoutes) {
    if (!existingSlugs.has(route.slug)) {
      pages.push(route);
    }
  }

  // Sort alphabetically
  pages.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <AdminPageShell title="" description="">
      <MenuManager
        initialHeaderItems={menus.header}
        initialFooterItems={menus.footer}
        pages={pages}
      />
    </AdminPageShell>
  );
}
