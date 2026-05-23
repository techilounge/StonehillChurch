"use client";

import * as React from "react";
import { X, Globe, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { TextInput } from "@/components/forms/TextInput";
import type { MenuItem } from "@/types/menus";

interface PageOption {
  slug: string;
  title: string;
}

interface MenuItemFormProps {
  /** When editing, the existing item. Null for new items. */
  editingItem: MenuItem | null;
  pages: PageOption[];
  onSave: (item: MenuItem) => void;
  onCancel: () => void;
}

function generateId(): string {
  return crypto.randomUUID().slice(0, 12);
}

export function MenuItemForm({ editingItem, pages, onSave, onCancel }: MenuItemFormProps) {
  const [linkType, setLinkType] = React.useState<"internal" | "external">(
    editingItem
      ? editingItem.url.startsWith("/") && pages.some((p) => `/${p.slug}` === editingItem.url)
        ? "internal"
        : "external"
      : "internal",
  );
  const [label, setLabel] = React.useState(editingItem?.label ?? "");
  const [url, setUrl] = React.useState(editingItem?.url ?? "");
  const [selectedSlug, setSelectedSlug] = React.useState(
    editingItem?.url.startsWith("/") ? editingItem.url.slice(1) : "",
  );
  const [openInNewTab, setOpenInNewTab] = React.useState(editingItem?.openInNewTab ?? false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // Auto-fill label when selecting an internal page
  const handlePageSelect = (slug: string) => {
    setSelectedSlug(slug);
    setUrl(`/${slug}`);
    const page = pages.find((p) => p.slug === slug);
    if (page && !label.trim()) {
      setLabel(page.title);
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!label.trim()) next.label = "Label is required.";
    if (linkType === "internal" && !selectedSlug) next.url = "Please select a page.";
    if (linkType === "external") {
      if (!url.trim()) {
        next.url = "URL is required.";
      } else if (!url.startsWith("/") && !url.startsWith("http://") && !url.startsWith("https://")) {
        next.url = "URL must start with '/', 'http://', or 'https://'.";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: editingItem?.id ?? generateId(),
      label: label.trim(),
      url: linkType === "internal" ? `/${selectedSlug}` : url.trim(),
      openInNewTab,
      children: editingItem?.children ?? [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            {editingItem ? "Edit Menu Item" : "Add Menu Item"}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Link Type Toggle */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Link Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setLinkType("internal"); setUrl(""); setErrors({}); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  linkType === "internal"
                    ? "border-stonehill-primary bg-stonehill-primary/5 text-stonehill-primary"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <FileText className="h-4 w-4" />
                Internal Page
              </button>
              <button
                type="button"
                onClick={() => { setLinkType("external"); setSelectedSlug(""); setErrors({}); }}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  linkType === "external"
                    ? "border-stonehill-primary bg-stonehill-primary/5 text-stonehill-primary"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <Globe className="h-4 w-4" />
                External URL
              </button>
            </div>
          </div>

          {/* Internal Page Selector */}
          {linkType === "internal" && (
            <div>
              <label htmlFor="menu-page-select" className="text-sm font-medium text-slate-700 mb-1 block">
                Select Page
              </label>
              <select
                id="menu-page-select"
                value={selectedSlug}
                onChange={(e) => handlePageSelect(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stonehill-accent focus:border-transparent transition-colors ${
                  errors.url ? "border-red-300 bg-red-50" : "border-slate-300 bg-white"
                }`}
              >
                <option value="">— Choose a page —</option>
                {pages.map((page) => (
                  <option key={page.slug} value={page.slug}>
                    {page.title} (/{page.slug})
                  </option>
                ))}
              </select>
              {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
            </div>
          )}

          {/* External URL Input */}
          {linkType === "external" && (
            <div>
              <label htmlFor="menu-url-input" className="text-sm font-medium text-slate-700 mb-1 block">
                URL
              </label>
              <TextInput
                id="menu-url-input"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setErrors((prev) => ({ ...prev, url: "" })); }}
                placeholder="https://example.com or /custom-path"
                className={errors.url ? "border-red-300 bg-red-50" : ""}
              />
              {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
            </div>
          )}

          {/* Label */}
          <div>
            <label htmlFor="menu-label-input" className="text-sm font-medium text-slate-700 mb-1 block">
              Menu Label
            </label>
            <TextInput
              id="menu-label-input"
              value={label}
              onChange={(e) => { setLabel(e.target.value); setErrors((prev) => ({ ...prev, label: "" })); }}
              placeholder="e.g. About Us"
              className={errors.label ? "border-red-300 bg-red-50" : ""}
            />
            {errors.label && <p className="mt-1 text-xs text-red-600">{errors.label}</p>}
          </div>

          {/* Open in New Tab */}
          <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-700">Open in new tab</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={openInNewTab}
              onClick={() => setOpenInNewTab(!openInNewTab)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 ${
                openInNewTab ? "bg-stonehill-primary" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  openInNewTab ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
