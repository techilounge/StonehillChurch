import { PageHeader } from "@/components/admin/PageHeader";

export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <PageHeader
        title="Users"
        description="Manage admin users, roles, and permission assignments."
      />
      
      <div className="flex justify-end">
        <div className="h-10 w-32 rounded-md bg-slate-200" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 rounded bg-slate-200" />
        </div>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="h-[45px] bg-slate-50/40 border-b border-slate-200" />
          <div className="divide-y divide-slate-200">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 h-[65px]">
                <div className="h-4 w-32 rounded bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-6 w-16 rounded-full bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-8 w-20 rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm mt-4">
        <div className="h-[45px] bg-slate-50/40 border-b border-slate-200" />
        <div className="divide-y divide-slate-200">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 h-[65px]">
              <div className="h-4 w-32 rounded bg-slate-200" />
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="h-8 w-28 rounded bg-slate-200" />
              <div className="h-6 w-16 rounded-full bg-slate-200" />
              <div className="h-8 w-24 rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
