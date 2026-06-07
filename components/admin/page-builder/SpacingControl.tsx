"use client";

import * as React from "react";
import { Link2, Unlink2, RotateCcw, Monitor, Tablet, Smartphone } from "lucide-react";
import { TextInput } from "@/components/forms/TextInput";
import { SelectInput } from "@/components/forms/SelectInput";
import { InspectorLabel } from "./InspectorLabel";
import { usePageBuilder } from "./PageBuilderContext";
import type {
  DevicePreview,
  PaddingUnit,
  SpacingTokenRef,
  StructuredMargin,
  StructuredPadding,
} from "@/types/pageBuilder";

const TOKEN_NAMES: SpacingTokenRef[] = ["xs", "sm", "md", "lg", "xl"];

type Side = "top" | "right" | "bottom" | "left";

interface SpacingControlProps {
  /** Desktop / default value (also the inherited value for tablet + mobile). */
  desktop: StructuredPadding | undefined;
  /** Tablet override. Falls back to desktop when undefined. */
  tablet: StructuredPadding | undefined;
  /** Mobile override. Falls back to tablet, then desktop. */
  mobile: StructuredPadding | undefined;
  /** Called whenever any value changes. The caller writes to the correct field. */
  onChange: (device: DevicePreview, next: StructuredPadding | undefined) => void;
  /** Spacing kind. Margin allows negative values; padding does not. */
  kind: "padding" | "margin";
  /** Inspector label (defaults derived from `kind`). */
  label?: string;
  /** Optional tooltip shown next to the label. */
  tooltip?: string;
}

const ZERO: StructuredPadding = { top: 0, right: 0, bottom: 0, left: 0, unit: "px" };

const DEVICE_TABS: { value: DevicePreview; label: string; Icon: typeof Monitor }[] = [
  { value: "desktop", label: "Desktop", Icon: Monitor },
  { value: "tablet", label: "Tablet", Icon: Tablet },
  { value: "mobile", label: "Mobile", Icon: Smartphone },
];

