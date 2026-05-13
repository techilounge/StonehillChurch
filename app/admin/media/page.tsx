import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { MediaManager } from "@/components/admin/media/MediaManager";

export default function MediaAdminPage() {
  return (
    <AdminPageShell title="Media" description="Manage Firebase Storage uploads and reusable media assets.">
      <MediaManager />
    </AdminPageShell>
  );
}
