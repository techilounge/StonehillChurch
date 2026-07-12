import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getCmsDocument } from "@/lib/data/adminCms";
import { PageBuilderShell } from "@/components/admin/page-builder/PageBuilderShell";
import { PageContent } from "@/types/content";
import { getSpacingTokens } from "@/lib/data/siteSettings";

export const metadata = {
  title: "Edit pages | Admin",
};

export default async function PagesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const auth = await getCurrentAdminSession(isNew ? "content:create" : "content:update");
  if (!auth.ok) redirect("/admin/login");
  const session = auth.session;

  const canPublish = hasPermission(session, "content:publish");

  let initialData: (PageContent & { id?: string }) | null = null;
  if (!isNew) {
    initialData = await getCmsDocument("pages", id, session) as (PageContent & { id: string });
    if (!initialData) {
      redirect("/admin/pages");
    }
  }

  const spacingTokens = await getSpacingTokens();

  return (
    <div className="min-h-screen bg-slate-50">
      <PageBuilderShell
        initialData={initialData}
        canPublish={canPublish}
        spacingTokens={spacingTokens}
        module="pages"
        role={session.role}
      />
    </div>
  );
}
