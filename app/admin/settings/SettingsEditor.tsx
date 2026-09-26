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

  // Scenario-specific notification inputs
  const [prayerTeamName, setPrayerTeamName] = React.useState(() => {
    const val = settings["notifications"]?.prayerTeam;
    return val && typeof val === "object" && !Array.isArray(val)
      ? (val.senderName as string) || ""
      : "";
  });
  const [prayerTeamEmails, setPrayerTeamEmails] = React.useState(() => {
    const val = settings["notifications"]?.prayerTeam;
    if (Array.isArray(val)) return val.join(", ");
    if (val && typeof val === "object") {
      return Array.isArray(val.recipients) ? val.recipients.join(", ") : "";
    }
    return "";
  });

  const [confidentialName, setConfidentialName] = React.useState(() => {
    const val = settings["notifications"]?.confidential;
    return val && typeof val === "object" && !Array.isArray(val)
      ? (val.senderName as string) || ""
      : "";
  });
  const [confidentialEmails, setConfidentialEmails] = React.useState(() => {
    const val = settings["notifications"]?.confidential;
    if (Array.isArray(val)) return val.join(", ");
    if (val && typeof val === "object") {
      return Array.isArray(val.recipients) ? val.recipients.join(", ") : "";
    }
    return "";
  });

  const [contactFormName, setContactFormName] = React.useState(() => {
    const val = settings["notifications"]?.contactForm;
    return val && typeof val === "object" && !Array.isArray(val)
      ? (val.senderName as string) || ""
      : "";
  });
  const [contactFormEmails, setContactFormEmails] = React.useState(() => {
    const val = settings["notifications"]?.contactForm;
    if (Array.isArray(val)) return val.join(", ");
    if (val && typeof val === "object") {
      return Array.isArray(val.recipients) ? val.recipients.join(", ") : "";
    }
    return "";
  });

  const [errors, setErrors] = React.useState<{
    prayerTeamName?: string;
    prayerTeamEmails?: string;
    confidentialName?: string;
    confidentialEmails?: string;
    contactFormName?: string;
    contactFormEmails?: string;
  }>({});

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function validateEmailList(val: string): { isValid: boolean; error?: string } {
    if (!val.trim()) return { isValid: true };
    const emails = val.split(",").map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) return { isValid: true };
    
    const invalidEmails = emails.filter((email) => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return {
        isValid: false,
        error: `Invalid email format: ${invalidEmails.join(", ")}`
      };
    }
    return { isValid: true };
  }

  function validateSenderName(val: string): { isValid: boolean; error?: string } {
    const trimmed = val.trim();
    if (!trimmed) {
      return { isValid: false, error: "Sender name cannot be empty." };
    }
    if (trimmed.length > 60) {
      return { isValid: false, error: "Sender name cannot exceed 60 characters." };
    }
    return { isValid: true };
  }

  const handlePrayerTeamNameChange = (val: string) => {
    setPrayerTeamName(val);
    const result = validateSenderName(val);
    setErrors((prev) => ({
      ...prev,
      prayerTeamName: result.isValid ? undefined : result.error
    }));
  };

  const handlePrayerTeamEmailsChange = (val: string) => {
    setPrayerTeamEmails(val);
    const result = validateEmailList(val);
    setErrors((prev) => ({
      ...prev,
      prayerTeamEmails: result.isValid ? undefined : result.error
    }));
  };

  const handleConfidentialNameChange = (val: string) => {
    setConfidentialName(val);
    const result = validateSenderName(val);
    setErrors((prev) => ({
      ...prev,
      confidentialName: result.isValid ? undefined : result.error
    }));
  };

  const handleConfidentialEmailsChange = (val: string) => {
    setConfidentialEmails(val);
    const result = validateEmailList(val);
    setErrors((prev) => ({
      ...prev,
      confidentialEmails: result.isValid ? undefined : result.error
    }));
  };

  const handleContactFormNameChange = (val: string) => {
    setContactFormName(val);
    const result = validateSenderName(val);
    setErrors((prev) => ({
      ...prev,
      contactFormName: result.isValid ? undefined : result.error
    }));
  };

  const handleContactFormEmailsChange = (val: string) => {
    setContactFormEmails(val);
    const result = validateEmailList(val);
    setErrors((prev) => ({
      ...prev,
      contactFormEmails: result.isValid ? undefined : result.error
    }));
  };

  const handleSaveNotifications = async () => {
    const ptNameCheck = validateSenderName(prayerTeamName);
    const ptEmailCheck = validateEmailList(prayerTeamEmails);
    const cNameCheck = validateSenderName(confidentialName);
    const cEmailCheck = validateEmailList(confidentialEmails);
    const cfNameCheck = validateSenderName(contactFormName);
    const cfEmailCheck = validateEmailList(contactFormEmails);

    if (
      !ptNameCheck.isValid || !ptEmailCheck.isValid ||
      !cNameCheck.isValid || !cEmailCheck.isValid ||
      !cfNameCheck.isValid || !cfEmailCheck.isValid
    ) {
      setErrors({
        prayerTeamName: ptNameCheck.isValid ? undefined : ptNameCheck.error,
        prayerTeamEmails: ptEmailCheck.isValid ? undefined : ptEmailCheck.error,
        confidentialName: cNameCheck.isValid ? undefined : cNameCheck.error,
        confidentialEmails: cEmailCheck.isValid ? undefined : cEmailCheck.error,
        contactFormName: cfNameCheck.isValid ? undefined : cfNameCheck.error,
        contactFormEmails: cfEmailCheck.isValid ? undefined : cfEmailCheck.error,
      });

      const firstInvalidId = !ptNameCheck.isValid ? "pt-name"
        : !ptEmailCheck.isValid ? "pt-emails"
        : !cNameCheck.isValid ? "c-name"
        : !cEmailCheck.isValid ? "c-emails"
        : !cfNameCheck.isValid ? "cf-name"
        : "cf-emails";

      setTimeout(() => {
        const el = document.getElementById(firstInvalidId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);

      return;
    }

    const value = {
      prayerTeam: {
        senderName: prayerTeamName.trim(),
        recipients: prayerTeamEmails.split(",").map((e: string) => e.trim()).filter(Boolean),
      },
      confidential: {
        senderName: confidentialName.trim(),
        recipients: confidentialEmails.split(",").map((e: string) => e.trim()).filter(Boolean),
      },
      contactForm: {
        senderName: contactFormName.trim(),
        recipients: contactFormEmails.split(",").map((e: string) => e.trim()).filter(Boolean),
      },
    };

    setSettings((prev) => ({
      ...prev,
      notifications: value
    }));

    await handleSave("notifications", "notifications", value);
  };

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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "An unexpected error occurred." });
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  const slideConfig = settings["homepageSlides"] || {
    height: {
      mode: "default",
      preset: "medium",
      customValue: "600",
      unit: "px"
    }
  };

  const handleHeightModeChange = (mode: "default" | "preset" | "custom") => {
    setSettings((prev) => ({
      ...prev,
      homepageSlides: {
        ...(prev.homepageSlides || {}),
        height: {
          ...(prev.homepageSlides?.height || { preset: "medium", customValue: "600", unit: "px" }),
          mode,
        },
      },
    }));
  };

  const handleHeightPresetChange = (preset: "small" | "medium" | "large" | "fullscreen") => {
    setSettings((prev) => ({
      ...prev,
      homepageSlides: {
        ...(prev.homepageSlides || {}),
        height: {
          ...(prev.homepageSlides?.height || { mode: "preset", customValue: "600", unit: "px" }),
          preset,
        },
      },
    }));
  };

  const handleCustomValueChange = (customValue: string) => {
    setSettings((prev) => ({
      ...prev,
      homepageSlides: {
        ...(prev.homepageSlides || {}),
        height: {
          ...(prev.homepageSlides?.height || { mode: "custom", preset: "medium", unit: "px" }),
          customValue,
        },
      },
    }));
  };

  const handleHeightUnitChange = (unit: "px" | "%" | "vh") => {
    setSettings((prev) => ({
      ...prev,
      homepageSlides: {
        ...(prev.homepageSlides || {}),
        height: {
          ...(prev.homepageSlides?.height || { mode: "custom", preset: "medium", customValue: "600" }),
          unit,
        },
      },
    }));
  };

  const handleResetHeight = () => {
    setSettings((prev) => ({
      ...prev,
      homepageSlides: {
        height: {
          mode: "default",
          preset: "medium",
          customValue: "600",
          unit: "px",
        },
      },
    }));
  };

  const handleMediaRatioChange = (field: string, val: string) => {
    setSettings((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        defaultRatios: {
          ...(prev.media?.defaultRatios || { ministries: "auto", homepageSlides: "auto", pageBuilder: "auto", resources: "auto" }),
          [field]: val,
        },
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

      {/* Media Handling Group */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <h3 className="text-lg font-semibold text-slate-900">Media Handling</h3>
          <p className="text-sm text-slate-500">Configure global default aspect ratios for different modules.</p>
        </div>
        <div className="p-6 flex flex-col gap-6">
          <h4 className="text-sm font-semibold text-slate-900">Aspect Ratio Presets</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Ministry Pages Default</label>
              <select
                value={settings["media"]?.defaultRatios?.ministries || "auto"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleMediaRatioChange("ministries", e.target.value)}
                className="flex min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
              >
                <option value="auto">Auto (No enforced ratio)</option>
                <option value="16:9">16:9 (Wide hero)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Homepage Slides Default</label>
              <select
                value={settings["media"]?.defaultRatios?.homepageSlides || "auto"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleMediaRatioChange("homepageSlides", e.target.value)}
                className="flex min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
              >
                <option value="auto">Auto (No enforced ratio)</option>
                <option value="16:9">16:9 (Wide hero)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Page Builder Blocks Default</label>
              <select
                value={settings["media"]?.defaultRatios?.pageBuilder || "auto"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleMediaRatioChange("pageBuilder", e.target.value)}
                className="flex min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
              >
                <option value="auto">Auto (No enforced ratio)</option>
                <option value="16:9">16:9 (Wide hero)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Resource Pages Default</label>
              <select
                value={settings["media"]?.defaultRatios?.resources || "auto"}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleMediaRatioChange("resources", e.target.value)}
                className="flex min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
              >
                <option value="auto">Auto (No enforced ratio)</option>
                <option value="16:9">16:9 (Wide hero)</option>
                <option value="4:3">4:3 (Standard)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex justify-end">
            <Button disabled={isSubmitting} onClick={() => handleSave("media", "media", settings["media"] || {})}>
              <Save className="h-4 w-4 mr-2" /> Save Media Handling
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

      {/* Notification Settings Group */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <h3 className="text-lg font-semibold text-slate-900">Notification Settings</h3>
          <p className="text-sm text-slate-500">Configure email routing recipients and custom sender names for different scenarios.</p>
        </div>
        
        <div className="p-6 flex flex-col gap-6">
          {/* Card A: Share with Prayer Team */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">Prayer Requests — &ldquo;Share with Prayer Team&rdquo;</h4>
            
            <div id="pt-name" className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Sender Name</label>
              <TextInput
                placeholder="Stonehill Prayer Team"
                value={prayerTeamName}
                onChange={(e) => handlePrayerTeamNameChange(e.target.value)}
                hasError={Boolean(errors.prayerTeamName)}
                maxLength={60}
              />
              <p className="text-xs text-slate-500">
                This name will appear as the sender in outgoing email notifications for this scenario.
              </p>
              {errors.prayerTeamName && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.prayerTeamName}</span>
                </div>
              )}
            </div>

            <div id="pt-emails" className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Recipient Email(s)</label>
              <TextInput
                placeholder="prayerteam@stonehillchurch.org, helpers@stonehillchurch.org"
                value={prayerTeamEmails}
                onChange={(e) => handlePrayerTeamEmailsChange(e.target.value)}
                hasError={Boolean(errors.prayerTeamEmails)}
              />
              <p className="text-xs text-slate-500">
                Notifications for prayer requests shared with the Prayer Team.
              </p>
              {errors.prayerTeamEmails && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.prayerTeamEmails}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card B: Keep Confidential */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">Confidential Prayer Requests — &ldquo;Keep Confidential&rdquo;</h4>
            
            <div id="c-name" className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Sender Name</label>
              <TextInput
                placeholder="Pastoral Care Team"
                value={confidentialName}
                onChange={(e) => handleConfidentialNameChange(e.target.value)}
                hasError={Boolean(errors.confidentialName)}
                maxLength={60}
              />
              <p className="text-xs text-slate-500">
                This name will appear as the sender in outgoing email notifications for this scenario.
              </p>
              {errors.confidentialName && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.confidentialName}</span>
                </div>
              )}
            </div>

            <div id="c-emails" className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Recipient Email(s)</label>
              <TextInput
                placeholder="pastor@stonehillchurch.org"
                value={confidentialEmails}
                onChange={(e) => handleConfidentialEmailsChange(e.target.value)}
                hasError={Boolean(errors.confidentialEmails)}
              />
              <p className="text-xs text-slate-500">
                Notifications for confidential prayer requests sent only to pastoral staff.
              </p>
              {errors.confidentialEmails && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.confidentialEmails}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card C: General Contact Form */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 space-y-4">
            <h4 className="text-sm font-semibold text-slate-900">General Contact Form Submissions</h4>
            
            <div id="cf-name" className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Sender Name</label>
              <TextInput
                placeholder="Stonehill Office"
                value={contactFormName}
                onChange={(e) => handleContactFormNameChange(e.target.value)}
                hasError={Boolean(errors.contactFormName)}
                maxLength={60}
              />
              <p className="text-xs text-slate-500">
                This name will appear as the sender in outgoing email notifications for this scenario.
              </p>
              {errors.contactFormName && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.contactFormName}</span>
                </div>
              )}
            </div>

            <div id="cf-emails" className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700">Recipient Email(s)</label>
              <TextInput
                placeholder="office@stonehillchurch.org"
                value={contactFormEmails}
                onChange={(e) => handleContactFormEmailsChange(e.target.value)}
                hasError={Boolean(errors.contactFormEmails)}
              />
              <p className="text-xs text-slate-500">
                Notifications for messages submitted through the Contact page.
              </p>
              {errors.contactFormEmails && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-red-600 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{errors.contactFormEmails}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex justify-end">
            <Button 
              disabled={isSubmitting || Boolean(
                errors.prayerTeamName || errors.prayerTeamEmails || 
                errors.confidentialName || errors.confidentialEmails || 
                errors.contactFormName || errors.contactFormEmails
              )} 
              onClick={handleSaveNotifications}
            >
              <Save className="h-4 w-4 mr-2" /> Save Notification Settings
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

      {/* Design Tokens — Page Builder spacing scale */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <h3 className="text-lg font-semibold text-slate-900">Design Tokens · Spacing</h3>
          <p className="text-sm text-slate-500">
            Global spacing scale used by the Page Builder. Pick a token in any Padding or Margin
            control to reference these values; updating a token here updates every page that uses it.
            All values are pixels.
          </p>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          {(["xs", "sm", "md", "lg", "xl"] as const).map((name) => {
            const tokens = (settings["design"]?.spacing_tokens || {}) as Record<string, unknown>;
            const fallback: Record<string, number> = { xs: 4, sm: 8, md: 16, lg: 32, xl: 64 };
            const value = typeof tokens[name] === "number" ? (tokens[name] as number) : Number(tokens[name]);
            const shown = Number.isFinite(value) ? value : fallback[name];
            return (
              <div key={name} className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-900 uppercase">{name}</label>
                <TextInput
                  type="number"
                  min={0}
                  max={500}
                  value={String(shown)}
                  onChange={(e) => {
                    const next = Math.max(0, Math.min(500, Number(e.target.value) || 0));
                    setSettings((prev) => ({
                      ...prev,
                      design: {
                        ...(prev["design"] || {}),
                        spacing_tokens: {
                          ...((prev["design"]?.spacing_tokens as Record<string, unknown>) || {}),
                          [name]: next,
                        },
                      },
                    }));
                  }}
                />
              </div>
            );
          })}
        </div>
        {canEdit && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex justify-end">
            <Button
              disabled={isSubmitting}
              onClick={() => handleSave("design", "design", settings["design"] || {})}
            >
              <Save className="h-4 w-4 mr-2" /> Save Spacing Tokens
            </Button>
          </div>
        )}
      </section>

      {/* Homepage Slide Height Configuration */}
      <section className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/30">
          <h3 className="text-lg font-semibold text-slate-900">Homepage Slide Height Configuration</h3>
          <p className="text-sm text-slate-500">
            Configure the height of the hero image slides on the homepage.
          </p>
        </div>
        <div className="p-6 flex flex-col gap-6">
          {/* Mode Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-900">Height Mode</label>
            <div className="flex flex-wrap gap-6 mt-1">
              {[
                { label: "Default (60vh / current height)", value: "default" },
                { label: "Preset Heights", value: "preset" },
                { label: "Custom Height", value: "custom" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                  <input
                    type="radio"
                    name="slide-height-mode"
                    value={opt.value}
                    checked={slideConfig.height?.mode === opt.value}
                    disabled={!canEdit || isSubmitting}
                    onChange={(e) => handleHeightModeChange(e.target.value as any)}
                    className="text-stonehill-accent focus:ring-stonehill-accent"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Preset Height Selector */}
          {slideConfig.height?.mode === "preset" && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-slate-900">Choose Preset</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-1">
                {[
                  { label: "Small (45vh)", value: "small" },
                  { label: "Medium (60vh)", value: "medium" },
                  { label: "Large (75vh)", value: "large" },
                  { label: "Full Screen (100vh)", value: "fullscreen" },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer text-center transition-all ${
                      slideConfig.height?.preset === opt.value
                        ? "border-stonehill-accent bg-slate-50 text-stonehill-primary font-medium"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="slide-height-preset"
                      value={opt.value}
                      checked={slideConfig.height?.preset === opt.value}
                      disabled={!canEdit || isSubmitting}
                      onChange={(e) => handleHeightPresetChange(e.target.value as any)}
                      className="sr-only"
                    />
                    <span className="text-sm">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom Height Inputs */}
          {slideConfig.height?.mode === "custom" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-900">Custom Value</label>
                <TextInput
                  type="number"
                  min={1}
                  max={2000}
                  value={slideConfig.height?.customValue || ""}
                  disabled={!canEdit || isSubmitting}
                  onChange={(e) => handleCustomValueChange(e.target.value)}
                  placeholder="e.g. 600"
                />
                <span className="text-xs text-slate-500">
                  Value must be between 1 and 2000.
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-900">Unit</label>
                <select
                  value={slideConfig.height?.unit || "px"}
                  disabled={!canEdit || isSubmitting}
                  onChange={(e) => handleHeightUnitChange(e.target.value as any)}
                  className="flex min-h-[44px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2"
                >
                  <option value="px">pixels (px)</option>
                  <option value="vh">viewport height (vh)</option>
                  <option value="%">percent (%)</option>
                </select>
              </div>
            </div>
          )}

          {/* Helper Text */}
          <p className="text-xs text-slate-500 italic mt-2">
            * This setting applies globally to all Homepage Carousel slides across desktop, tablet, and mobile layouts.
          </p>
        </div>
        {canEdit && (
          <div className="px-6 py-4 bg-slate-50/30 border-t border-slate-200 flex justify-between items-center">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={handleResetHeight}
            >
              Reset to Default
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={() => handleSave("homepageSlides", "design", slideConfig)}
            >
              <Save className="h-4 w-4 mr-2" /> Save Height Settings
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
