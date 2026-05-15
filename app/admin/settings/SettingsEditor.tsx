"use client";

import * as React from "react";
import { Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { ImageUploadField } from "@/components/admin/settings/ImageUploadField";
import type { CmsDocument } from "@/lib/data/adminCms";
import { createDocumentAction, updateDocumentAction } from "@/app/admin/cms/actions";

interface SettingsEditorProps {
  initialSettings: CmsDocument[];
  canEdit: boolean;
}

const SERVICE_TIME_DEFAULTS = {
  breakfast_service: "Saturdays · 9:00am",
  sabbath_school: "Saturdays · 10:00am",
  divine_worship: "Saturdays · 11:00am",
  prayer_meeting: "Wednesdays · 7:00pm",
} as const;

const WELCOME_DEFAULTS = {
  left_title: "Welcome to Stonehill Seventh-day Adventist Church",
  left_paragraph: "We're a vibrant community of believers in Pflugerville, TX. We invite you to join us as we worship the Lord, nurture one another, and selflessly serve our neighbors. Our Saturday worship services provide an uplifting experience focused on biblical teaching, inspirational music, and heartfelt prayer. We offer a variety of ministries and spiritual growth opportunities for children, youth, adults, and seniors.",
  right_paragraph_1: "Welcome Home to Stonehill. We are grateful you have taken a moment to visit us online. Whether you are a long-time member, a returning friend, or someone exploring faith for the first time, please know you are warmly welcomed here.",
  right_paragraph_2: "One of our greatest blessings is the beautiful diversity of our church family. Our members represent more than 50 countries now living in the United States, united by one faith, one hope, and one Savior. At Stonehill, we celebrate our multicultural community as a reflection of God's kingdom and His love for all people."
} as const;

function isSettingGroup(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function initialSettingsToGroups(initialSettings: CmsDocument[]) {
  const dict: Record<string, any> = {};

  initialSettings.forEach((doc) => {
    const key = doc.key as string;

    if (!key.includes(".")) {
      return;
    }

    const [group, field] = key.split(".", 2);
    dict[group] = {
      ...(dict[group] || {}),
      [field]: doc.value,
    };
  });

  initialSettings.forEach((doc) => {
    const key = doc.key as string;

    if (key.includes(".")) {
      return;
    }

    dict[key] = isSettingGroup(doc.value)
      ? { ...(dict[key] || {}), ...doc.value }
      : doc.value;
  });

  return dict;
}

export function SettingsEditor({ initialSettings, canEdit }: SettingsEditorProps) {
  const [settings, setSettings] = React.useState<Record<string, any>>(() =>
    initialSettingsToGroups(initialSettings),
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const getDocId = (key: string) => {
    return initialSettings.find((doc) => doc.key === key)?.id;
  };

  const handleSave = async (key: string, group: string, value: any) => {
    if (!canEdit) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const existingId = getDocId(key);
      const payload = { key, group, value };

      let res;
      if (existingId) {
        res = await updateDocumentAction("siteSettings", existingId, payload);
      } else {
        res = await createDocumentAction("siteSettings", payload);
      }

      if (res.ok) {
        setMessage({ type: "success", text: `Successfully updated ${key} settings.` });
      } else {
        setMessage({ type: "error", text: res.error.message || "Failed to update settings." });
      }
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (key: string, field: string, val: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        [field]: val,
      },
    }));
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-lg text-sm border ${
          message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
        }`}>
          {message.type === "error" && <AlertCircle className="h-5 w-5 shrink-0" />}
          <p>{message.text}</p>
        </div>
      )}

      {/* Branding & Media Group */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <h3 className="text-lg font-semibold text-slate-900">Branding & Media</h3>
          <p className="text-sm text-slate-500">Manage your site logo and favicon.</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImageUploadField
            label="Site Logo"
            description="Displayed in the main navigation and footer."
            value={settings["general"]?.logo_url || ""}
            onChange={(url) => handleChange("general", "logo_url", url)}
            disabled={!canEdit || isSubmitting}
            defaultAltText="Site Logo"
          />
          <ImageUploadField
            label="Site Favicon"
            description="The small icon shown in the browser tab (ideally square)."
            value={settings["general"]?.favicon_url || ""}
            onChange={(url) => handleChange("general", "favicon_url", url)}
            disabled={!canEdit || isSubmitting}
            defaultAltText="Site Favicon"
          />
        </div>
        {canEdit && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex justify-end">
            <Button disabled={isSubmitting} onClick={() => handleSave("general", "general", settings["general"] || {})}>
              <Save className="h-4 w-4 mr-2" /> Save Branding
            </Button>
          </div>
        )}
      </section>

      {/* Contact Info Group */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
          <p className="text-sm text-slate-500">Public contact details displayed in the footer and contact page.</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Email Address</label>
            <TextInput
              type="email"
              value={settings["contact"]?.email || ""}
              onChange={(e) => handleChange("contact", "email", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Phone Number</label>
            <TextInput
              type="tel"
              value={settings["contact"]?.phone || ""}
              onChange={(e) => handleChange("contact", "phone", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Physical Address</label>
            <TextInput
              value={settings["contact"]?.address || ""}
              onChange={(e) => handleChange("contact", "address", e.target.value)}
            />
          </div>
        </div>
        {canEdit && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex justify-end">
            <Button disabled={isSubmitting} onClick={() => handleSave("contact", "contact", settings["contact"] || {})}>
              <Save className="h-4 w-4 mr-2" /> Save Contact Info
            </Button>
          </div>
        )}
      </section>

      {/* Service Times Group */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <h3 className="text-lg font-semibold text-slate-900">Service Times</h3>
          <p className="text-sm text-slate-500">Weekly worship and prayer schedule displayed on public pages.</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Breakfast Service</label>
            <TextInput
              value={settings["service_times"]?.breakfast_service || SERVICE_TIME_DEFAULTS.breakfast_service}
              placeholder={SERVICE_TIME_DEFAULTS.breakfast_service}
              onChange={(e) => handleChange("service_times", "breakfast_service", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Sabbath School</label>
            <TextInput
              value={settings["service_times"]?.sabbath_school || SERVICE_TIME_DEFAULTS.sabbath_school}
              placeholder={SERVICE_TIME_DEFAULTS.sabbath_school}
              onChange={(e) => handleChange("service_times", "sabbath_school", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Divine Worship</label>
            <TextInput
              value={settings["service_times"]?.divine_worship || SERVICE_TIME_DEFAULTS.divine_worship}
              placeholder={SERVICE_TIME_DEFAULTS.divine_worship}
              onChange={(e) => handleChange("service_times", "divine_worship", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Prayer Meeting</label>
            <TextInput
              value={settings["service_times"]?.prayer_meeting || SERVICE_TIME_DEFAULTS.prayer_meeting}
              placeholder={SERVICE_TIME_DEFAULTS.prayer_meeting}
              onChange={(e) => handleChange("service_times", "prayer_meeting", e.target.value)}
            />
          </div>
        </div>
        {canEdit && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex justify-end">
            <Button
              disabled={isSubmitting}
              onClick={() =>
                handleSave("service_times", "service_times", {
                  ...SERVICE_TIME_DEFAULTS,
                  ...(settings["service_times"] || {}),
                })
              }
            >
              <Save className="h-4 w-4 mr-2" /> Save Service Times
            </Button>
          </div>
        )}
      </section>

      {/* Social Links Group */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <h3 className="text-lg font-semibold text-slate-900">Social Media Links</h3>
          <p className="text-sm text-slate-500">URLs for church social media profiles.</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Facebook URL</label>
            <TextInput
              type="url"
              value={settings["social"]?.facebook || ""}
              onChange={(e) => handleChange("social", "facebook", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Instagram URL</label>
            <TextInput
              type="url"
              value={settings["social"]?.instagram || ""}
              onChange={(e) => handleChange("social", "instagram", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">YouTube Channel URL</label>
            <TextInput
              type="url"
              value={settings["social"]?.youtube || ""}
              onChange={(e) => handleChange("social", "youtube", e.target.value)}
            />
          </div>
        </div>
        {canEdit && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex justify-end">
            <Button disabled={isSubmitting} onClick={() => handleSave("social", "social", settings["social"] || {})}>
              <Save className="h-4 w-4 mr-2" /> Save Social Links
            </Button>
          </div>
        )}
      </section>

      {/* Homepage Welcome Section Group */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <h3 className="text-lg font-semibold text-slate-900">Homepage Welcome Section</h3>
          <p className="text-sm text-slate-500">Manage the welcome text displayed on the homepage alongside the pastoral headshots.</p>
        </div>
        <div className="p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Left Column: Title</label>
            <TextInput
              value={settings["welcome"]?.left_title || ""}
              placeholder={WELCOME_DEFAULTS.left_title}
              onChange={(e) => handleChange("welcome", "left_title", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Left Column: Paragraph</label>
            <TextArea
              className="min-h-[120px]"
              value={settings["welcome"]?.left_paragraph || ""}
              placeholder={WELCOME_DEFAULTS.left_paragraph}
              onChange={(e) => handleChange("welcome", "left_paragraph", e.target.value)}
            />
          </div>
          <div className="border-t border-slate-200 pt-6 flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Right Column: First Paragraph</label>
            <TextArea
              className="min-h-[100px]"
              value={settings["welcome"]?.right_paragraph_1 || ""}
              placeholder={WELCOME_DEFAULTS.right_paragraph_1}
              onChange={(e) => handleChange("welcome", "right_paragraph_1", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-900">Right Column: Second Paragraph</label>
            <TextArea
              className="min-h-[100px]"
              value={settings["welcome"]?.right_paragraph_2 || ""}
              placeholder={WELCOME_DEFAULTS.right_paragraph_2}
              onChange={(e) => handleChange("welcome", "right_paragraph_2", e.target.value)}
            />
          </div>
        </div>
        {canEdit && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex justify-end">
            <Button
              disabled={isSubmitting}
              onClick={() =>
                handleSave("welcome", "welcome", {
                  ...WELCOME_DEFAULTS,
                  ...(settings["welcome"] || {}),
                })
              }
            >
              <Save className="h-4 w-4 mr-2" /> Save Welcome Section
            </Button>
          </div>
        )}
      </section>

      <div className="text-sm text-slate-500 p-4 border border-dashed border-slate-200 rounded-lg text-center">
        Note: More settings groups (SEO, Giving) can be added here following the same pattern.
      </div>
    </div>
  );
}
