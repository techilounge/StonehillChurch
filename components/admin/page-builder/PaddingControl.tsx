"use client";

import * as React from "react";
import { Link2, Unlink2, RotateCcw } from "lucide-react";
import { TextInput } from "@/components/forms/TextInput";
import { SelectInput } from "@/components/forms/SelectInput";
import { InspectorLabel } from "./InspectorLabel";
import type { PaddingUnit, StructuredPadding } from "@/types/pageBuilder";

interface PaddingControlProps {
  value: StructuredPadding | undefined;
  onChange: (next: StructuredPadding | undefined) => void;
  /** Optional default when admin clicks the master "Reset" button. Per-side reset is always 0. */
  defaultValue?: StructuredPadding;
  /** Inspector label. Defaults to "Padding". */
  label?: string;
  /** Optional tooltip shown next to the label. */
  tooltip?: string;
}

const ZERO: StructuredPadding = { top: 0, right: 0, bottom: 0, left: 0, unit: "px" };

type Side = "top" | "right" | "bottom" | "left";

export function PaddingControl({
  value,
  onChange,
  defaultValue,
  label = "Padding",
  tooltip,
}: PaddingControlProps) {
  // Hydrate from value or fall back to zero, preserving the original linked flag.
  const current: StructuredPadding = value ?? defaultValue ?? ZERO;
  const linked = current.linked === true;
  const unit: PaddingUnit = current.unit ?? "px";

  const emit = (next: StructuredPadding) => {
    const isZero = next.top === 0 && next.right === 0 && next.bottom === 0 && next.left === 0;
    // Wipe the whole field when everything is zero AND unlinked so the doc
    // doesn't accumulate a useless object — but only when there's no value
    // worth preserving (linked + 0 isn't useful either).
    if (isZero && !next.linked) {
      onChange(undefined);
      return;
    }
    onChange(next);
  };

  const setSide = (side: Side, raw: string) => {
    const parsed = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(parsed)) return;
    const n = Math.max(0, Math.min(500, parsed));
    if (linked) {
      emit({ top: n, right: n, bottom: n, left: n, unit, linked: true });
    } else {
      emit({ ...current, [side]: n, unit });
    }
  };

  const toggleLinked = () => {
    if (linked) {
      emit({ ...current, linked: false, unit });
    } else {
      // When linking, snap all four sides to the current top value so the
      // four inputs immediately match what the user sees.
      const t = current.top;
      emit({ top: t, right: t, bottom: t, left: t, unit, linked: true });
    }
  };

  const setUnit = (next: PaddingUnit) => {
    emit({ ...current, unit: next });
  };

  const resetAll = () => {
    if (defaultValue) {
      emit({ ...defaultValue, linked: defaultValue.linked === true });
    } else {
      onChange(undefined);
    }
  };

  const sideInput = (side: Side, srLabel: string) => (
    <label className="flex items-center gap-1.5 text-xs text-slate-600">
      <span className="w-3 font-semibold text-slate-500" aria-hidden="true">
        {srLabel[0]}
      </span>
      <span className="sr-only">{srLabel}</span>
      <TextInput
        type="number"
        min={0}
        max={500}
        value={String(current[side])}
        onChange={(e) => setSide(side, e.target.value)}
        className="w-full text-center"
      />
    </label>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <InspectorLabel tooltip={tooltip}>{label}</InspectorLabel>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleLinked}
            title={linked ? "Unlink sides — edit each independently" : "Link sides — apply one value to all four"}
            aria-label={linked ? "Unlink sides" : "Link sides"}
            aria-pressed={linked}
            className={`inline-flex h-6 w-6 items-center justify-center rounded border transition-colors ${
              linked
                ? "border-stonehill-accent bg-stonehill-accent/10 text-stonehill-accent"
                : "border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            {linked ? <Link2 className="h-3.5 w-3.5" /> : <Unlink2 className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={resetAll}
            title="Reset padding"
            aria-label="Reset padding"
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-slate-500 hover:border-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {sideInput("top", "Top")}
        {sideInput("right", "Right")}
        {sideInput("bottom", "Bottom")}
        {sideInput("left", "Left")}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          {linked ? "All sides change together." : "Top / Right / Bottom / Left"}
        </span>
        <SelectInput
          value={unit}
          onChange={(e) => setUnit(e.target.value as PaddingUnit)}
          className="w-20 h-7 text-xs py-0"
          aria-label="Padding unit"
        >
          <option value="px">px</option>
          <option value="rem">rem</option>
          <option value="%">%</option>
        </SelectInput>
      </div>
    </div>
  );
}
