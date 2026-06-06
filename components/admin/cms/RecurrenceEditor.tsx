"use client";

import * as React from "react";
import { TextInput } from "@/components/forms/TextInput";
import { SelectInput } from "@/components/forms/SelectInput";
import {
  buildRRule,
  defaultRecurrenceState,
  ORDINAL_LABELS,
  parseRRule,
  WEEKDAYS,
  type EndCondition,
  type MonthlyMode,
  type RecurrencePreset,
  type RecurrenceState,
  type Weekday,
} from "@/lib/recurrence";

interface RecurrenceEditorProps {
  value: string | null | undefined;
  onChange: (rule: string) => void;
  startDateTime?: string | null;
}

const PRESET_OPTIONS: { value: RecurrencePreset; label: string; description: string }[] = [
  { value: "daily", label: "Daily", description: "Repeat every N days" },
  { value: "weekly", label: "Weekly", description: "Repeat every N weeks on selected days" },
  { value: "biweekly", label: "Bi-weekly", description: "Repeat every 2 weeks on selected days" },
  { value: "monthly", label: "Monthly", description: "Repeat by date or by relative day each month" },
  { value: "yearly", label: "Yearly", description: "Repeat every N years on the start date" },
  { value: "custom", label: "Custom", description: "Combine multiple weekdays and a custom interval" },
];

