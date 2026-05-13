import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  adminLoginRedirectPath,
  ADMIN_DEFAULT_PATH,
  isAdminPublicPath,
} from "@/lib/adminRoutes";
import { getCurrentAdminSession } from "@/lib/api/adminSession";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-stonehill-pathname") ?? "";
  const search = requestHeaders.get("x-stonehill-search") ?? "";

  if (pathname && isAdminPublicPath(pathname)) {
    return <>{children}</>;
  }

  const authResult = await getCurrentAdminSession("admin:access");

  if (!authResult.ok) {
    redirect(
      adminLoginRedirectPath(
        pathname ? `${pathname}${search}` : ADMIN_DEFAULT_PATH,
        authResult.reason,
      ),
    );
  }

  return <AdminShell session={authResult.session}>{children}</AdminShell>;
}
