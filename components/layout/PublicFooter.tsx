import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/types/menus";
import { DEFAULT_FOOTER_MENU } from "@/lib/constants/defaultMenus";

type PublicFooterProps = {
  settings?: Record<string, unknown>;
  footerMenu?: MenuItem[];
};

const footerLinkClassName =
  "rounded-sm transition-colors hover:text-stonehill-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2";

function settingString(settings: Record<string, unknown> | undefined, key: string): string {
  const value = settings?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function externalLinkProps(href: string) {
  return href.startsWith("http")
    ? { target: "_blank", rel: "noopener noreferrer" }
    : {};
}

/** Hardcoded fallback footer columns used when no dynamic menu data is available. */
const defaultFooterColumns: MenuItem[] = DEFAULT_FOOTER_MENU;

function FooterLink({ item }: { item: MenuItem }) {
  const isExternal = item.url.startsWith("http://") || item.url.startsWith("https://");

  if (item.openInNewTab || isExternal) {
    return (
      <li>
        <a
          href={item.url}
          className={footerLinkClassName}
          {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : externalLinkProps(item.url))}
        >
          {item.label}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link href={item.url} className={footerLinkClassName}>
        {item.label}
      </Link>
    </li>
  );
}

export function PublicFooter({ settings, footerMenu }: PublicFooterProps) {
  const churchName =
    settingString(settings, "general.churchName") || "Stonehill Seventh-day Adventist Church";
  const tagline =
    settingString(settings, "general.tagline") ||
    "A community of believers sharing the love of Jesus and preparing for His soon return.";
  const address = settingString(settings, "contact.address");
  const email = settingString(settings, "contact.email");
  const phone = settingString(settings, "contact.phone");
  const socialLinks = [
    { label: "Facebook", href: settingString(settings, "social.facebook"), icon: Facebook },
    { label: "Instagram", href: settingString(settings, "social.instagram"), icon: Instagram },
    { label: "YouTube", href: settingString(settings, "social.youtube"), icon: Youtube },
  ].filter((item) => item.href);

  const logoUrl = settingString(settings, "general.logo_url");

  // Use dynamic menu data if available, otherwise fall back to hardcoded columns
  const menuColumns = footerMenu && footerMenu.length > 0 ? footerMenu : defaultFooterColumns;

  // Determine if we have contact info for a contact column
  const hasContactInfo = Boolean(address || email || phone);

  return (
    <footer className="border-t border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-stonehill-primary mb-4 block">{churchName}</span>
            <p className="text-sm text-slate-500 max-w-xs mb-6">
              {tagline}
            </p>
            {logoUrl && (
              <div className="relative h-16 w-32 mb-6">
                <Image
                  src={logoUrl}
                  alt={`${churchName} Logo`}
                  fill
                  className="object-contain object-left"
                />
              </div>
            )}
            {socialLinks.length > 0 && (
              <div className="flex space-x-4">
                {socialLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-label={item.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-900 transition-colors hover:bg-stonehill-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
                    {...externalLinkProps(item.href)}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className={cn(
            "grid grid-cols-1 gap-8 lg:col-span-2",
            `sm:grid-cols-2 md:grid-cols-${Math.min(menuColumns.length + (hasContactInfo ? 1 : 0), 4)}`,
          )}>
            {/* Dynamic menu columns */}
            {menuColumns.map((column) => (
              <div key={column.id}>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">{column.label}</h3>
                {column.children.length > 0 && (
                  <ul className="mt-6 space-y-4 text-sm text-slate-500">
                    {column.children.map((child) => (
                      <FooterLink key={child.id} item={child} />
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Contact column — always auto-generated from site settings */}
            {hasContactInfo && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Contact</h3>
                <ul className="mt-6 space-y-4 text-sm text-slate-500">
                  {address && <li className="max-w-xs">{address}</li>}
                  {email && (
                    <li>
                      <a href={`mailto:${email}`} className={footerLinkClassName}>{email}</a>
                    </li>
                  )}
                  {phone && (
                    <li>
                      <a href={`tel:${phone.replace(/[^0-9+]/g, "")}`} className={footerLinkClassName}>{phone}</a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="mt-16 flex flex-col items-center justify-between border-t border-slate-200 pt-8 sm:flex-row">
          <p className="text-xs leading-5 text-slate-500">
            &copy; {new Date().getFullYear()} Stonehill Seventh-day Adventist Church. All rights reserved.
          </p>
          <div className="mt-4 flex space-x-6 sm:mt-0 text-xs text-slate-500">
            <Link href="/admin/dashboard" className={cn(footerLinkClassName, "px-1")}>Admin Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
