import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { listCmsDocuments } from "@/lib/data/adminCms";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { SettingsEditor } from "./SettingsEditor";

export const metadata = {
  title: "Site Settings | Admin",
};

export default async function SettingsAdminPage() {
  const auth = await getCurrentAdminSession("settings:manage");
  if (!auth.ok) redirect("/admin/login");
  const session = auth.session;

  const canEdit = hasPermission(session, "settings:manage");
  
  // Fetch existing settings
  const data = await listCmsDocuments("siteSettings", session);

  return (
    <AdminPageShell 
      title="Site Settings" 
      description="Manage church-wide configurations such as contact info, service times, and social links."
    >
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <SettingsEditor initialSettings={data} canEdit={canEdit} />
      </div>
    </AdminPageShell>
  );
}
