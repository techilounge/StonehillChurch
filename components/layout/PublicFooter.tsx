import Link from "next/link";
import { Facebook, Instagram, Youtube } from "lucide-react";
import { cn } from "@/lib/utils";

type PublicFooterProps = {
  settings?: Record<string, unknown>;
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

export function PublicFooter({ settings }: PublicFooterProps) {
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

  return (
    <footer className="border-t border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-stonehill-primary">{churchName}</span>
            <p className="mt-4 text-sm text-slate-500 max-w-xs">
              {tagline}
            </p>
            {socialLinks.length > 0 && (
              <div className="mt-8 flex space-x-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 lg:col-span-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Connect</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-500">
                <li><Link href="/im-new" className={footerLinkClassName}>I&apos;m New</Link></li>
                <li><Link href="/plan-your-visit" className={footerLinkClassName}>Plan Your Visit</Link></li>
                <li><Link href="/contact" className={footerLinkClassName}>Contact</Link></li>
                <li><Link href="/give" className={footerLinkClassName}>Give</Link></li>
                <li><Link href="/volunteer" className={footerLinkClassName}>Volunteer</Link></li>
                <li><Link href="/submit-announcement" className={footerLinkClassName}>Submit Announcement</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Discover</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-500">
                <li><Link href="/sermons" className={footerLinkClassName}>Sermons</Link></li>
                <li><Link href="/events" className={footerLinkClassName}>Events</Link></li>
                <li><Link href="/church-calendar" className={footerLinkClassName}>Calendar</Link></li>
                <li><Link href="/ministries" className={footerLinkClassName}>Ministries</Link></li>
                <li><Link href="/resources" className={footerLinkClassName}>Resources</Link></li>
                <li><Link href="/live" className={footerLinkClassName}>Live Stream</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">About</h3>
              <ul className="mt-6 space-y-4 text-sm text-slate-500">
                <li><Link href="/about" className={footerLinkClassName}>About Us</Link></li>
                <li><Link href="/our-beliefs" className={footerLinkClassName}>Our Beliefs</Link></li>
                <li><Link href="/our-leaders" className={footerLinkClassName}>Our Leaders</Link></li>
              </ul>
            </div>
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

