import { PageHeader } from "@/components/admin/PageHeader";
import { AdminStatCard } from "@/components/admin/shared/AdminStatCard";
import { Button } from "@/components/shared/Button";
import {
  Mic2,
  CalendarDays,
  Users,
  ClipboardList,
  Megaphone,
  FolderOpen,
  Plus,
  ArrowRight,
} from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader 
        title="Dashboard" 
        description="Welcome back. Here is what's happening at Stonehill."
      >
        <Button variant="outline">View Site</Button>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Announcement
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Total Sermons"
          value="142"
          icon={Mic2}
          trend={{ value: 2, label: "from last month", isPositive: true }}
        />
        <AdminStatCard
          title="Upcoming Events"
          value="8"
          icon={CalendarDays}
        />
        <AdminStatCard
          title="Active Ministries"
          value="12"
          icon={Users}
        />
        <AdminStatCard
          title="Pending Forms"
          value="5"
          icon={ClipboardList}
          trend={{ value: 14, label: "increase", isPositive: false }}
        />
        <AdminStatCard
          title="Active Announcements"
          value="3"
          icon={Megaphone}
        />
        <AdminStatCard
          title="Media Assets"
          value="481"
          icon={FolderOpen}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Quick Actions */}
        <section className="rounded-lg border border-stonehill-line bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stonehill-ink">Quick Actions</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { label: "Upload Sermon", href: "/admin/sermons/new" },
              { label: "Create Event", href: "/admin/events/new" },
              { label: "Add Homepage Slide", href: "/admin/homepage-slides/new" },
              { label: "Upload Media", href: "/admin/media" },
              { label: "View Submissions", href: "/admin/forms" },
              { label: "Configure YouTube", href: "/admin/youtube" },
            ].map((action) => (
              <a
                key={action.label}
                href={action.href}
                className="group flex items-center justify-between rounded-lg border border-stonehill-line p-4 hover:border-stonehill-evergreen hover:bg-stonehill-cream/50 transition-all"
              >
                <span className="font-medium text-stonehill-ink group-hover:text-stonehill-evergreen">
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4 text-stonehill-ink/40 group-hover:text-stonehill-evergreen" />
              </a>
            ))}
          </div>
        </section>

        {/* Recent Activity Placeholder */}
        <section className="rounded-lg border border-stonehill-line bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-stonehill-ink">Recent Activity</h2>
          <div className="mt-6 space-y-6">
            <div className="flex justify-center py-8">
              <p className="text-sm text-stonehill-ink/60">Activity feed will be connected to Firestore audit logs.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
