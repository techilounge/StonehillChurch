import type { Metadata, Viewport } from "next";
import { Yeseva_One, Reenie_Beanie, Roboto } from "next/font/google";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_NAME,
  DEFAULT_SITE_URL,
  normalizeSiteUrl,
} from "@/lib/seo";
import "./globals.css";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const yesevaOne = Yeseva_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const reenieBeanie = Reenie_Beanie({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-handwritten",
});

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
  themeColor: "#1e3f66",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${roboto.variable} ${yesevaOne.variable} ${reenieBeanie.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
