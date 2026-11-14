"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, AlertCircle, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { InfoIcon } from "@/components/admin/shared/InfoIcon";
import { RecurrenceEditor } from "@/components/admin/cms/RecurrenceEditor";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { SelectInput } from "@/components/forms/SelectInput";
import { CheckboxField } from "@/components/forms/CheckboxField";
import { CMS_CONFIG } from "./CmsConfig";
import type { CmsModule, CmsDocument } from "@/lib/data/adminCms";
import { createDocumentAction, updateDocumentAction } from "@/app/admin/cms/actions";
import { MediaSelectorDialog } from "../media/MediaSelectorDialog";
import Image from "next/image";
import { PUBLISHED } from "@/types/shared";
import { FocalPointPicker } from "@/components/admin/shared/FocalPointPicker";
import { normalizeAnnouncement, slugifyAnnouncementTitle } from "@/lib/announcements";

interface CmsModuleFormProps {
  module: Exclude<CmsModule, "siteSettings">;
  initialData: CmsDocument | null;
  canPublish: boolean;
  /**
   * Per-field option overrides, keyed by field name. Used for select fields
   * whose options are populated from another collection at request time
   * (e.g. the leaders "category" dropdown sourced from leaderCategories).
   */
  dynamicOptions?: Record<string, { label: string; value: string }[]>;
}

