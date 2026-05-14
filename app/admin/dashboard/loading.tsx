import { PageHeader } from "@/components/admin/PageHeader";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here is what's happening at Stonehill."
      >
        <div className="h-10 w-24 rounded-md bg-slate-200" />
        <div className="h-10 w-40 rounded-md bg-slate-200" />
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-24 rounded bg-slate-200" />
                  <div className="h-8 w-16 rounded bg-slate-200" />
                </div>
                <div className="ml-4 h-12 w-12 rounded-xl bg-slate-50" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-32 rounded bg-slate-200 mb-6" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div className="h-5 w-24 rounded bg-slate-200" />
                <div className="h-4 w-4 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-6 w-32 rounded bg-slate-200 mb-6" />
          <div className="flex justify-center py-8">
            <div className="h-4 w-64 rounded bg-slate-200" />
          </div>
        </section>
      </div>
    </div>
  );
}
