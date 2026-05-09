import type { ReactNode } from "react";

export default function PublicLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="w-full bg-primary p-4 text-center text-white">
        <div className="container-content">
          <p className="text-lg font-semibold">Stonehill SDA Church - [PHASE 1 PUBLIC HEADER SHELL]</p>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-auto w-full bg-primary-dark p-6 text-center text-white">
        <div className="container-content">
          <p className="text-sm">
            Copyright {new Date().getFullYear()} Stonehill SDA Church - [PHASE 1 PUBLIC FOOTER SHELL]
          </p>
        </div>
      </footer>
    </div>
  );
}

