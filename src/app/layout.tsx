import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stonehill Seventh-day Adventist Church",
  description: "Temporary Phase 1 foundation for the Stonehill SDA Church website.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen overflow-x-hidden bg-bg-warm font-body text-text-dark antialiased">
        {children}
      </body>
    </html>
  );
}
