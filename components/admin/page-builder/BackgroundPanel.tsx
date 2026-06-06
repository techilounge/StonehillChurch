"use client";

import * as React from "react";
import { Button } from "@/components/shared/Button";
import { SelectInput } from "@/components/forms/SelectInput";
import { TextInput } from "@/components/forms/TextInput";
import { MediaSelectorDialog } from "@/components/admin/media/MediaSelectorDialog";
import { InspectorLabel } from "./InspectorLabel";
import type { BackgroundType, SectionStyle } from "@/types/pageBuilder";

interface BackgroundPanelProps {
  value: SectionStyle | undefined;
  onChange: (style: SectionStyle) => void;
}

const POSITIONS = [
  "center center",
  "top center",
  "bottom center",
  "left center",
  "right center",
  "top left",
  "top right",
  "bottom left",
  "bottom right",
] as const;

const COLOR_SWATCHES = [
  { value: "#ffffff", label: "White" },
  { value: "#fbfaf6", label: "Cream" },
  { value: "#1e3f66", label: "Navy" },
  { value: "#1c6b8d", label: "Blue" },
  { value: "#8eb5c7", label: "Light Blue" },
  { value: "#e7ab10", label: "Gold" },
];

const TYPE_OPTIONS: { value: BackgroundType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "color", label: "Color" },
  { value: "image", label: "Image" },
  { value: "gradient", label: "Gradient" },
];

const DEFAULT_GRADIENT = { from: "#1e3f66", to: "#1c6b8d", angle: 135 };

function inferType(style: SectionStyle | undefined): BackgroundType {
  if (style?.backgroundType) return style.backgroundType;
  if (style?.backgroundGradient) return "gradient";
  if (style?.backgroundImage) return "image";
  if (style?.backgroundColor) return "color";
  return "none";
}

