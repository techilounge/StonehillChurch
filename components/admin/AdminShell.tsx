"use client";

import { useState, type ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import type { AdminSession } from "@/lib/auth";

export function AdminShell({
  session,
  children,
}: {
  session: AdminSession;
  children: ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminAuthProvider session={session}>
      <div className="min-h-screen bg-[#f4f6f4]">
        <AdminMobileNav
          session={session}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <AdminSidebar session={session} />

        <div className="flex min-h-screen flex-col md:pl-72">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            borderRadius: "8px",
            background: "#1a2e1a",
            color: "#f7f1e5",
            fontSize: "0.875rem",
          },
          success: {
            iconTheme: { primary: "#c5a355", secondary: "#1a2e1a" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#1a2e1a" },
          },
        }}
      />
    </AdminAuthProvider>
  );
}
