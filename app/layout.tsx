import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Stonehill Seventh-day Adventist Church",
    template: "%s | Stonehill SDA Church",
  },
  description: "A welcoming Seventh-day Adventist church community.",
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
