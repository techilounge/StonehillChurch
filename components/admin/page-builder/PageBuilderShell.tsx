"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Globe, AlertCircle, Settings, Eye } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { TextInput } from "@/components/forms/TextInput";
import { TextArea } from "@/components/forms/TextArea";
import { SelectInput } from "@/components/forms/SelectInput";
import { createDocumentAction, updateDocumentAction } from "@/app/admin/cms/actions";
import { PageContent } from "@/types/content";
import { PUBLISHED } from "@/types/shared";
import { PageBuilderProvider, usePageBuilder } from "./PageBuilderContext";
import { BuilderCanvas } from "./BuilderCanvas";
import { BuilderInspector } from "./BuilderInspector";
import { PageBuilderRenderer } from "@/components/shared/page-builder/PageBuilderRenderer";
import { getUnsafeUrlsInDocument, sanitizeDocumentStyles } from "@/lib/pageBuilderSafety";

interface PageBuilderShellProps {
  initialData: (PageContent & { id?: string }) | null;
  canPublish: boolean;
}

export function PageBuilderShell({ initialData, canPublish }: PageBuilderShellProps) {
  const defaultData: Partial<PageContent> = {
    title: "",
    slug: "",
    content: "",
    seoTitle: "",
    seoDescription: "",
    status: "draft",
    builderData: {
      version: "1.0",
      sections: [],
    },
  };

  return (
    <PageBuilderProvider initialData={initialData || defaultData}>
      <PageBuilderEditor isNew={!initialData} canPublish={canPublish} initialData={initialData} />
    </PageBuilderProvider>
  );
}

