"use client";

import * as React from "react";
import { UploadCloud, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { TextInput } from "@/components/forms/TextInput";
import { Card, CardContent } from "@/components/shared/Card";

interface MediaUploadPanelProps {
  onUploadSuccess: () => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

export function MediaUploadPanel({ onUploadSuccess }: MediaUploadPanelProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [altText, setAltText] = React.useState("");
  const [status, setStatus] = React.useState<UploadState>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus("idle");
      setErrorMessage(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
        setStatus("idle");
        setErrorMessage(null);
      } else {
        setStatus("error");
        setErrorMessage("Only JPG, PNG, and WEBP images are supported.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setStatus("error");
      setErrorMessage("Please select a file to upload.");
      return;
    }
    if (altText.trim().length < 8) {
      setStatus("error");
      setErrorMessage("Alt text must be at least 8 characters.");
      return;
    }

    setStatus("uploading");
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", altText.trim());

    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }

      setStatus("success");
      setFile(null);
      setAltText("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onUploadSuccess();
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setStatus((prev) => (prev === "success" ? "idle" : prev));
      }, 3000);
      
    } catch (error: any) {
      console.error("Upload error:", error);
      setStatus("error");
      setErrorMessage(error.message || "Network error. Please try again.");
    }
  };

  return (
    <Card className="border-stonehill-line shadow-sm overflow-hidden bg-white">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-stonehill-ink mb-4">Upload New Media</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              file ? "border-stonehill-evergreen bg-stonehill-cream/30" : "border-stonehill-line hover:border-stonehill-gold hover:bg-stonehill-cream/10"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={status === "uploading"}
            />
            <div className="flex flex-col items-center justify-center space-y-3">
              {file ? (
                <>
                  <CheckCircle className="h-10 w-10 text-stonehill-evergreen" />
                  <div className="text-stonehill-ink">
                    <span className="font-medium text-stonehill-evergreen">{file.name}</span>
                    <span className="text-stonehill-ink/60 text-sm block mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <UploadCloud className="h-10 w-10 text-stonehill-ink/40" />
                  <div className="text-stonehill-ink">
                    <span className="font-medium">Click to browse</span> or drag and drop
                    <span className="text-stonehill-ink/60 text-sm block mt-1">
                      JPG, PNG, or WEBP (max 12MB)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="altText" className="block text-sm font-medium text-stonehill-ink">
              Alt Text (Required)
            </label>
            <p className="text-xs text-stonehill-ink/60">
              Good alt text is concise and describes what the image shows. Required for accessibility.
            </p>
            <TextInput
              id="altText"
              name="altText"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              disabled={status === "uploading"}
              placeholder="Describe the image for screen readers..."
              required
              maxLength={200}
            />
          </div>

          {status === "error" && errorMessage && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-md text-sm border border-green-200">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <p>Image uploaded, compressed, and saved successfully!</p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={!file || altText.trim().length < 8 || status === "uploading"}
            >
              {status === "uploading" ? "Uploading & Compressing..." : "Upload Asset"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
