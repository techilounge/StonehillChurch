import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getCmsDocument } from "@/lib/data/adminCms";
import { CmsModuleForm } from "@/components/admin/cms/CmsModuleForm";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = {
  title: "Edit homepageSlides | Admin",
};

export default async function HomepageSlidesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  const auth = await getCurrentAdminSession(isNew ? "content:create" : "content:update");
  if (!auth.ok) redirect("/admin/login");
  const session = auth.session;

  const canPublish = hasPermission(session, "content:publish");

  let initialData = null;
  if (!isNew) {
    initialData = await getCmsDocument("homepageSlides", id, session);
    if (!initialData) {
      redirect("/admin/homepage-slides");
    }
  }

  return (
    <AdminPageShell title="" description="">
      <CmsModuleForm 
        module="homepageSlides" 
        initialData={initialData} 
        canPublish={canPublish}
      />
    </AdminPageShell>
  );
}
