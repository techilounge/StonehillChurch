"use client";

import * as React from "react";
import { useState } from "react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { SelectInput } from "@/components/forms/SelectInput";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { FormStatusAlert } from "./FormStatusAlert";

export function MembershipTransferForm() {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function action(formData: FormData) {
    setStatus("idle");
    const payload = {
      formType: "membership_transfer",
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      transferDirection: formData.get("transferDirection") || "to_stonehill",
      currentChurch: formData.get("currentChurch") || undefined,
      receivingChurch: formData.get("receivingChurch") || undefined,
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
        "Your membership transfer request has been submitted. The church clerk will contact you.",
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
        <h3 className="text-xl font-bold tracking-tight text-stonehill-ink border-b border-stonehill-line pb-2">
          Your Information
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
        <h3 className="text-xl font-bold tracking-tight text-stonehill-ink border-b border-stonehill-line pb-2">
          Transfer Details
        </h3>

        <FormField label="Type of Transfer *" id="transferDirection">
          <SelectInput
            id="transferDirection"
            name="transferDirection"
            required
            defaultValue="to_stonehill"
          >
            <option value="to_stonehill">
              Transferring TO Stonehill SDA Church
            </option>
            <option value="from_stonehill">
              Transferring FROM Stonehill SDA Church
            </option>
            <option value="other">Other / Not Sure</option>
          </SelectInput>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Current Church"
            id="currentChurch"
            description="The church you are currently a member of"
          >
            <TextInput
              id="currentChurch"
              name="currentChurch"
              placeholder="Name of church, City, State"
            />
          </FormField>

          <FormField
            label="Receiving Church"
            id="receivingChurch"
            description="The church you are transferring to (if leaving Stonehill)"
          >
            <TextInput
              id="receivingChurch"
              name="receivingChurch"
              placeholder="Name of church, City, State"
            />
          </FormField>
        </div>

        <FormField
          label="Additional Information *"
          id="message"
          description="Any other details the church clerk should know"
        >
          <TextArea
            id="message"
            name="message"
            required
            rows={4}
            placeholder="Please process my transfer..."
          />
        </FormField>
      </div>

      <SubmitButton pendingText="Submitting..." className="w-full md:w-auto">
        Submit Request
      </SubmitButton>
    </form>
  );
}
