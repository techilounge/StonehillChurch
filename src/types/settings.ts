import type { AuditedFields } from "./shared";

export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  youtube?: string;
};

export type SiteSettings = AuditedFields & {
  churchName: string;
  address: string;
  phone: string;
  email: string;
  socialLinks: SocialLinks;
  givingUrl: string;
};

export type YoutubeSettings = AuditedFields & {
  channelId: string;
  liveStreamEnabled: boolean;
  featuredPlaylistId: string | null;
};

export type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

export type AdminNavItem = {
  label: string;
  href: string;
  icon: string;
};
