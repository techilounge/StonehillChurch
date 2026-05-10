"use client";

import * as React from "react";
import { useState } from "react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusAlert } from "./FormStatusAlert";

export function AnnouncementRequestForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function action(formData: FormData) {
    setStatus("idle");
    const payload = {
      formType: "announcement_request",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      announcementTitle: formData.get("announcementTitle"),
      announcementBody: formData.get("announcementBody"),
      requestedStartDate: formData.get("requestedStartDate") || undefined,
      requestedEndDate: formData.get("requestedEndDate") || undefined,
      message: "Announcement request submitted.", // Default required by base schema
    };

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        let errorMsg = data.error?.message || "An error occurred.";
        if (data.error?.fieldErrors) {
          const firstField = Object.keys(data.error.fieldErrors)[0];
          errorMsg = `${errorMsg} (${firstField}: ${data.error.fieldErrors[firstField][0]})`;
        }
        setMessage(errorMsg);
        setStatus("error");
        return;
      }
      setStatus("success");
      setMessage("Your announcement request has been submitted for review.");
    } catch (e) {
      setStatus("error");
      setMessage("A network error occurred. Please try again later.");
    }
  }

  if (status === "success") {
    return <FormStatusAlert status="success" message={message} />;
  }

  return (
    <form action={action} className="space-y-8 bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-stone-100">
      <FormStatusAlert status={status} message={message} />
      
      <div className="space-y-6">
        <h3 className="text-xl font-bold font-serif text-stone-900 border-b border-stone-100 pb-2">Your Contact Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Full Name *" id="name">
            <TextInput id="name" name="name" required placeholder="Jane Doe" />
          </FormField>
          
          <FormField label="Email Address *" id="email">
            <TextInput id="email" name="email" type="email" required placeholder="jane@example.com" />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Phone Number" id="phone" description="Optional">
            <TextInput id="phone" name="phone" type="tel" placeholder="(555) 123-4567" />
          </FormField>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold font-serif text-stone-900 border-b border-stone-100 pb-2">Announcement Details</h3>
        <FormField label="Announcement Title *" id="announcementTitle" description="A short, catchy title">
          <TextInput id="announcementTitle" name="announcementTitle" required placeholder="VBS Registration Now Open" />
        </FormField>
        
        <FormField label="Announcement Body *" id="announcementBody" description="The full text of the announcement">
          <TextArea id="announcementBody" name="announcementBody" required rows={5} placeholder="Please provide all necessary details..." />
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Requested Start Date" id="requestedStartDate" description="When should we start announcing this?">
            <TextInput id="requestedStartDate" name="requestedStartDate" type="date" />
          </FormField>
          
          <FormField label="Requested End Date" id="requestedEndDate" description="When should we stop announcing this?">
            <TextInput id="requestedEndDate" name="requestedEndDate" type="date" />
          </FormField>
        </div>
      </div>

      <SubmitButton pendingText="Submitting..." className="w-full md:w-auto">
        Submit Announcement Request
      </SubmitButton>
    </form>
  );
}
