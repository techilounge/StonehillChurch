import { AdminPageShell } from "@/components/admin/AdminPageShell";

export default function MediaLoading() {
  return (
    <AdminPageShell title="Media" description="Manage Firebase Storage uploads and reusable media assets.">
      <div className="flex flex-col gap-8 animate-pulse">
        {/* Upload Panel Skeleton */}
        <section>
          <div className="border border-stonehill-line shadow-sm rounded-2xl overflow-hidden bg-white">
            <div className="p-6">
              <div className="h-6 w-40 bg-stonehill-line rounded mb-4" />
              <div className="space-y-6">
                <div className="h-32 border-2 border-dashed border-stonehill-line rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-stonehill-line rounded" />
                  <div className="h-10 w-full bg-stonehill-line rounded-md" />
                </div>
                <div className="flex justify-end pt-2">
                  <div className="h-10 w-32 bg-stonehill-line rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Media Grid Skeleton */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="h-7 w-32 bg-stonehill-line rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-stonehill-line bg-white shadow-sm">
                <div className="aspect-video bg-stonehill-line" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-4 w-3/4 bg-stonehill-line rounded" />
                  <div className="h-3 w-1/4 bg-stonehill-line rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminPageShell>
  );
}
