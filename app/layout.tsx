import type { Metadata, Viewport } from "next";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_URL,
  normalizeSiteUrl,
} from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: DEFAULT_SITE_NAME,
    template: "%s | Stonehill SDA Church",
  },
  description: DEFAULT_SITE_DESCRIPTION,
  metadataBase: new URL(normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL)),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: DEFAULT_SITE_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
    url: "/",
    siteName: DEFAULT_SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: DEFAULT_SITE_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#163b33",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
