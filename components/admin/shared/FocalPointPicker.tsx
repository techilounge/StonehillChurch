"use client";

import * as React from "react";
import { SelectInput } from "@/components/forms/SelectInput";
import { getAutoFocalPoint } from "@/lib/mediaHandling";

interface FocalPointPickerProps {
  imageUrl: string;
  focalPointX?: number;
  focalPointY?: number;
  focalPointAuto?: boolean;
  aspectRatio?: string;
  defaultAspectRatio?: string;
  onChange: (updates: {
    focalPointX?: number;
    focalPointY?: number;
    focalPointAuto?: boolean;
    aspectRatio?: string;
  }) => void;
}

export function FocalPointPicker({
  imageUrl,
  focalPointX,
  focalPointY,
  focalPointAuto,
  aspectRatio = "default",
  defaultAspectRatio = "auto",
  onChange,
}: FocalPointPickerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Compute active coordinates
  const isAuto = focalPointAuto !== false;
  let activeX = 50;
  let activeY = 50;

  if (typeof focalPointX === "number" && typeof focalPointY === "number" && !isAuto) {
    activeX = focalPointX;
    activeY = focalPointY;
  } else {
    const autoPt = getAutoFocalPoint(imageUrl);
    activeX = autoPt.x;
    activeY = autoPt.y;
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRaw = e.clientX - rect.left;
    const yRaw = e.clientY - rect.top;

    // Convert to percentages (0..100)
    const x = Math.round((xRaw / rect.width) * 100);
    const y = Math.round((yRaw / rect.height) * 100);

    // Clamp coordinates
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    onChange({
      focalPointX: clampedX,
      focalPointY: clampedY,
      focalPointAuto: false,
    });
  };

  const handleReset = () => {
    const autoPt = getAutoFocalPoint(imageUrl);
    onChange({
      focalPointX: autoPt.x,
      focalPointY: autoPt.y,
      focalPointAuto: true,
    });
  };

  // Determine active aspect ratio for the crop preview
  const activeRatio = aspectRatio === "default" ? defaultAspectRatio : aspectRatio;
  
  // Map standard string ratio (e.g. "16:9") to CSS aspect-ratio values
  let cssAspectRatio = "auto";
  if (activeRatio && activeRatio !== "auto") {
    const parts = activeRatio.split(":");
    if (parts.length === 2) {
      cssAspectRatio = `${parts[0]} / ${parts[1]}`;
    }
  }

  return (
    <div className="space-y-4 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Crop & Focal Point</span>
        <button
          type="button"
          onClick={handleReset}
          disabled={isAuto}
          className="text-xs font-semibold text-stonehill-accent hover:underline disabled:opacity-40"
        >
          Reset to Auto-Detect
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Selector Panel */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            1. Set Focus Subject (Click image)
          </label>
          <div
            ref={containerRef}
            onClick={handleImageClick}
            className="relative w-full h-44 rounded-lg overflow-hidden cursor-crosshair border border-slate-200 bg-slate-100 flex items-center justify-center select-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Focal point editor"
              className="w-full h-full object-contain pointer-events-none"
            />
            {/* Focal Point Indicator Target */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
              style={{ left: `${activeX}%`, top: `${activeY}%` }}
            >
              {/* Target Crosshair */}
              <div className="w-6 h-6 rounded-full border-2 border-stonehill-accent ring-2 ring-white bg-black/25 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-stonehill-accent"></div>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between font-mono">
            <span>Focal Area: {isAuto ? "Auto Subject" : "Manual Subject"}</span>
            <span>X: {activeX}%, Y: {activeY}%</span>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            2. Live Crop Preview
          </label>
          <div className="w-full h-44 border border-slate-200 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden p-2">
            <div
              className="w-full max-w-full max-h-full overflow-hidden rounded shadow-sm relative bg-slate-200"
              style={{
                aspectRatio: cssAspectRatio,
                height: cssAspectRatio === "auto" ? "100%" : undefined,
                width: cssAspectRatio !== "auto" ? "100%" : undefined,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Crop preview"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: `${activeX}% ${activeY}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Aspect Ratio Selector */}
      <div className="space-y-1.5 pt-2 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-800">Aspect Ratio Override</label>
        <SelectInput
          value={aspectRatio}
          onChange={(e) => onChange({ aspectRatio: e.target.value })}
        >
          <option value="default">Default ({defaultAspectRatio === "auto" ? "Original Ratio" : defaultAspectRatio})</option>
          <option value="auto">Auto (Original ratio / no crop)</option>
          <option value="16:9">16:9 (Wide hero banner)</option>
          <option value="4:3">4:3 (Standard photo)</option>
          <option value="1:1">1:1 (Square thumbnail)</option>
        </SelectInput>
      </div>
    </div>
  );
}