export function SpacingControl({
  desktop,
  tablet,
  mobile,
  onChange,
  kind,
  label,
  tooltip,
}: SpacingControlProps) {
  const { devicePreview, setDevicePreview } = usePageBuilder();
  const allowNegative = kind === "margin";
  const min = allowNegative ? -500 : 0;
  const max = 500;

  // Effective value to display for the current device, with cascade:
  //   mobile → tablet → desktop → zero
  const effective: StructuredPadding =
    (devicePreview === "mobile" && (mobile ?? tablet ?? desktop)) ||
    (devicePreview === "tablet" && (tablet ?? desktop)) ||
    (desktop ?? ZERO);

  // Which field is "own" (vs inherited) for the active device — only the
  // active device's own field is set; the others render as inherited.
  const ownValue: StructuredPadding | undefined =
    devicePreview === "mobile" ? mobile : devicePreview === "tablet" ? tablet : desktop;
  const isInheriting = !ownValue;

  const linked = effective.linked === true;
  const unit: PaddingUnit = effective.unit ?? "px";
  const activeToken: SpacingTokenRef | undefined = effective.token;

  const emit = (next: StructuredPadding | undefined) => {
    if (!next) {
      onChange(devicePreview, undefined);
      return;
    }
    const isZero = next.top === 0 && next.right === 0 && next.bottom === 0 && next.left === 0;
    // For desktop, wipe when all-zero + unlinked (keeps documents tidy).
    // For tablet/mobile, only wipe when the user explicitly clicks "Inherit".
    if (devicePreview === "desktop" && isZero && !next.linked) {
      onChange("desktop", undefined);
      return;
    }
    onChange(devicePreview, next);
  };

  const setSide = (side: Side, raw: string) => {
    const parsed = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(parsed)) return;
    const n = Math.max(min, Math.min(max, parsed));
    // Editing any side automatically drops the active token — the user is
    // moving back to custom values.
    const baseEffective = { ...effective, token: undefined };
    if (linked) {
      emit({ top: n, right: n, bottom: n, left: n, unit, linked: true });
    } else {
      emit({ ...baseEffective, [side]: n, unit, linked: false });
    }
  };

  const setToken = (next: SpacingTokenRef | undefined) => {
    if (next) {
      // Token applies to all four sides — implies linked.
      emit({ ...effective, unit, linked: true, token: next });
    } else {
      emit({ ...effective, unit, token: undefined });
    }
  };

  const toggleLinked = () => {
    if (linked) {
      emit({ ...effective, linked: false, unit });
    } else {
      const t = effective.top;
      emit({ top: t, right: t, bottom: t, left: t, unit, linked: true });
    }
  };

  const setUnit = (next: PaddingUnit) => emit({ ...effective, unit: next });

  const inheritFromDesktop = () => {
    // Clearing the tablet/mobile override = falls back to the cascade.
    onChange(devicePreview, undefined);
  };

  const sideInput = (side: Side, srLabel: string) => (
    <label className="flex items-center gap-1.5 text-xs text-slate-600">
      <span className="w-3 font-semibold text-slate-500" aria-hidden="true">
        {srLabel[0]}
      </span>
      <span className="sr-only">{srLabel}</span>
      <TextInput
        type="number"
        min={min}
        max={max}
        value={String(effective[side])}
        onChange={(e) => setSide(side, e.target.value)}
        disabled={!!activeToken}
        className={`w-full text-center ${activeToken || isInheriting ? "text-slate-400" : ""}`}
      />
    </label>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <InspectorLabel tooltip={tooltip}>{label ?? (kind === "padding" ? "Padding" : "Margin")}</InspectorLabel>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleLinked}
            title={linked ? "Unlink sides" : "Link sides"}
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
            onClick={() => onChange("desktop", undefined)}
            title="Reset (clears all device overrides)"
            aria-label={`Reset ${kind}`}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-slate-500 hover:border-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Device tabs — sync with global devicePreview so the canvas also shifts. */}
      <div role="tablist" aria-label="Device" className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-0.5">
        {DEVICE_TABS.map(({ value, label: deviceLabel, Icon }) => {
          const active = devicePreview === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setDevicePreview(value)}
              title={deviceLabel}
              className={`flex-1 inline-flex items-center justify-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                active
                  ? "bg-stonehill-accent/10 text-stonehill-accent font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{deviceLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Token chip row — clicking a token applies it to all four sides; click
          "Custom" to drop the token and edit numbers directly. */}
      <div role="radiogroup" aria-label="Spacing token" className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          role="radio"
          aria-checked={!activeToken}
          onClick={() => setToken(undefined)}
          className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
            !activeToken
              ? "bg-stonehill-accent/10 text-stonehill-accent border-stonehill-accent"
              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
          }`}
        >
          Custom
        </button>
        {TOKEN_NAMES.map((name) => {
          const active = activeToken === name;
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setToken(name)}
              title={`Spacing token: ${name.toUpperCase()}`}
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border transition-colors ${
                active
                  ? "bg-stonehill-accent/10 text-stonehill-accent border-stonehill-accent"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
              }`}
            >
              {name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {sideInput("top", "Top")}
        {sideInput("right", "Right")}
        {sideInput("bottom", "Bottom")}
        {sideInput("left", "Left")}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-slate-500">
          {activeToken
            ? `Using token "${activeToken.toUpperCase()}" — edit in Settings → Design Tokens`
            : isInheriting
              ? `Inheriting from ${devicePreview === "mobile" && tablet ? "tablet" : "desktop"}`
              : linked
                ? "All sides change together"
                : "T / R / B / L"}
        </span>
        <div className="flex items-center gap-1">
          {!isInheriting && devicePreview !== "desktop" && (
            <button
              type="button"
              onClick={inheritFromDesktop}
              className="text-[11px] font-medium text-slate-500 hover:text-stonehill-accent"
              title={`Drop this ${devicePreview} override and inherit`}
            >
              Inherit
            </button>
          )}
          <SelectInput
            value={unit}
            onChange={(e) => setUnit(e.target.value as PaddingUnit)}
            className="w-16 h-7 text-xs py-0"
            aria-label="Spacing unit"
          >
            <option value="px">px</option>
            <option value="rem">rem</option>
            <option value="%">%</option>
          </SelectInput>
        </div>
      </div>
    </div>
  );
}

// Convenience helpers — narrow `SpacingControl` to a single kind so callsites
// don't have to repeat the `kind` prop and the typing is explicit.
export function PaddingControlV2(props: Omit<SpacingControlProps, "kind">) {
  return <SpacingControl {...props} kind="padding" />;
}

export function MarginControl(props: Omit<SpacingControlProps, "kind" | "desktop" | "tablet" | "mobile"> & {
  desktop: StructuredMargin | undefined;
  tablet: StructuredMargin | undefined;
  mobile: StructuredMargin | undefined;
}) {
  return <SpacingControl {...props} kind="margin" />;
}
