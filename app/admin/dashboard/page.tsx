import { PageHeader } from "@/components/admin/PageHeader";
import { AdminStatCard } from "@/components/admin/shared/AdminStatCard";
import { Button } from "@/components/shared/Button";
import { getDashboardMetrics } from "@/lib/data/dashboardMetrics";
import { getRecentAuditEntries } from "@/lib/data/auditLogs";
import Link from "next/link";
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

function formatMetric(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("en-US");
}

export default async function AdminDashboardPage() {
  const [metrics, recentActivity] = await Promise.all([
    getDashboardMetrics(),
    getRecentAuditEntries(10),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Welcome back. Here is what's happening at Stonehill."
      >
        <Link href="/" target="_blank" rel="noopener noreferrer">
          <Button variant="outline">View Site</Button>
        </Link>
        <Link href="/admin/announcements/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Announcement
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AdminStatCard
          title="Published Sermons"
          value={formatMetric(metrics.sermonsPublished)}
          icon={Mic2}
        />
        <AdminStatCard
          title="Upcoming Events"
          value={formatMetric(metrics.eventsUpcoming)}
          icon={CalendarDays}
        />
        <AdminStatCard
          title="Active Ministries"
          value={formatMetric(metrics.ministriesActive)}
          icon={Users}
        />
        <AdminStatCard
          title="Pending Forms"
          value={formatMetric(metrics.formSubmissionsPending)}
          icon={ClipboardList}
        />
        <AdminStatCard
          title="Active Announcements"
          value={formatMetric(metrics.announcementsActive)}
          icon={Megaphone}
        />
        <AdminStatCard
          title="Media Assets"
          value={formatMetric(metrics.mediaAssetsTotal)}
          icon={FolderOpen}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Quick Actions */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
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
                className="group flex items-center justify-between rounded-lg border border-slate-200 p-4 hover:border-stonehill-accent/50 hover:bg-slate-50/50 motion-safe:transition-all"
              >
                <span className="font-medium text-slate-900 group-hover:text-stonehill-primary">
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-900/40 group-hover:text-stonehill-accent motion-safe:transition-colors" />
              </a>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <div className="mt-6 space-y-6">
            {recentActivity.length === 0 ? (
              <div className="flex justify-center py-8">
                <p className="text-sm text-slate-900/60">No recent activity.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {recentActivity.map((entry) => (
                  <li key={entry.id} className="flex flex-col gap-1 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm text-slate-900 font-medium">
                      {entry.actorEmail} <span className="font-normal text-slate-600">{entry.action}</span> {entry.targetName || entry.targetId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(entry.createdAt as string).toLocaleString()} &middot; {entry.targetType}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
