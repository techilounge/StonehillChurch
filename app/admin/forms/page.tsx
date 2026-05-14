import React from "react";
import Link from "next/link";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { adminLoginRedirectPath } from "@/lib/adminRoutes";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { listFormSubmissions } from "@/lib/data/formSubmissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "in_review":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "completed":
      return "bg-green-100 text-green-800 border border-green-200";
    case "archived":
      return "bg-gray-100 text-gray-800 border border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
}

function formatFormType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatSubmissionDate(value: string | Date | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function AdminFormsPage() {
  const authResult = await getCurrentAdminSession("forms:manage");

  if (!authResult.ok) {
    redirect(adminLoginRedirectPath("/admin/forms", authResult.reason));
  }

  const submissions = await listFormSubmissions();

  return (
    <AdminPageShell
      title="Form Submissions"
      description="Review and manage submissions from public forms."
    >
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-900/80">
              <tr>
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Type</th>
                <th className="px-6 py-4 font-semibold">Submitter</th>
                <th className="px-6 py-4 font-semibold">Subject</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/50">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-900/65">
                    No form submissions found.
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-900/80">
                      {formatSubmissionDate(submission.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                      {formatFormType(submission.formType)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{submission.name}</div>
                      {submission.email && (
                        <div className="text-slate-900/65 text-xs mt-0.5">{submission.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-900/80 max-w-[200px] truncate">
                      {submission.subject || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(submission.status)}`}>
                        {formatFormType(submission.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/admin/forms/${submission.id}`}
                        className="text-stonehill-dark hover:text-stonehill-dark/80 font-medium transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPageShell>
  );
}
