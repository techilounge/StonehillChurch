"use client";

import * as React from "react";
import { useState } from "react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusAlert } from "./FormStatusAlert";

const VOLUNTEER_AREAS = [
  "Children's Ministry",
  "Youth Ministry",
  "Worship Team",
  "Tech/A-V",
  "Greeting & Hospitality",
  "Community Service",
  "Prayer Ministry",
  "Other",
];

export function VolunteerForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function action(formData: FormData) {
    setStatus("idle");
    const payload = {
      formType: "volunteer",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      subject: formData.get("subject") || undefined,
      areas: formData.getAll("areas"),
      availability: formData.get("availability") || undefined,
      message: formData.get("message"),
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
        "Thank you for your willingness to serve! A ministry leader will contact you soon.",
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
      className="space-y-8"
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
        <h3 className="text-xl font-bold tracking-tight text-stonehill-ink border-b border-stonehill-line pb-2">
          Personal Information
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

          <FormField label="Subject" id="subject" description="Optional">
            <TextInput
              id="subject"
              name="subject"
              placeholder="General Volunteer Inquiry"
            />
          </FormField>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight text-stonehill-ink border-b border-stonehill-line pb-2">
          Service Areas
        </h3>
        <FormField
          label="Areas of Interest"
          id="areas"
          description="Select all that apply"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            {VOLUNTEER_AREAS.map((area) => (
              <CheckboxField
                key={area}
                id={`area-${area}`}
                name="areas"
                value={area}
                label={area}
              />
            ))}
          </div>
        </FormField>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold tracking-tight text-stonehill-ink border-b border-stonehill-line pb-2">
          Details
        </h3>
        <FormField
          label="Availability"
          id="availability"
          description="When are you generally available? (e.g., Saturday mornings, Wednesday evenings)"
        >
          <TextArea
            id="availability"
            name="availability"
            rows={3}
            placeholder="I am available on..."
          />
        </FormField>

        <FormField
          label="Message *"
          id="message"
          description="Tell us a bit about your experience or why you want to serve."
        >
          <TextArea
            id="message"
            name="message"
            required
            rows={4}
            placeholder="I have experience with..."
          />
        </FormField>
      </div>

      <SubmitButton pendingText="Submitting..." className="w-full md:w-auto">
        Submit Volunteer Form
      </SubmitButton>
    </form>
  );
}
