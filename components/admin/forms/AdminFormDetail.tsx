"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/forms/FormField";
import { SelectInput } from "@/components/forms/SelectInput";
import { TextArea } from "@/components/forms/TextArea";
import { TextInput } from "@/components/forms/TextInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusAlert } from "@/components/forms/public/FormStatusAlert";
import type { FormSubmission } from "@/types/forms";

type AdminFormSubmission = Omit<FormSubmission, "createdAt" | "updatedAt" | "statusUpdatedAt"> & {
  id: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  statusUpdatedAt?: FormSubmission["statusUpdatedAt"];
};

export function AdminFormDetail({ submission }: { submission: AdminFormSubmission }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const payloadEntries = Object.entries(submission.payloadJson || {}).filter(
    ([key]) => !["formType", "name", "email", "phone", "subject", "message"].includes(key)
  );

  async function updateStatus(formData: FormData) {
    setStatus("idle");
    const payload = {
      status: formData.get("status"),
      assignedTo: formData.get("assignedTo") || null,
      internalNotes: formData.get("internalNotes"),
    };

    try {
      const res = await fetch(`/api/forms/${submission.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error?.message || "Failed to update status.");
        setStatus("error");
        return;
      }
      
      setStatus("success");
      setMessage("Status updated successfully.");
      router.refresh(); // Refresh the server component to show updated data
    } catch (e) {
      setStatus("error");
      setMessage("A network error occurred.");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-6 border-b border-slate-200/50 pb-2">
            Submission Details
          </h2>
          
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
            <div>
              <dt className="text-sm font-medium text-slate-900/65">Name</dt>
              <dd className="mt-1 text-slate-900 font-medium">{submission.name}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-slate-900/65">Email</dt>
              <dd className="mt-1 text-slate-900">{submission.email || "-"}</dd>
            </div>
            
            <div>
              <dt className="text-sm font-medium text-slate-900/65">Phone</dt>
              <dd className="mt-1 text-slate-900">{submission.phone || "-"}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-slate-900/65">Subject</dt>
              <dd className="mt-1 text-slate-900">{submission.subject || "-"}</dd>
            </div>
          </dl>

          <div className="mt-6 border-t border-slate-200/50 pt-6">
            <h3 className="text-sm font-medium text-slate-900/65 mb-2">Message</h3>
            <div className="bg-slate-50 p-4 rounded-lg whitespace-pre-wrap text-slate-900/90 text-sm">
              {submission.message}
            </div>
          </div>

          {payloadEntries.length > 0 && (
            <div className="mt-6 border-t border-slate-200/50 pt-6">
              <h3 className="text-sm font-medium text-slate-900/65 mb-4">Additional Data</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                {payloadEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-slate-900/65 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</dt>
                    <dd className="mt-1 text-slate-900">
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <form action={updateStatus} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 mb-4 border-b border-slate-200/50 pb-2">
            Admin Actions
          </h2>
          
          <FormStatusAlert status={status} message={message} className="mb-6 p-3 text-sm" />

          <div className="space-y-6">
            <FormField label="Status" id="status">
              <SelectInput id="status" name="status" defaultValue={submission.status}>
                <option value="new">New</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </SelectInput>
            </FormField>

            <FormField label="Assigned To" id="assignedTo" description="Optional staff or admin name/email">
              <TextInput
                id="assignedTo"
                name="assignedTo"
                defaultValue={submission.assignedTo || ""}
                placeholder="office@stonehillsda.org"
              />
            </FormField>

            <FormField label="Internal Notes" id="internalNotes" description="Not visible to submitter">
              <TextArea 
                id="internalNotes" 
                name="internalNotes" 
                defaultValue={submission.internalNotes || ""} 
                rows={4} 
              />
            </FormField>

            <SubmitButton pendingText="Saving..." className="w-full">
              Save Changes
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