export function BackgroundPanel({ value, onChange }: BackgroundPanelProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const style = value ?? {};
  const activeType = inferType(style);

  const update = (patch: Partial<SectionStyle>) => onChange({ ...style, ...patch });

  // Switching types clears the inactive variants so the renderer + sanitizer
  // never see conflicting data.
  const setType = (next: BackgroundType) => {
    if (next === "none") {
      onChange({
        ...style,
        backgroundType: "none",
        backgroundColor: undefined,
        backgroundImage: undefined,
        backgroundGradient: undefined,
        backgroundPosition: undefined,
        backgroundSize: undefined,
        backgroundRepeat: undefined,
        backgroundAttachment: undefined,
        overlayColor: undefined,
        overlayOpacity: undefined,
      });
      return;
    }
    if (next === "color") {
      onChange({
        ...style,
        backgroundType: "color",
        backgroundImage: undefined,
        backgroundGradient: undefined,
        backgroundPosition: undefined,
        backgroundSize: undefined,
        backgroundRepeat: undefined,
        backgroundAttachment: undefined,
        overlayColor: undefined,
        overlayOpacity: undefined,
        backgroundColor: style.backgroundColor ?? "#fbfaf6",
      });
      return;
    }
    if (next === "image") {
      onChange({
        ...style,
        backgroundType: "image",
        backgroundColor: undefined,
        backgroundGradient: undefined,
      });
      return;
    }
    if (next === "gradient") {
      onChange({
        ...style,
        backgroundType: "gradient",
        backgroundColor: undefined,
        backgroundImage: undefined,
        backgroundPosition: undefined,
        backgroundSize: undefined,
        backgroundRepeat: undefined,
        backgroundAttachment: undefined,
        overlayColor: undefined,
        overlayOpacity: undefined,
        backgroundGradient: style.backgroundGradient ?? DEFAULT_GRADIENT,
      });
    }
  };

  const hasImage = activeType === "image" && !!style.backgroundImage;
  const overlayOn = typeof style.overlayOpacity === "number" && style.overlayOpacity > 0;
  const gradient = style.backgroundGradient ?? DEFAULT_GRADIENT;

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="space-y-1.5">
        <InspectorLabel tooltip="Pick how this section/row is filled. None = transparent. Color = solid swatch. Image = photo with optional overlay. Gradient = two-color linear blend.">
          Background
        </InspectorLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`px-2 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                activeType === opt.value
                  ? "border-stonehill-accent bg-white text-slate-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {activeType === "color" && (
        <div className="space-y-1.5">
          <InspectorLabel tooltip="Solid color for the section. Pick a brand swatch or paste any hex value.">
            Color
          </InspectorLabel>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => update({ backgroundColor: c.value })}
                title={c.label}
                aria-label={c.label}
                className={`w-7 h-7 rounded border transition-all ${
                  style.backgroundColor === c.value
                    ? "border-stonehill-accent ring-2 ring-stonehill-accent ring-offset-1"
                    : "border-slate-200 hover:scale-105"
                }`}
                style={{ backgroundColor: c.value }}
              />
            ))}
            <input
              type="color"
              value={style.backgroundColor && /^#[0-9a-fA-F]{6}$/.test(style.backgroundColor) ? style.backgroundColor : "#ffffff"}
              onChange={(e) => update({ backgroundColor: e.target.value })}
              className="h-8 w-10 rounded border border-slate-200 cursor-pointer bg-white"
              aria-label="Custom color"
            />
          </div>
        </div>
      )}

      {activeType === "image" && (
        <>
          <div className="flex gap-2">
            <TextInput
              value={style.backgroundImage || ""}
              onChange={(e) => update({ backgroundImage: e.target.value || undefined })}
              placeholder="Image URL"
              className="flex-1"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
              Browse
            </Button>
          </div>

          {hasImage && (
            <>
              <div
                className="h-20 w-full rounded border border-slate-200 bg-slate-100"
                style={{
                  backgroundImage: `url(${style.backgroundImage})`,
                  backgroundSize: style.backgroundSize ?? "cover",
                  backgroundPosition: style.backgroundPosition ?? "center center",
                  backgroundRepeat: style.backgroundRepeat ?? "no-repeat",
                }}
                aria-hidden="true"
              />

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <InspectorLabel tooltip="Which part of the image stays anchored when the section is cropped on smaller screens.">Position</InspectorLabel>
                  <SelectInput
                    value={style.backgroundPosition ?? "center center"}
                    onChange={(e) => update({ backgroundPosition: e.target.value as any })}
                  >
                    {POSITIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </SelectInput>
                </div>

                <div className="space-y-1">
                  <InspectorLabel popover="How the image fills the section.\n\n• Cover — fills, crops overflow (most common)\n• Contain — fits entirely inside, may leave empty space\n• Auto — uses the image's natural size">Size</InspectorLabel>
                  <SelectInput
                    value={style.backgroundSize ?? "cover"}
                    onChange={(e) => update({ backgroundSize: e.target.value as any })}
                  >
                    <option value="cover">Cover</option>
                    <option value="contain">Contain</option>
                    <option value="auto">Auto</option>
                  </SelectInput>
                </div>

                <div className="space-y-1">
                  <InspectorLabel tooltip="Tile the image when it doesn't fill the section. Usually No Repeat for photos.">Repeat</InspectorLabel>
                  <SelectInput
                    value={style.backgroundRepeat ?? "no-repeat"}
                    onChange={(e) => update({ backgroundRepeat: e.target.value as any })}
                  >
                    <option value="no-repeat">No Repeat</option>
                    <option value="repeat">Repeat</option>
                    <option value="repeat-x">Repeat X</option>
                    <option value="repeat-y">Repeat Y</option>
                  </SelectInput>
                </div>

                <div className="space-y-1">
                  <InspectorLabel tooltip="Fixed creates a parallax effect: the image stays anchored while the page scrolls past it. Disabled on most mobile browsers.">Attachment</InspectorLabel>
                  <SelectInput
                    value={style.backgroundAttachment ?? "scroll"}
                    onChange={(e) => update({ backgroundAttachment: e.target.value as any })}
                  >
                    <option value="scroll">Scroll</option>
                    <option value="fixed">Fixed (parallax)</option>
                  </SelectInput>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <InspectorLabel tooltip="A solid color layered on top of the image so text stays readable. Set opacity to 0 to disable.">Overlay</InspectorLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={style.overlayColor ?? "#000000"}
                    onChange={(e) => update({ overlayColor: e.target.value })}
                    className="h-8 w-12 rounded border border-slate-200 cursor-pointer bg-white"
                    aria-label="Overlay color"
                  />
                  <span className="text-xs text-slate-600 w-16">{style.overlayColor ?? "#000000"}</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round((style.overlayOpacity ?? 0) * 100)}
                    onChange={(e) =>
                      update({ overlayOpacity: Math.max(0, Math.min(1, Number(e.target.value) / 100)) })
                    }
                    className="flex-1 accent-stonehill-accent"
                    aria-label="Overlay opacity"
                  />
                  <span className="text-xs text-slate-600 w-10 text-right">
                    {Math.round((style.overlayOpacity ?? 0) * 100)}%
                  </span>
                </div>
                {overlayOn && (
                  <div
                    className="h-6 w-full rounded"
                    style={{ backgroundColor: style.overlayColor ?? "#000000", opacity: style.overlayOpacity }}
                    aria-hidden="true"
                  />
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeType === "gradient" && (
        <div className="space-y-2">
          <div
            className="h-20 w-full rounded border border-slate-200"
            style={{ background: `linear-gradient(${gradient.angle}deg, ${gradient.from}, ${gradient.to})` }}
            aria-hidden="true"
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <InspectorLabel tooltip="Starting color of the gradient.">From</InspectorLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradient.from}
                  onChange={(e) => update({ backgroundGradient: { ...gradient, from: e.target.value } })}
                  className="h-8 w-12 rounded border border-slate-200 cursor-pointer bg-white"
                  aria-label="Gradient from color"
                />
                <span className="text-xs text-slate-600">{gradient.from}</span>
              </div>
            </div>
            <div className="space-y-1">
              <InspectorLabel tooltip="Ending color of the gradient.">To</InspectorLabel>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={gradient.to}
                  onChange={(e) => update({ backgroundGradient: { ...gradient, to: e.target.value } })}
                  className="h-8 w-12 rounded border border-slate-200 cursor-pointer bg-white"
                  aria-label="Gradient to color"
                />
                <span className="text-xs text-slate-600">{gradient.to}</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <InspectorLabel tooltip="Angle of the gradient in degrees. 0° = top to bottom, 90° = left to right, 135° = top-left to bottom-right.">
              Angle ({gradient.angle}°)
            </InspectorLabel>
            <input
              type="range"
              min={0}
              max={360}
              step={5}
              value={gradient.angle}
              onChange={(e) =>
                update({ backgroundGradient: { ...gradient, angle: Number(e.target.value) } })
              }
              className="w-full accent-stonehill-accent"
              aria-label="Gradient angle"
            />
          </div>
        </div>
      )}

      <MediaSelectorDialog
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(url) => {
          update({ backgroundImage: url });
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