export function RecurrenceEditor({ value, onChange, startDateTime }: RecurrenceEditorProps) {
  const startDate = React.useMemo(() => {
    if (!startDateTime) return undefined;
    const d = new Date(startDateTime);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [startDateTime]);

  // Parse the incoming RRULE once per (value, startDate) change. Internal
  // edits flow through setState below and bypass the parser.
  const [state, setState] = React.useState<RecurrenceState>(() =>
    parseRRule(value ?? "", startDate),
  );
  const lastEmittedRef = React.useRef<string>(buildRRule(state));

  // If the parent passes a different incoming `value`, re-hydrate state.
  React.useEffect(() => {
    const incoming = value ?? "";
    if (incoming !== lastEmittedRef.current) {
      const next = parseRRule(incoming, startDate);
      setState(next);
      lastEmittedRef.current = buildRRule(next);
    }
  }, [value, startDate]);

  // Emit RRULE upward whenever local state changes.
  React.useEffect(() => {
    const next = buildRRule(state);
    if (next !== lastEmittedRef.current) {
      lastEmittedRef.current = next;
      onChange(next);
    }
  }, [state, onChange]);

  const setPreset = (preset: RecurrencePreset) => {
    setState((prev) => {
      const base = defaultRecurrenceState(startDate);
      switch (preset) {
        case "daily":
          return { ...prev, preset, interval: 1 };
        case "weekly":
          return { ...prev, preset, interval: 1, byDay: prev.byDay.length > 0 ? prev.byDay : base.byDay };
        case "biweekly":
          return { ...prev, preset, interval: 2, byDay: prev.byDay.length > 0 ? prev.byDay : base.byDay };
        case "monthly":
          return {
            ...prev,
            preset,
            interval: 1,
            monthlyMode: prev.monthlyMode || "byDate",
            byMonthDay: prev.byMonthDay || base.byMonthDay,
            bySetPos: prev.bySetPos || base.bySetPos,
            byDayMonthly: prev.byDayMonthly || base.byDayMonthly,
          };
        case "yearly":
          return { ...prev, preset, interval: 1 };
        case "custom":
          return { ...prev, preset, byDay: prev.byDay.length > 0 ? prev.byDay : base.byDay };
        default:
          return prev;
      }
    });
  };

  const setInterval = (n: number) =>
    setState((prev) => ({ ...prev, interval: Math.max(1, Math.floor(n || 1)) }));

  const toggleDay = (day: Weekday) =>
    setState((prev) => {
      const has = prev.byDay.includes(day);
      const byDay = has ? prev.byDay.filter((d) => d !== day) : [...prev.byDay, day];
      // Preserve a stable canonical order so the RRULE doesn't churn.
      const ordered = WEEKDAYS.map((d) => d.value).filter((d) => byDay.includes(d));
      return { ...prev, byDay: ordered };
    });

  const setMonthlyMode = (mode: MonthlyMode) =>
    setState((prev) => ({ ...prev, monthlyMode: mode }));

  const setByMonthDay = (n: number) =>
    setState((prev) => ({ ...prev, byMonthDay: Math.max(1, Math.min(31, Math.floor(n || 1))) }));

  const setBySetPos = (n: number) => setState((prev) => ({ ...prev, bySetPos: n }));
  const setByDayMonthly = (day: Weekday) =>
    setState((prev) => ({ ...prev, byDayMonthly: day }));

  const setEnd = (end: EndCondition) => setState((prev) => ({ ...prev, end }));

  const intervalUnit = (() => {
    switch (state.preset) {
      case "daily":
        return "day(s)";
      case "weekly":
      case "custom":
        return "week(s)";
      case "monthly":
        return "month(s)";
      case "yearly":
        return "year(s)";
      default:
        return "";
    }
  })();

  const showInterval = state.preset !== "biweekly";
  const showWeekdayPicker =
    state.preset === "weekly" || state.preset === "biweekly" || state.preset === "custom";

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold text-slate-900">Recurrence type</legend>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-start gap-2 rounded-md border p-2 cursor-pointer text-sm transition-colors ${
                state.preset === opt.value
                  ? "border-stonehill-accent bg-white shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="recurrence-preset"
                value={opt.value}
                checked={state.preset === opt.value}
                onChange={() => setPreset(opt.value)}
                className="mt-1 accent-stonehill-accent"
              />
              <span className="flex flex-col leading-tight">
                <span className="font-medium text-slate-900">{opt.label}</span>
                <span className="text-xs text-slate-600">{opt.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {showInterval && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">Repeat every</span>
          <TextInput
            type="number"
            min={1}
            value={String(state.interval)}
            onChange={(e) => setInterval(Number(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-slate-700">{intervalUnit}</span>
        </div>
      )}
      {state.preset === "biweekly" && (
        <p className="text-sm text-slate-600">Repeats every 2 weeks.</p>
      )}

      {showWeekdayPicker && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold text-slate-900">On these days</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => {
              const checked = state.byDay.includes(d.value);
              return (
                <label
                  key={d.value}
                  className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm cursor-pointer border transition-colors min-w-[3.25rem] ${
                    checked
                      ? "bg-stonehill-accent text-white border-stonehill-accent"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleDay(d.value)}
                    aria-label={d.long}
                  />
                  {d.short}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {state.preset === "monthly" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-semibold text-slate-900">Monthly pattern</legend>
          <label className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="monthly-mode"
              checked={state.monthlyMode === "byDate"}
              onChange={() => setMonthlyMode("byDate")}
              className="accent-stonehill-accent"
            />
            <span>On day</span>
            <TextInput
              type="number"
              min={1}
              max={31}
              value={String(state.byMonthDay)}
              onChange={(e) => setByMonthDay(Number(e.target.value))}
              disabled={state.monthlyMode !== "byDate"}
              className="w-20"
            />
            <span>of the month</span>
          </label>
          <label className="flex flex-wrap items-center gap-2 text-sm text-slate-800">
            <input
              type="radio"
              name="monthly-mode"
              checked={state.monthlyMode === "byDay"}
              onChange={() => setMonthlyMode("byDay")}
              className="accent-stonehill-accent"
            />
            <span>On the</span>
            <SelectInput
              value={String(state.bySetPos)}
              onChange={(e) => setBySetPos(Number(e.target.value))}
              disabled={state.monthlyMode !== "byDay"}
              className="w-28"
            >
              {ORDINAL_LABELS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectInput>
            <SelectInput
              value={state.byDayMonthly}
              onChange={(e) => setByDayMonthly(e.target.value as Weekday)}
              disabled={state.monthlyMode !== "byDay"}
              className="w-32"
            >
              {WEEKDAYS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.long}
                </option>
              ))}
            </SelectInput>
            <span>of the month</span>
          </label>
        </fieldset>
      )}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-slate-900">Ends</legend>
        <label className="flex items-center gap-2 text-sm text-slate-800">
          <input
            type="radio"
            name="recurrence-end"
            checked={state.end.kind === "never"}
            onChange={() => setEnd({ kind: "never" })}
            className="accent-stonehill-accent"
          />
          Never
        </label>
        <label className="flex flex-wrap items-center gap-2 text-sm text-slate-800">
          <input
            type="radio"
            name="recurrence-end"
            checked={state.end.kind === "until"}
            onChange={() =>
              setEnd({
                kind: "until",
                until:
                  state.end.kind === "until" && state.end.until
                    ? state.end.until
                    : new Date().toISOString().slice(0, 10),
              })
            }
            className="accent-stonehill-accent"
          />
          <span>On</span>
          <TextInput
            type="date"
            value={state.end.kind === "until" ? state.end.until : ""}
            onChange={(e) => setEnd({ kind: "until", until: e.target.value })}
            disabled={state.end.kind !== "until"}
            className="w-44"
          />
        </label>
        <label className="flex flex-wrap items-center gap-2 text-sm text-slate-800">
          <input
            type="radio"
            name="recurrence-end"
            checked={state.end.kind === "count"}
            onChange={() =>
              setEnd({
                kind: "count",
                count: state.end.kind === "count" && state.end.count > 0 ? state.end.count : 10,
              })
            }
            className="accent-stonehill-accent"
          />
          <span>After</span>
          <TextInput
            type="number"
            min={1}
            value={state.end.kind === "count" ? String(state.end.count) : ""}
            onChange={(e) =>
              setEnd({ kind: "count", count: Math.max(1, Math.floor(Number(e.target.value) || 1)) })
            }
            disabled={state.end.kind !== "count"}
            className="w-24"
          />
          <span>occurrence(s)</span>
        </label>
      </fieldset>
    </div>
  );
}
