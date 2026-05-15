"use client";

import * as React from "react";
import Image from "next/image";
import { UploadCloud, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/shared/Button";

interface ImageUploadFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  defaultAltText: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "2 MB";

export function ImageUploadField({
  label,
  description,
  value,
  onChange,
  disabled,
  defaultAltText,
}: ImageUploadFieldProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type as any)) {
      setError("Only JPG, JPEG, PNG, and WEBP images are supported.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError(`Image is too large. Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`);
      return;
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", defaultAltText);

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }

      // The API returns the uploaded asset data
      const url = data.data.asset?.url;
      if (url) {
        onChange(url);
      } else {
        throw new Error("Failed to retrieve image URL.");
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Network error. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-900">{label}</label>
      {description && <p className="text-xs text-slate-500">{description}</p>}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {value ? (
        <div className="relative inline-flex items-center justify-center p-4 border border-slate-200 rounded-lg bg-slate-50">
          <div className="relative h-20 w-40">
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={disabled || isUploading}
            className="absolute -top-2 -right-2 bg-white rounded-full text-slate-400 hover:text-red-500 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-stonehill-accent"
            title="Remove Image"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            disabled || isUploading
              ? "border-slate-200 bg-slate-50 opacity-75 cursor-not-allowed"
              : "border-slate-200 hover:border-stonehill-accent hover:bg-slate-50/10 cursor-pointer"
          }`}
          onClick={() => {
            if (!disabled && !isUploading) fileInputRef.current?.click();
          }}
        >
          <input
            type="file"
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={disabled || isUploading}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            {isUploading ? (
              <>
                <Loader2 className="h-8 w-8 text-stonehill-primary animate-spin" />
                <span className="text-sm font-medium text-slate-900">Uploading...</span>
              </>
            ) : (
              <>
                <UploadCloud className="h-8 w-8 text-slate-900/40" />
                <div className="text-slate-900 text-sm">
                  <span className="font-medium">Click to browse</span>
                  <span className="text-slate-900/60 block mt-1 text-xs">
                    JPG, PNG, or WEBP (max {MAX_FILE_SIZE_LABEL})
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
