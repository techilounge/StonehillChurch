import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { listCmsDocuments } from "@/lib/data/adminCms";
import { CmsModuleList } from "@/components/admin/cms/CmsModuleList";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = {
  title: "ministries | Admin",
};

export default async function MinistriesListPage() {
  const auth = await getCurrentAdminSession("content:read");
  if (!auth.ok) redirect("/admin/login");
  const session = auth.session;

  const canCreate = hasPermission(session, "content:create");
  const canEdit = hasPermission(session, "content:update");
  const canPublish = hasPermission(session, "content:publish");
  const canDelete = hasPermission(session, "content:delete");

  const data = await listCmsDocuments("ministries", session);

  return (
    <AdminPageShell title="" description="">
      <CmsModuleList 
        module="ministries" 
        data={data} 
        canCreate={canCreate}
        canEdit={canEdit}
        canPublish={canPublish}
        canDelete={canDelete}
      />
    </AdminPageShell>
  );
}
