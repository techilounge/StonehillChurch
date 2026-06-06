"use client";

import * as React from "react";
import { Button } from "@/components/shared/Button";
import { SelectInput } from "@/components/forms/SelectInput";
import { TextInput } from "@/components/forms/TextInput";
import { MediaSelectorDialog } from "@/components/admin/media/MediaSelectorDialog";
import { InspectorLabel } from "./InspectorLabel";
import type { SectionStyle } from "@/types/pageBuilder";

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

export function BackgroundPanel({ value, onChange }: BackgroundPanelProps) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const style = value ?? {};

  const update = (patch: Partial<SectionStyle>) => onChange({ ...style, ...patch });
  const hasImage = typeof style.backgroundImage === "string" && style.backgroundImage.length > 0;
  const overlayOn = typeof style.overlayOpacity === "number" && style.overlayOpacity > 0;

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <InspectorLabel tooltip="A background photo for this section/row. The image fits behind all content; use the overlay below to darken it so text stays readable.">
          Background Image
        </InspectorLabel>
        {hasImage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              update({
                backgroundImage: undefined,
                backgroundPosition: undefined,
                backgroundSize: undefined,
                backgroundRepeat: undefined,
                backgroundAttachment: undefined,
                overlayColor: undefined,
                overlayOpacity: undefined,
              })
            }
          >
            Clear
          </Button>
        )}
      </div>

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
              <InspectorLabel tooltip="Which part of the image stays anchored when the section is cropped on smaller screens.">
                Position
              </InspectorLabel>
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
              <InspectorLabel popover="How the image fills the section.\n\n• Cover — fills the whole section, crops the overflow (most common)\n• Contain — fits the entire image inside, may leave empty space\n• Auto — uses the image's natural size">
                Size
              </InspectorLabel>
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
              <InspectorLabel tooltip="Tile the image when it doesn't fill the section. Usually No Repeat for photos; the tile options are for patterns/textures.">
                Repeat
              </InspectorLabel>
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
              <InspectorLabel tooltip="Fixed creates a parallax effect: the image stays anchored while the page scrolls past it. Disabled on most mobile browsers.">
                Attachment
              </InspectorLabel>
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
            <InspectorLabel tooltip="A solid color layered on top of the image so text stays readable. Set opacity to 0 to disable.">
              Overlay
            </InspectorLabel>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={style.overlayColor ?? "#000000"}
                onChange={(e) => update({ overlayColor: e.target.value })}
                className="h-8 w-12 rounded border border-slate-200 cursor-pointer bg-white"
                aria-label="Overlay color"
              />
              <span className="text-xs text-slate-600 w-16">
                {style.overlayColor ?? "#000000"}
              </span>
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
                style={{
                  backgroundColor: style.overlayColor ?? "#000000",
                  opacity: style.overlayOpacity,
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </>
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
