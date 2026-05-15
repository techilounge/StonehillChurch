"use client";

import * as React from "react";
import { useState } from "react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusAlert } from "./FormStatusAlert";

export function PlanYourVisitForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function action(formData: FormData) {
    setStatus("idle");
    const payload = {
      formType: "plan_your_visit",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      visitDate: formData.get("visitDate"),
      numberOfAdults: parseInt(formData.get("numberOfAdults") as string) || 1,
      numberOfChildren: parseInt(formData.get("numberOfChildren") as string) || 0,
      message: formData.get("message") || undefined,
      website: formData.get("website") || undefined,
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
      setMessage(
        "Thank you! We've received your visit plan and look forward to meeting you soon!",
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
    <form action={action} className="space-y-6">
      <FormStatusAlert status={status} message={message} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

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

        <FormField label="When are you visiting? *" id="visitDate" description="e.g. This Saturday">
          <TextInput
            id="visitDate"
            name="visitDate"
            required
            placeholder="Saturday, June 1st"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Number of Adults *" id="numberOfAdults">
          <TextInput
            id="numberOfAdults"
            name="numberOfAdults"
            type="number"
            min={1}
            max={100}
            defaultValue={1}
            required
          />
        </FormField>

        <FormField label="Number of Children" id="numberOfChildren">
          <TextInput
            id="numberOfChildren"
            name="numberOfChildren"
            type="number"
            min={0}
            max={100}
            defaultValue={0}
          />
        </FormField>
      </div>

      <FormField label="Any questions or special needs?" id="message" description="Optional">
        <TextArea
          id="message"
          name="message"
          rows={3}
          placeholder="Let us know how we can make your visit better..."
        />
      </FormField>

      <SubmitButton pendingText="Submitting..." className="w-full">
        Plan My Visit
      </SubmitButton>
    </form>
  );
}
