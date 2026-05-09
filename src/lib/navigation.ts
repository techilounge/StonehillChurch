// ============================================
// Stonehill SDA Church — Navigation Configuration
// ============================================

import type { AdminNavItem, NavItem } from "@/types";

/** Public site main navigation */
export const PUBLIC_NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "About",
    href: "/about",
    children: [
      { label: "About Us", href: "/about" },
      { label: "Our Beliefs", href: "/our-beliefs" },
      { label: "Our Leaders", href: "/our-leaders" },
    ],
  },
  {
    label: "I'm New",
    href: "/im-new",
    children: [
      { label: "I'm New", href: "/im-new" },
      { label: "Plan Your Visit", href: "/plan-your-visit" },
    ],
  },
  {
    label: "Worship",
    href: "/sermons",
    children: [
      { label: "Sermons", href: "/sermons" },
      { label: "Live Stream", href: "/live" },
    ],
  },
  {
    label: "Ministries",
    href: "/ministries",
  },
  {
    label: "Events",
    href: "/events",
    children: [
      { label: "Upcoming Events", href: "/events" },
      { label: "Church Calendar", href: "/church-calendar" },
    ],
  },
  {
    label: "Connect",
    href: "/contact",
    children: [
      { label: "Contact Us", href: "/contact" },
      { label: "Prayer Request", href: "/prayer-request" },
      { label: "Volunteer", href: "/volunteer" },
      { label: "Submit Announcement", href: "/submit-announcement" },
      { label: "Membership Transfer", href: "/membership-transfer" },
      { label: "Maintenance Request", href: "/maintenance-request" },
    ],
  },
  {
    label: "Resources",
    href: "/resources",
    children: [
      { label: "Resources", href: "/resources" },
      { label: "Church Bulletin", href: "/church-bulletin" },
    ],
  },
  {
    label: "Give",
    href: "/give",
  },
];

/** Admin Console sidebar navigation */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Homepage Slides", href: "/admin/homepage-slides", icon: "Images" },
  { label: "Sermons", href: "/admin/sermons", icon: "BookOpen" },
  { label: "Events", href: "/admin/events", icon: "Calendar" },
  { label: "Ministries", href: "/admin/ministries", icon: "Users" },
  { label: "Leaders", href: "/admin/leaders", icon: "UserCircle" },
  { label: "Announcements", href: "/admin/announcements", icon: "Megaphone" },
  { label: "Resources", href: "/admin/resources", icon: "FileText" },
  { label: "Forms", href: "/admin/forms", icon: "Inbox" },
  { label: "Media", href: "/admin/media", icon: "Image" },
  { label: "YouTube", href: "/admin/youtube", icon: "Youtube" },
  { label: "Users", href: "/admin/users", icon: "Shield" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
];
