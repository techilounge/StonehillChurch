"use client";

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TextInput } from "@/components/forms/TextInput";
import { SelectInput } from "@/components/forms/SelectInput";
import { Button } from "@/components/shared/Button";
import { Search } from "lucide-react";

export function AdminFormsFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [formType, setFormType] = useState(searchParams.get("formType") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");

  function applyFilters(newSearch = search, newFormType = formType, newStatus = status) {
    const params = new URLSearchParams(searchParams.toString());
    
    if (newSearch.trim()) {
      params.set("search", newSearch.trim());
    } else {
      params.delete("search");
    }

    if (newFormType) {
      params.set("formType", newFormType);
    } else {
      params.delete("formType");
    }

    if (newStatus) {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleReset() {
    setSearch("");
    setFormType("");
    setStatus("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1 w-full space-y-1.5">
        <label className="text-sm font-semibold text-slate-900">Search Submissions</label>
        <div className="relative">
          <TextInput
            placeholder="Search by name, email, subject, or message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="pl-10"
          />
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="w-full md:w-56 space-y-1.5">
        <label className="text-sm font-semibold text-slate-900">Form Type</label>
        <SelectInput
          value={formType}
          onChange={(e) => {
            setFormType(e.target.value);
            applyFilters(search, e.target.value, status);
          }}
        >
          <option value="">All Types</option>
          <option value="prayer_request">Prayer Request</option>
          <option value="contact">Contact Form</option>
          <option value="volunteer">Volunteer Inquiry</option>
          <option value="announcement_request">Announcement Request</option>
          <option value="membership_transfer">Membership Transfer</option>
          <option value="maintenance_request">Maintenance Request</option>
          <option value="plan_your_visit">Plan Your Visit</option>
        </SelectInput>
      </div>

      <div className="w-full md:w-48 space-y-1.5">
        <label className="text-sm font-semibold text-slate-900">Status</label>
        <SelectInput
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            applyFilters(search, formType, e.target.value);
          }}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </SelectInput>
      </div>

      <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
        <Button
          onClick={() => applyFilters()}
          disabled={isPending}
          variant="default"
          className="w-full md:w-auto min-h-[44px]"
        >
          Search
        </Button>
        {(search || formType || status) && (
          <Button
            onClick={handleReset}
            disabled={isPending}
            variant="outline"
            className="w-full md:w-auto min-h-[44px]"
          >
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
