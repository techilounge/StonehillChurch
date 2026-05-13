import { PageHeader } from "@/components/admin/PageHeader";

export default function UsersLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <PageHeader
        title="Users"
        description="Manage admin users, roles, and permission assignments."
      />
      
      <div className="flex justify-end">
        <div className="h-10 w-32 rounded-md bg-stonehill-line" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-24 rounded bg-stonehill-line" />
        </div>
        <div className="overflow-hidden rounded-lg border border-stonehill-line bg-white shadow-sm">
          <div className="h-[45px] bg-stonehill-cream/40 border-b border-stonehill-line" />
          <div className="divide-y divide-stonehill-line">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 h-[65px]">
                <div className="h-4 w-32 rounded bg-stonehill-line" />
                <div className="h-4 w-24 rounded bg-stonehill-line" />
                <div className="h-6 w-16 rounded-full bg-stonehill-line" />
                <div className="h-4 w-24 rounded bg-stonehill-line" />
                <div className="h-4 w-24 rounded bg-stonehill-line" />
                <div className="h-8 w-20 rounded bg-stonehill-line" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-stonehill-line bg-white shadow-sm mt-4">
        <div className="h-[45px] bg-stonehill-cream/40 border-b border-stonehill-line" />
        <div className="divide-y divide-stonehill-line">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 h-[65px]">
              <div className="h-4 w-32 rounded bg-stonehill-line" />
              <div className="h-4 w-40 rounded bg-stonehill-line" />
              <div className="h-8 w-28 rounded bg-stonehill-line" />
              <div className="h-6 w-16 rounded-full bg-stonehill-line" />
              <div className="h-8 w-24 rounded bg-stonehill-line" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
