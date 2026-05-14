"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/shared/Button";
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

interface CmsModuleFormProps {
  module: Exclude<CmsModule, "siteSettings">;
  initialData: CmsDocument | null;
  canPublish: boolean;
}

export function CmsModuleForm({ module, initialData, canPublish }: CmsModuleFormProps) {
  const router = useRouter();
  const config = CMS_CONFIG[module];
  const isNew = !initialData;

  const [formData, setFormData] = React.useState<Record<string, any>>(initialData || {});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  
  // Media Selector State
  const [mediaSelectorOpen, setMediaSelectorOpen] = React.useState(false);
  const [activeMediaField, setActiveMediaField] = React.useState<string | null>(null);

  const routePath = module.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

  const handleFieldChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (fieldErrors[name]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[name];
      setFieldErrors(newErrors);
    }
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

    try {
      const response = isNew
        ? await createDocumentAction(module, payload)
        : await updateDocumentAction(module, initialData.id, payload);

      if (response.ok) {
        router.push(`/admin/${routePath}`);
        router.refresh();
      } else {
        setServerError(response.error.message || "Failed to save document.");
        if (response.error.fieldErrors) {
          setFieldErrors(response.error.fieldErrors);
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

  const isImageUrl = (url: string) => {
    return /\.(jpeg|jpg|gif|png|webp|avif|svg)(\?.*)?$/i.test(url);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl pb-12">
      <div className="flex items-center gap-4">
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

      <form className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden" onSubmit={(e) => handleSubmit(e)}>
        <div className="p-6 sm:p-8 flex flex-col gap-6">
          {config.fields.map((field) => {
            const errorMessages = fieldErrors[field.name];
            const hasError = !!errorMessages && errorMessages.length > 0;
            const value = formData[field.name];

            return (
              <div key={field.name} className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {field.description && (
                  <p className="text-xs text-slate-900/60 mb-1">{field.description}</p>
                )}

                {field.type === "text" || field.type === "slug" || field.type === "url" || field.type === "email" ? (
                  <TextInput
                    type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"}
                    value={value || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    hasError={hasError}
                  />
                ) : field.type === "textarea" || field.type === "richText" ? (
                  <TextArea
                    value={value || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                    hasError={hasError}
                    rows={field.type === "richText" ? 10 : 4}
                  />
                ) : field.type === "number" ? (
                  <TextInput
                    type="number"
                    value={value ?? ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value === "" ? null : Number(e.target.value))}
                    required={field.required}
                    hasError={hasError}
                  />
                ) : field.type === "boolean" ? (
                  <CheckboxField
                    checked={!!value}
                    onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                    label={`Enable ${field.label}`}
                  />
                ) : field.type === "select" ? (
                  <SelectInput
                    value={value || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                    hasError={hasError}
                  >
                    <option value="">Select an option...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </SelectInput>
                ) : field.type === "date" || field.type === "datetime" ? (
                  <TextInput
                    type={field.type === "date" ? "date" : "datetime-local"}
                    value={value ? new Date(value).toISOString().slice(0, field.type === "date" ? 10 : 16) : ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value ? new Date(e.target.value).toISOString() : null)}
                    required={field.required}
                    hasError={hasError}
                  />
                ) : field.type === "media" ? (
                  <div className="flex flex-col gap-3">
                    {value ? (
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
                    {hasError && <span className="text-xs text-red-600 font-medium">{errorMessages.join(", ")}</span>}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="p-6 sm:p-8 border-t border-slate-200 bg-slate-50/30 flex items-center justify-end gap-3 shrink-0">
          {/* If the schema requires a status, we assume we can Save Draft or Publish. Otherwise just Save. */}
          {formData.status !== undefined || isNew ? (
            <>
              <Button 
                type="button" 
                variant="outline" 
                disabled={isSubmitting}
                onClick={(e) => handleSubmit(e, "draft")}
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
