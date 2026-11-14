"use client";

import * as React from "react";
import { useState } from "react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { RadioField } from "@/components/forms/RadioField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusAlert } from "./FormStatusAlert";
import { getAppCheckHeaders } from "@/lib/firebaseClient";

export function PrayerRequestForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function action(formData: FormData) {
    setStatus("idle");
    const privacy = formData.get("privacy");
    const payload = {
      formType: "prayer_request",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      subject: formData.get("subject") || undefined,
      message: formData.get("message"),
      shareWithPrayerTeam: privacy === "share",
      confidential: privacy === "confidential",
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
        "Your prayer request has been submitted. We will keep you in our prayers.",
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
      className="space-y-6"
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
            placeholder="General prayer, health, etc."
          />
        </FormField>
      </div>

      <FormField label="Prayer Request *" id="message">
        <TextArea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="How can we pray for you?"
        />
      </FormField>

      <FormField label="Privacy Settings" id="privacy">
        <div className="space-y-4 mt-2">
          <RadioField
            id="privacy-share"
            name="privacy"
            value="share"
            label="Share with Prayer Team"
            description="Allow our dedicated prayer team to see and pray for this request."
            defaultChecked
          />
          <RadioField
            id="privacy-confidential"
            name="privacy"
            value="confidential"
            label="Keep Confidential"
            description="Only the pastoral staff will see this request."
          />
        </div>
      </FormField>

      <SubmitButton pendingText="Submitting..." className="w-full md:w-auto">
        Submit Prayer Request
      </SubmitButton>
    </form>
  );
}
