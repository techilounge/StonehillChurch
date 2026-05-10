"use client";

import * as React from "react";
import { useState } from "react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusAlert } from "./FormStatusAlert";

export function PrayerRequestForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function action(formData: FormData) {
    setStatus("idle");
    const payload = {
      formType: "prayer_request",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      subject: formData.get("subject") || undefined,
      message: formData.get("message"),
      shareWithPrayerTeam: formData.get("shareWithPrayerTeam") === "on",
      confidential: formData.get("confidential") === "on",
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
      setMessage("Your prayer request has been submitted. We will keep you in our prayers.");
    } catch (e) {
      setStatus("error");
      setMessage("A network error occurred. Please try again later.");
    }
  }

  if (status === "success") {
    return <FormStatusAlert status="success" message={message} />;
  }

  return (
    <form action={action} className="space-y-6 bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-stone-100">
      <FormStatusAlert status={status} message={message} />
      
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
        
        <FormField label="Subject" id="subject" description="Optional">
          <TextInput id="subject" name="subject" placeholder="General prayer, health, etc." />
        </FormField>
      </div>

      <FormField label="Prayer Request *" id="message">
        <TextArea id="message" name="message" required rows={5} placeholder="How can we pray for you?" />
      </FormField>

      <div className="space-y-4">
        <CheckboxField 
          id="shareWithPrayerTeam"
          name="shareWithPrayerTeam"
          label="Share with Prayer Team"
          description="Allow our dedicated prayer team to see and pray for this request."
          defaultChecked
        />
        <CheckboxField 
          id="confidential"
          name="confidential"
          label="Keep Confidential"
          description="Only the pastoral staff will see this request."
        />
      </div>

      <SubmitButton pendingText="Submitting..." className="w-full md:w-auto">
        Submit Prayer Request
      </SubmitButton>
    </form>
  );
}
