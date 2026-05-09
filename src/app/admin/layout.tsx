import type { ReactNode } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-bg-cream">
      <aside className="hidden w-64 flex-shrink-0 flex-col bg-primary-dark text-white md:flex">
        <div className="flex h-16 items-center justify-center border-b border-white/10">
          <span className="font-heading font-semibold">Admin Console</span>
        </div>
        <nav className="flex-1 p-4">
          <p className="mb-2 text-sm text-white/60">[PHASE 1 SIDEBAR SHELL]</p>
          <ul className="space-y-2">
            <li className="rounded-card bg-white/10 p-2">Dashboard</li>
            <li className="rounded-card p-2">Content</li>
            <li className="rounded-card p-2">Settings</li>
          </ul>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 flex-shrink-0 items-center justify-between bg-white px-4 shadow-sm sm:px-6">
          <div className="font-heading font-semibold text-primary md:hidden">Admin</div>
          <div className="ml-auto text-sm text-text-muted">[PHASE 1 TOPBAR SHELL]</div>
        </header>

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