export function CmsModuleForm({ module, initialData, canPublish, dynamicOptions }: CmsModuleFormProps) {
  const router = useRouter();
  const config = CMS_CONFIG[module];
  const isNew = !initialData;
  const slugManuallyEdited = React.useRef(!isNew);

  const [formData, setFormData] = React.useState<Record<string, any>>(() => {
    if (initialData) {
      if (module === "announcements") {
        const normalized = normalizeAnnouncement(initialData);
        return {
          ...normalized,
          seoTitle: typeof normalized.seoTitle === "string" ? normalized.seoTitle : "",
          seoDescription:
            typeof normalized.seoDescription === "string" ? normalized.seoDescription : "",
        };
      }
      return initialData;
    }
    // Seed the new-doc form with the per-field defaults declared in
    // CmsConfig. This is how a new popup lands pre-configured with sane
    // animation/backdrop/size values that the user can still override.
    const seeded: Record<string, any> = {};
    for (const field of config.fields) {
      if (field.defaultValue !== undefined) {
        seeded[field.name] = field.defaultValue;
      }
    }
    return seeded;
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  
  // Media Selector State
  const [mediaSelectorOpen, setMediaSelectorOpen] = React.useState(false);
  const [activeMediaField, setActiveMediaField] = React.useState<string | null>(null);

  // Per-field video upload state. Keyed by field name so multiple
  // videoUpload fields on a form don't share a single spinner.
  const [videoUploadingField, setVideoUploadingField] = React.useState<string | null>(null);
  const [videoUploadError, setVideoUploadError] = React.useState<Record<string, string | null>>({});

  const routePath = module.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

  const handleFieldChange = (name: string, value: any) => {
    if (module === "announcements" && isNew && name === "slug") {
      slugManuallyEdited.current = true;
    }

    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (
        module === "announcements" &&
        isNew &&
        name === "title" &&
        !slugManuallyEdited.current
      ) {
        next.slug = slugifyAnnouncementTitle(value);
      }
      return next;
    });
    // Clear error for this field
    if (fieldErrors[name]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[name];
      setFieldErrors(newErrors);
    }
  };

  const renderFieldError = (fieldName: string) => {
    const errorMessages = fieldErrors[fieldName];
    if (!errorMessages || errorMessages.length === 0) return null;
    return (
      <div id={`field-error-${fieldName}`} className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
        <span>{errorMessages.join(", ")}</span>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent, forceStatus?: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);
    setFieldErrors({});

    const payload = { ...formData };
    if (forceStatus) {
      payload.status = forceStatus;
    }

    for (const field of config.fields) {
      if (payload[field.name] === undefined || payload[field.name] === null) {
        if (field.type === "boolean") {
          payload[field.name] = false;
        } else {
          payload[field.name] = null;
        }
      }
    }

    try {
      const response = isNew
        ? await createDocumentAction(module, payload)
        : await updateDocumentAction(module, initialData.id, payload);

      if (response.ok) {
        router.push(`/admin/${routePath}`);
        router.refresh();
      } else {
        console.log("CMS SAVE RESPONSE ERROR:", JSON.stringify(response.error, null, 2));
        setServerError(response.error.message || "Failed to save document.");
        if (response.error.fieldErrors) {
          setFieldErrors(response.error.fieldErrors);
          
          // Smooth scroll to the first invalid field
          const firstErrField = config.fields.find((f) => response.error.fieldErrors?.[f.name]);
          if (firstErrField) {
            setTimeout(() => {
              const container = document.getElementById(`field-container-${firstErrField.name}`);
              if (container) {
                container.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }, 50);
          }
        }
      }
    } catch (err: any) {
      setServerError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openMediaSelector = (fieldName: string) => {
    setActiveMediaField(fieldName);
    setMediaSelectorOpen(true);
  };

  const handleVideoUpload = async (fieldName: string, file: File) => {
    setVideoUploadingField(fieldName);
    setVideoUploadError((prev) => ({ ...prev, [fieldName]: null }));

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/media/video", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        const message = json?.error?.message || "Video upload failed.";
        setVideoUploadError((prev) => ({ ...prev, [fieldName]: message }));
        return;
      }
      handleFieldChange(fieldName, json.data.url);
    } catch (err) {
      setVideoUploadError((prev) => ({
        ...prev,
        [fieldName]: err instanceof Error ? err.message : "Video upload failed.",
      }));
    } finally {
      setVideoUploadingField(null);
    }
  };

  const isImageUrl = (url: string) => {
    return /\.(jpeg|jpg|gif|png|webp|avif|svg)(\?.*)?$/i.test(url);
  };

  // <input type="datetime-local"> takes "YYYY-MM-DDTHH:MM" in *local* time.
  // The stored value is a UTC ISO string. Naively round-tripping through
  // .toISOString().slice(0,16) keeps shifting the display by the user's TZ
  // offset on every render (e.g. 14:30 EDT becomes 18:30 in the input), so
  // we format component-wise from the local Date getters instead.
  const isoToDatetimeLocal = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isoToDateInput = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  return (
    <div className="flex min-w-0 max-w-4xl flex-col gap-6 pb-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/${routePath}`)} className="shrink-0">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isNew ? `New ${config.singular}` : `Edit ${config.singular}`}
          </h1>
          <p className="text-sm text-slate-500">
            {config.description}
          </p>
        </div>
      </div>

      {serverError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      <form className="bg-white border border-slate-200 shadow-sm rounded-xl" onSubmit={(e) => handleSubmit(e)}>
        <div className="flex flex-col gap-6 p-4 sm:p-8">
          {config.fields.map((field, fieldIndex) => {
            if (field.showWhen && !field.showWhen(formData)) return null;
            const errorMessages = fieldErrors[field.name];
            const hasError = !!errorMessages && errorMessages.length > 0;
            const value = formData[field.name];
            const fieldInputId = `cms-${module}-${field.name}`;
            const fieldDescriptionId = field.description
              ? `field-description-${field.name}`
              : undefined;
            const fieldErrorId = hasError ? `field-error-${field.name}` : undefined;
            const describedBy = [fieldDescriptionId, fieldErrorId].filter(Boolean).join(" ") || undefined;

            const showSectionHeading =
              field.section && config.fields[fieldIndex - 1]?.section !== field.section;

            return (
              <React.Fragment key={field.name}>
                {showSectionHeading && (
                  <div
                    className={`border-b border-slate-200 pb-2 ${fieldIndex === 0 ? "" : "pt-3"}`}
                  >
                    <h2 className="font-display text-xl text-stonehill-primary">
                      {field.section}
                    </h2>
                  </div>
                )}
              <div id={`field-container-${field.name}`} className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={fieldInputId} className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </span>
                  {(field.popover || field.tooltip) && (
                    <InfoIcon
                      {...(field.popover
                        ? { popover: field.popover, width: 320 }
                        : { tooltip: field.tooltip })}
                      ariaLabel={`Help for ${field.label}`}
                    />
                  )}
                </label>
                {field.description && (
                  <p id={fieldDescriptionId} className="text-xs text-slate-900/60 mb-1">{field.description}</p>
                )}

                {field.type === "text" || field.type === "slug" || field.type === "url" || field.type === "email" ? (
                  <>
                    <TextInput
                      id={fieldInputId}
                      type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                      value={value || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      hasError={hasError}
                      aria-describedby={describedBy}
                      aria-invalid={hasError}
                      maxLength={field.type === "slug" ? 120 : field.name === "seoTitle" ? 70 : undefined}
                    />
                    {renderFieldError(field.name)}
                  </>
                ) : field.type === "textarea" || field.type === "richText" ? (
                  <>
                    <TextArea
                      id={fieldInputId}
                      value={value || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      hasError={hasError}
                      rows={field.type === "richText" ? 10 : 4}
                      aria-describedby={describedBy}
                      aria-invalid={hasError}
                      maxLength={field.name === "summary" ? 300 : field.name === "seoDescription" ? 160 : undefined}
                    />
                    {field.name === "seoDescription" && (() => {
                      const text = value || "";
                      const length = text.length;
                      const limit = 160;
                      const remaining = limit - length;
                      const isOver = length > limit;
                      const isWarning = length >= limit * 0.9 && length <= limit;
                      
                      let colorClass = "text-slate-500";
                      if (isOver) {
                        colorClass = "text-red-600 font-semibold";
                      } else if (isWarning) {
                        colorClass = "text-amber-600 font-semibold";
                      }
                      
                      return (
                        <div className={`text-xs mt-1 transition-colors ${colorClass}`}>
                          {length} / {limit} characters used ({remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over limit`})
                        </div>
                      );
                    })()}
                    {renderFieldError(field.name)}
                  </>
                ) : field.type === "number" ? (
                  <>
                    <TextInput
                      id={fieldInputId}
                      type="number"
                      value={value ?? ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value === "" ? null : Number(e.target.value))}
                      required={field.required}
                      hasError={hasError}
                      aria-describedby={describedBy}
                      aria-invalid={hasError}
                    />
                    {renderFieldError(field.name)}
                  </>
                ) : field.type === "boolean" ? (
                  <>
                    <CheckboxField
                      id={fieldInputId}
                      checked={!!value}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      label={field.label}
                      hasError={hasError}
                      aria-describedby={describedBy}
                    />
                    {renderFieldError(field.name)}
                  </>
                ) : field.type === "select" ? (
                  <>
                    <SelectInput
                      id={fieldInputId}
                      value={value || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required={field.required}
                      hasError={hasError}
                      aria-describedby={describedBy}
                      aria-invalid={hasError}
                    >
                      <option value="">Select an option...</option>
                      {(dynamicOptions?.[field.name] && dynamicOptions[field.name].length > 0
                        ? dynamicOptions[field.name]
                        : field.options ?? []
                      ).map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </SelectInput>
                    {renderFieldError(field.name)}
                  </>
                ) : field.type === "date" || field.type === "datetime" ? (
                  <>
                    <TextInput
                      id={fieldInputId}
                      type={field.type === "date" ? "date" : "datetime-local"}
                      value={
                        value
                          ? field.type === "date"
                            ? isoToDateInput(value)
                            : isoToDatetimeLocal(value)
                          : ""
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (!raw) {
                          handleFieldChange(field.name, null);
                          return;
                        }
                        // `<input type="date">` emits "YYYY-MM-DD", which `new
                        // Date(...)` parses as UTC midnight. Read back via local
                        // getters in any TZ west of UTC and you get the previous
                        // day. Construct local midnight instead so the round-trip
                        // is stable.
                        if (field.type === "date") {
                          const [y, m, d] = raw.split("-").map(Number);
                          handleFieldChange(
                            field.name,
                            new Date(y, m - 1, d).toISOString(),
                          );
                        } else {
                          handleFieldChange(field.name, new Date(raw).toISOString());
                        }
                      }}
                      required={field.required}
                      hasError={hasError}
                      aria-describedby={describedBy}
                      aria-invalid={hasError}
                    />
                    {renderFieldError(field.name)}
                  </>
                ) : field.type === "recurrence" ? (
                  <>
                    <RecurrenceEditor
                      value={typeof value === "string" ? value : null}
                      onChange={(rule) => handleFieldChange(field.name, rule)}
                      startDateTime={
                        typeof formData.startDateTime === "string"
                          ? formData.startDateTime
                          : null
                      }
                      endDateTime={
                        typeof formData.endDateTime === "string"
                          ? formData.endDateTime
                          : null
                      }
                      startTime={
                        typeof formData.recurrenceStartTime === "string"
                          ? formData.recurrenceStartTime
                          : null
                      }
                      endTime={
                        typeof formData.recurrenceEndTime === "string"
                          ? formData.recurrenceEndTime
                          : null
                      }
                      onStartTimeChange={(t) =>
                        handleFieldChange("recurrenceStartTime", t)
                      }
                      onEndTimeChange={(t) => handleFieldChange("recurrenceEndTime", t)}
                    />
                    {renderFieldError(field.name)}
                  </>
                ) : field.type === "videoUpload" ? (
                  <div className="flex flex-col gap-2">
                    <TextInput
                      id={fieldInputId}
                      type="url"
                      value={value || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      placeholder="https://youtu.be/... or https://vimeo.com/..."
                      required={field.required}
                      hasError={hasError}
                      aria-describedby={describedBy}
                      aria-invalid={hasError}
                    />
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition">
                        {videoUploadingField === field.name ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            Uploading…
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" aria-hidden="true" />
                            Upload MP4
                          </>
                        )}
                        <input
                          type="file"
                          accept="video/mp4"
                          className="hidden"
                          disabled={videoUploadingField === field.name}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (file) handleVideoUpload(field.name, file);
                          }}
                        />
                      </label>
                      <span className="text-xs text-slate-500">
                        MP4 only, 25 MB max. Server stores under <code>media/videos/</code>.
                      </span>
                    </div>
                    {videoUploadError[field.name] && (
                      <span className="text-xs text-red-600 font-medium">
                        {videoUploadError[field.name]}
                      </span>
                    )}
                    {hasError && renderFieldError(field.name)}
                  </div>
                ) : field.type === "media" ? (
                  <div className="flex flex-col gap-3">
                    {value ? (
                      <>
                        <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex flex-col">
                          {isImageUrl(value) ? (
                            <Image src={value} alt="Selected media" fill className="object-cover" />
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50/50 text-center break-all text-xs font-medium text-slate-900">
                              <span className="mb-2 p-2 bg-white rounded-full shadow-sm">
                                📄 Document
                              </span>
                              {value.split('/').pop()}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button type="button" variant="primary" size="sm" onClick={() => openMediaSelector(field.name)}>
                              Change
                            </Button>
                            {!field.required && (
                              <Button type="button" variant="outline" size="sm" onClick={() => handleFieldChange(field.name, null)}>
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {isImageUrl(value) && (
                          <div className="mt-2">
                            <FocalPointPicker
                              imageUrl={value}
                              focalPointX={formData.focalPointX}
                              focalPointY={formData.focalPointY}
                              focalPointAuto={formData.focalPointAuto}
                              aspectRatio={formData.aspectRatio}
                              defaultAspectRatio={
                                module === "homepageSlides" ? "16:9" :
                                module === "leaders" ? "1:1" :
                                "auto"
                              }
                              onChange={(updates) => {
                                Object.entries(updates).forEach(([k, v]) => {
                                  handleFieldChange(k, v);
                                });
                              }}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <div 
                        className={`flex flex-col items-center justify-center w-full max-w-sm aspect-video rounded-lg border-2 border-dashed ${hasError ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50/30 hover:bg-slate-50/50 cursor-pointer transition-colors"}`}
                        onClick={() => openMediaSelector(field.name)}
                      >
                        <ImageIcon className={`h-8 w-8 mb-2 ${hasError ? "text-red-400" : "text-slate-900/40"}`} />
                        <span className={`text-sm font-medium ${hasError ? "text-red-600" : "text-slate-900/60"}`}>
                          Click to select media
                        </span>
                      </div>
                    )}
                    {hasError && renderFieldError(field.name)}
                  </div>
                ) : null}
              </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/30 p-4 sm:flex-row sm:items-center sm:justify-end sm:p-8">
          {/* If the schema requires a status, we assume we can Save Draft or Publish. Otherwise just Save. */}
          {formData.status !== undefined || isNew ? (
            <>
              <Button 
                type="button" 
                variant="outline" 
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, "draft")}
                className="w-full sm:w-auto"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              {canPublish && (
                <Button 
                  type="button" 
                  variant="primary" 
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e, PUBLISHED)}
                  className="w-full sm:w-auto"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {isNew ? "Publish" : "Save & Publish"}
                </Button>
              )}
            </>
          ) : (
            <Button 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          )}
        </div>
      </form>

      <MediaSelectorDialog
        isOpen={mediaSelectorOpen}
        onClose={() => setMediaSelectorOpen(false)}
        onSelect={(url) => {
          if (activeMediaField) {
            handleFieldChange(activeMediaField, url);
          }
        }}
      />
    </div>
  );
}
