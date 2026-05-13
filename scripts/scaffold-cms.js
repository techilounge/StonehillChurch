const fs = require('fs');
const path = require('path');

const modules = [
  "homepageSlides",
  "sermons",
  "events",
  "ministries",
  "leaders",
  "announcements",
  "resources",
  "pages"
];

const kebabCase = (str) => str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);

const generateListPage = (mod) => `import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { listCmsDocuments } from "@/lib/data/adminCms";
import { CmsModuleList } from "@/components/admin/cms/CmsModuleList";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = {
  title: "${mod} | Admin",
};

export default async function ${mod.charAt(0).toUpperCase() + mod.slice(1)}ListPage() {
  const auth = await getCurrentAdminSession("content:read");
  if (!auth.ok) redirect("/admin/login");
  const session = auth.session;

  const canCreate = hasPermission(session, "content:create");
  const canEdit = hasPermission(session, "content:update");
  const canPublish = hasPermission(session, "content:publish");
  const canDelete = hasPermission(session, "content:delete");

  const data = await listCmsDocuments("${mod}", session);

  return (
    <AdminPageShell title="" description="">
      <CmsModuleList 
        module="${mod}" 
        data={data} 
        canCreate={canCreate}
        canEdit={canEdit}
        canPublish={canPublish}
        canDelete={canDelete}
      />
    </AdminPageShell>
  );
}
`;

const generateEditPage = (mod) => `import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getCmsDocument } from "@/lib/data/adminCms";
import { CmsModuleForm } from "@/components/admin/cms/CmsModuleForm";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export const metadata = {
  title: "Edit ${mod} | Admin",
};

export default async function ${mod.charAt(0).toUpperCase() + mod.slice(1)}EditPage({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  const auth = await getCurrentAdminSession(isNew ? "content:create" : "content:update");
  if (!auth.ok) redirect("/admin/login");
  const session = auth.session;

  const canPublish = hasPermission(session, "content:publish");

  let initialData = null;
  if (!isNew) {
    initialData = await getCmsDocument("${mod}", params.id, session);
    if (!initialData) {
      redirect("/admin/${kebabCase(mod)}");
    }
  }

  return (
    <AdminPageShell title="" description="">
      <CmsModuleForm 
        module="${mod}" 
        initialData={initialData} 
        canPublish={canPublish}
      />
    </AdminPageShell>
  );
}
`;

modules.forEach(mod => {
  const folderName = kebabCase(mod);
  const basePath = path.join(__dirname, '..', 'app', 'admin', folderName);
  const idPath = path.join(basePath, '[id]');
  
  fs.mkdirSync(idPath, { recursive: true });
  
  fs.writeFileSync(path.join(basePath, 'page.tsx'), generateListPage(mod));
  fs.writeFileSync(path.join(idPath, 'page.tsx'), generateEditPage(mod));
  
  console.log("Created routes for " + mod);
});
