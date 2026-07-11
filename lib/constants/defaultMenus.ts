import type { MenuItem } from "@/types/menus";

export const DEFAULT_HEADER_MENU: MenuItem[] = [
  { id: "h1", label: "I'm New", url: "/im-new", openInNewTab: false, children: [] },
  { id: "h2", label: "Sermons", url: "/sermons", openInNewTab: false, children: [] },
  { id: "h3", label: "Events", url: "/events", openInNewTab: false, children: [] },
  { id: "h4", label: "Ministries", url: "/ministries", openInNewTab: false, children: [] },
  { id: "h5", label: "Resources", url: "/resources", openInNewTab: false, children: [] },
  { id: "h6", label: "Contact", url: "/contact", openInNewTab: false, children: [] },
  {
    id: "h7",
    label: "About",
    url: "/about",
    openInNewTab: false,
    children: [
      { id: "h7-1", label: "Our Beliefs", url: "/our-beliefs", openInNewTab: false, children: [] },
      { id: "h7-2", label: "Our Leaders", url: "/our-leaders", openInNewTab: false, children: [] },
    ],
  },
];

export const DEFAULT_FOOTER_MENU: MenuItem[] = [
  {
    id: "connect",
    label: "Connect",
    url: "#",
    openInNewTab: false,
    children: [
      { id: "c1", label: "I'm New", url: "/im-new", openInNewTab: false, children: [] },
      { id: "c2", label: "Plan Your Visit", url: "/plan-your-visit", openInNewTab: false, children: [] },
      { id: "c3", label: "Contact", url: "/contact", openInNewTab: false, children: [] },
      { id: "c4", label: "Give", url: "/give", openInNewTab: false, children: [] },
      { id: "c5", label: "Volunteer", url: "/volunteer", openInNewTab: false, children: [] },
      { id: "c6", label: "Submit Announcement", url: "/submit-announcement", openInNewTab: false, children: [] },
      { id: "c7", label: "Prayer Request", url: "/prayer-request", openInNewTab: false, children: [] },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    url: "#",
    openInNewTab: false,
    children: [
      { id: "d1", label: "Sermons", url: "/sermons", openInNewTab: false, children: [] },
      { id: "d2", label: "Events", url: "/events", openInNewTab: false, children: [] },
      { id: "d3", label: "Calendar", url: "/church-calendar", openInNewTab: false, children: [] },
      { id: "d4", label: "Ministries", url: "/ministries", openInNewTab: false, children: [] },
      { id: "d5", label: "Resources", url: "/resources", openInNewTab: false, children: [] },
      { id: "d6", label: "Live Stream", url: "/live", openInNewTab: false, children: [] },
    ],
  },
  {
    id: "about",
    label: "About",
    url: "#",
    openInNewTab: false,
    children: [
      { id: "a1", label: "About Us", url: "/about", openInNewTab: false, children: [] },
      { id: "a2", label: "Our Beliefs", url: "/our-beliefs", openInNewTab: false, children: [] },
      { id: "a3", label: "Our Leaders", url: "/our-leaders", openInNewTab: false, children: [] },
    ],
  },
];
