import React from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { adminLoginRedirectPath } from "@/lib/adminRoutes";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { getFormSubmissionById } from "@/lib/data/formSubmissions";
import { AdminFormDetail } from "@/components/admin/forms/AdminFormDetail";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

function formatFormType(type: string) {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatSubmittedDate(value: string | Date | null | undefined) {
  if (!value) {
    return "an unknown date";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "an unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminFormDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const authResult = await getCurrentAdminSession("forms:manage");

  if (!authResult.ok) {
    redirect(adminLoginRedirectPath(`/admin/forms/${id}`, authResult.reason));
  }

  const submission = await getFormSubmissionById(id);

  if (!submission) {
    notFound();
  }

  const formTypeDisplay = formatFormType(submission.formType);
  const submittedDate = formatSubmittedDate(submission.createdAt);

  return (
    <AdminPageShell
      title={`${formTypeDisplay} Submission`}
      description={`Submitted on ${submittedDate}`}
    >
      <div className="mb-6">
        <Link 
          href="/admin/forms" 
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to all submissions
        </Link>
      </div>

      <AdminFormDetail submission={submission} />
    </AdminPageShell>
  );
}
