import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getCmsDocument } from "@/lib/data/adminCms";
import { PageBuilderShell } from "@/components/admin/page-builder/PageBuilderShell";
import { getSpacingTokens } from "@/lib/data/siteSettings";

export const metadata = {
  title: "Edit ministries | Admin",
};

export default async function MinistriesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const auth = await getCurrentAdminSession(isNew ? "content:create" : "content:update");
  if (!auth.ok) redirect("/admin/login");
  const session = auth.session;

  const canPublish = hasPermission(session, "content:publish");

  let initialData: any = null;
  if (!isNew) {
    initialData = await getCmsDocument("ministries", id, session);
    if (!initialData) {
      redirect("/admin/ministries");
    }
  }

  const spacingTokens = await getSpacingTokens();

  return (
    <div className="min-h-screen bg-slate-50">
      <PageBuilderShell
        initialData={initialData}
        canPublish={canPublish}
        spacingTokens={spacingTokens}
        module="ministries"
        role={session.role}
      />
    </div>
  );
}
