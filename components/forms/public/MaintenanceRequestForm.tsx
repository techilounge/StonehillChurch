"use client";

import * as React from "react";
import { useState } from "react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { SelectInput } from "@/components/forms/SelectInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusAlert } from "./FormStatusAlert";
import { getAppCheckHeaders } from "@/lib/firebaseClient";

export function MaintenanceRequestForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function action(formData: FormData) {
    setStatus("idle");
    const payload = {
      formType: "maintenance_request",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      location: formData.get("location"),
      issue: formData.get("issue"),
      urgency: formData.get("urgency") || "normal",
      message: "Maintenance request submitted.", // Default required by base schema
      website: formData.get("website") || undefined,
    };

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAppCheckHeaders()) },
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
      setMessage(
        "Your maintenance request has been submitted to the facilities team.",
      );
    } catch (e) {
      setStatus("error");
      setMessage("A network error occurred. Please try again later.");
    }
  }

  if (status === "success") {
    return <FormStatusAlert status="success" message={message} />;
  }

  return (
    <form
      action={action}
      className="space-y-8 "
    >
      <FormStatusAlert status={status} message={message} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      <div className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 border-b border-slate-200 pb-2">
          Reporter Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Full Name *" id="name">
            <TextInput id="name" name="name" required placeholder="Jane Doe" />
          </FormField>

          <FormField label="Email Address *" id="email">
            <TextInput
              id="email"
              name="email"
              type="email"
              required
              placeholder="jane@example.com"
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Phone Number" id="phone" description="Optional">
            <TextInput
              id="phone"
              name="phone"
              type="tel"
              placeholder="(555) 123-4567"
            />
          </FormField>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight text-slate-900 border-b border-slate-200 pb-2">
          Issue Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Location *"
            id="location"
            description="Where is the issue?"
          >
            <TextInput
              id="location"
              name="location"
              required
              placeholder="e.g. Fellowship Hall Women's Restroom"
            />
          </FormField>

          <FormField label="Urgency *" id="urgency">
            <SelectInput
              id="urgency"
              name="urgency"
              required
              defaultValue="normal"
            >
              <option value="low">Low - When possible</option>
              <option value="normal">Normal - Standard maintenance</option>
              <option value="high">High - Needs attention soon</option>
              <option value="urgent">
                Urgent - Safety hazard / Active leak
              </option>
            </SelectInput>
          </FormField>
        </div>

        <FormField
          label="Issue Description *"
          id="issue"
          description="Describe the problem in detail"
        >
          <TextArea
            id="issue"
            name="issue"
            required
            rows={4}
            placeholder="The sink is leaking..."
          />
        </FormField>
      </div>

      <SubmitButton pendingText="Submitting..." className="w-full md:w-auto">
        Submit Request
      </SubmitButton>
    </form>
  );
}