function PageBuilderEditor({ isNew, canPublish, initialData }: { isNew: boolean; canPublish: boolean; initialData: (PageContent & { id?: string }) | null }) {
  const router = useRouter();
  const { formData, setFormData } = usePageBuilder();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);

  const handleFieldChange = (name: keyof PageContent, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent, forceStatus?: string) => {
    e.preventDefault();
    setIsSubmitting(true);
    setServerError(null);
    setFieldErrors({});

    const sections = formData.builderData?.sections || [];
    
    // Scan document for unsafe URLs
    const unsafeUrls = getUnsafeUrlsInDocument(sections);
    if (unsafeUrls.length > 0) {
      setServerError(
        `Submission blocked. The following unsafe URLs were detected. Please correct them in the inspector:\n\n` + 
        unsafeUrls.map(err => `• ${err}`).join("\n")
      );
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Sanitize document styles before save
    const sanitizedSections = sanitizeDocumentStyles(sections);

    const payload = { 
      ...formData,
      builderData: {
        ...formData.builderData,
        sections: sanitizedSections
      }
    };
    
    if (forceStatus) {
      payload.status = forceStatus as any;
    }

    try {
      const response = isNew
        ? await createDocumentAction("pages", payload)
        : await updateDocumentAction("pages", initialData!.id!, payload);

      if (response.ok) {
        router.push(`/admin/pages`);
        router.refresh();
      } else {
        setServerError(response.error.message || "Failed to save page.");
        if (response.error.fieldErrors) {
          setFieldErrors(response.error.fieldErrors);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err: any) {
      setServerError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50 -m-6 sm:-m-8">
      {/* Top Action Bar */}
      <header className="flex-none h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/pages`)} className="shrink-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <h1 className="text-lg font-bold text-slate-900 hidden sm:block">
            {isNew ? "New Page" : formData.title || "Untitled Page"}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => setIsPreviewMode(true)}>
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, "draft")}
          >
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Save Draft</span>
          </Button>
          {canPublish && (
            <Button 
              type="button" 
              variant="primary" 
              size="sm"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, PUBLISHED)}
            >
              <Globe className="h-4 w-4 mr-2" />
              {isNew ? "Publish" : "Save & Publish"}
            </Button>
          )}
        </div>
      </header>

      {serverError && (
        <div className="m-4 flex items-start gap-2 p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <div className="whitespace-pre-line">{serverError}</div>
            {Object.keys(fieldErrors).length > 0 && (
              <ul className="mt-1 list-disc list-inside space-y-0.5 text-red-700/90">
                {Object.entries(fieldErrors).map(([field, messages]) => (
                  <li key={field}>
                    <span className="font-semibold">{field}</span>: {messages.join("; ")}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Center Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-8 pb-32">
            
            {/* Metadata Panel */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Settings className="h-4 w-4 text-slate-500" />
                <h2 className="font-semibold text-slate-900 text-sm">Page Settings</h2>
              </div>
              <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-900">Page Title *</label>
                  <TextInput 
                    value={formData.title || ""} 
                    onChange={(e) => handleFieldChange("title", e.target.value)} 
                    placeholder="e.g. Our Beliefs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-900">URL Slug *</label>
                  <TextInput 
                    value={formData.slug || ""} 
                    onChange={(e) => handleFieldChange("slug", e.target.value)} 
                    placeholder="e.g. our-beliefs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-900">SEO Title</label>
                  <TextInput
                    value={formData.seoTitle || ""}
                    onChange={(e) => handleFieldChange("seoTitle", e.target.value)}
                  />
                  <CharCounter value={formData.seoTitle || ""} limit={70} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-900">Status</label>
                  <SelectInput 
                    value={formData.status || "draft"} 
                    onChange={(e) => handleFieldChange("status", e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </SelectInput>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-900">SEO Description</label>
                  <TextArea
                    value={formData.seoDescription || ""}
                    onChange={(e) => handleFieldChange("seoDescription", e.target.value)}
                    rows={2}
                  />
                  <CharCounter value={formData.seoDescription || ""} limit={160} />
                </div>
                <div className="md:col-span-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <input
                      type="checkbox"
                      checked={!!formData.heroEnabled}
                      onChange={(e) => handleFieldChange("heroEnabled", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
                    />
                    Show page hero banner
                  </label>
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    Adds the dark-navy banner with the Page Title in white, matching pages like <code>/our-beliefs</code> and <code>/about</code>.
                  </p>
                  {formData.heroEnabled && (
                    <div className="mt-3 ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Subtitle (handwritten gold)</label>
                        <TextInput
                          value={formData.heroSubtitle || ""}
                          onChange={(e) => handleFieldChange("heroSubtitle", e.target.value)}
                          placeholder="e.g. What we believe about God, humanity, and salvation."
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Background image URL (optional)</label>
                        <TextInput
                          value={formData.heroImageUrl || ""}
                          onChange={(e) => handleFieldChange("heroImageUrl", e.target.value)}
                          placeholder="https://… (a dark overlay is added automatically)"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <input
                      type="checkbox"
                      checked={!!formData.backLinkEnabled}
                      onChange={(e) => handleFieldChange("backLinkEnabled", e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-stonehill-accent focus:ring-stonehill-accent"
                    />
                    Show a Back link at the top of the page
                  </label>
                  <p className="text-xs text-slate-500 mt-1 ml-6">
                    Adds a small &ldquo;← {formData.backLinkLabel || "Back to Home"}&rdquo; link above the page content, matching pages like <code>/resources</code>.
                  </p>
                  {formData.backLinkEnabled && (
                    <div className="mt-3 ml-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Label</label>
                        <TextInput
                          value={formData.backLinkLabel || ""}
                          onChange={(e) => handleFieldChange("backLinkLabel", e.target.value)}
                          placeholder="Back to Home"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Link URL</label>
                        <TextInput
                          value={formData.backLinkHref || ""}
                          onChange={(e) => handleFieldChange("backLinkHref", e.target.value)}
                          placeholder="/"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Builder Canvas Component */}
            <BuilderCanvas />

          </div>
        </div>

        {/* Right Inspector Panel */}
        <BuilderInspector />
      </div>

      {/* Full-screen Preview Overlay */}
      {isPreviewMode && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden">
          <div className="flex-none h-16 bg-slate-900 text-white px-6 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-slate-300" />
              <h2 className="font-semibold">Preview Mode</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsPreviewMode(false)} className="border-slate-600 text-slate-200 hover:bg-slate-800 hover:text-white">
              Close Preview
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {formData.builderData ? (
              <PageBuilderRenderer document={formData.builderData} />
            ) : (
              <div className="p-8 text-center text-slate-500">No builder data to preview.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tiny inline counter that mirrors the SEO-description counter in the generic
 * CmsModuleForm. Goes amber within 10 % of the limit, red when over — so the
 * length cap is visible *before* the server rejects the save with a generic
 * "CMS update data is invalid." message.
 */
function CharCounter({ value, limit }: { value: string; limit: number }) {
  const length = value.length;
  const remaining = limit - length;
  const isOver = length > limit;
  const isWarning = !isOver && length >= limit * 0.9;
  const colorClass = isOver
    ? "text-red-600 font-semibold"
    : isWarning
      ? "text-amber-600 font-semibold"
      : "text-slate-500";
  return (
    <div className={`text-xs mt-1 transition-colors ${colorClass}`}>
      {length} / {limit} characters used
      {" "}
      ({remaining >= 0 ? `${remaining} remaining` : `${Math.abs(remaining)} over limit`})
    </div>
  );
}
