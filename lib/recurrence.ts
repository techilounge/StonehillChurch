// Lightweight RRULE parse / build / classify utilities tailored to the small
// subset of recurrence patterns the Events editor exposes (daily, weekly,
// bi-weekly, monthly by-date or by-relative-day, yearly). We avoid pulling in
// a full RRULE library because we only need to read + write the rules the
// editor itself produces — anything more exotic is round-tripped via the
// "custom" preset.

export type RecurrencePreset =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "yearly"
  | "custom";

export type Weekday = "SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA";

export const WEEKDAYS: { value: Weekday; short: string; long: string }[] = [
  { value: "SU", short: "Sun", long: "Sunday" },
  { value: "MO", short: "Mon", long: "Monday" },
  { value: "TU", short: "Tue", long: "Tuesday" },
  { value: "WE", short: "Wed", long: "Wednesday" },
  { value: "TH", short: "Thu", long: "Thursday" },
  { value: "FR", short: "Fri", long: "Friday" },
  { value: "SA", short: "Sat", long: "Saturday" },
];

export type EndCondition =
  | { kind: "never" }
  | { kind: "until"; until: string } // YYYY-MM-DD (local date)
  | { kind: "count"; count: number };

export type MonthlyMode = "byDate" | "byDay";

export type RecurrenceState = {
  preset: RecurrencePreset;
  interval: number;
  byDay: Weekday[]; // weekly + biweekly + custom
  monthlyMode: MonthlyMode;
  byMonthDay: number; // 1..31 (monthly byDate)
  bySetPos: number; // 1..4 or -1 (monthly byDay relative position)
  byDayMonthly: Weekday; // weekday for monthly byDay
  end: EndCondition;
};

const WEEKDAY_SET = new Set<Weekday>(WEEKDAYS.map((d) => d.value));

export function defaultRecurrenceState(startDate?: Date): RecurrenceState {
  const anchor = startDate ?? new Date();
  return {
    preset: "weekly",
    interval: 1,
    byDay: [WEEKDAYS[anchor.getDay()].value],
    monthlyMode: "byDate",
    byMonthDay: anchor.getDate(),
    bySetPos: Math.min(4, Math.ceil(anchor.getDate() / 7)),
    byDayMonthly: WEEKDAYS[anchor.getDay()].value,
    end: { kind: "never" },
  };
}

type ParsedRRule = {
  FREQ?: string;
  INTERVAL?: number;
  BYDAY?: string[];
  BYMONTHDAY?: number;
  BYSETPOS?: number;
  COUNT?: number;
  UNTIL?: string;
};

function parseRRuleString(rule: string): ParsedRRule {
  const out: ParsedRRule = {};
  const body = rule.replace(/^RRULE:/i, "").trim();
  if (!body) return out;
  const parts = body.split(";");
  for (const part of parts) {
    const [rawKey, rawVal] = part.split("=");
    if (!rawKey || rawVal === undefined) continue;
    const key = rawKey.trim().toUpperCase();
    const val = rawVal.trim();
    switch (key) {
      case "FREQ":
        out.FREQ = val.toUpperCase();
        break;
      case "INTERVAL": {
        const n = Number(val);
        if (Number.isFinite(n) && n > 0) out.INTERVAL = Math.floor(n);
        break;
      }
      case "BYDAY":
        out.BYDAY = val
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter((s) => s.length > 0);
        break;
      case "BYMONTHDAY": {
        const n = Number(val);
        if (Number.isFinite(n)) out.BYMONTHDAY = Math.floor(n);
        break;
      }
      case "BYSETPOS": {
        const n = Number(val);
        if (Number.isFinite(n)) out.BYSETPOS = Math.floor(n);
        break;
      }
      case "COUNT": {
        const n = Number(val);
        if (Number.isFinite(n) && n > 0) out.COUNT = Math.floor(n);
        break;
      }
      case "UNTIL":
        out.UNTIL = val;
        break;
    }
  }
  return out;
}

function untilToLocalDateString(until: string): string {
  // Accepts YYYYMMDD or YYYYMMDDTHHMMSSZ. Returns YYYY-MM-DD.
  const m = until.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!m) return "";
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function localDateStringToUntil(date: string): string {
  // YYYY-MM-DD → YYYYMMDDT235959Z (end-of-day UTC, inclusive)
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return `${m[1]}${m[2]}${m[3]}T235959Z`;
}

function splitDayPrefix(token: string): { prefix: number | null; day: Weekday | null } {
  const m = token.match(/^(-?\d+)?([A-Z]{2})$/);
  if (!m) return { prefix: null, day: null };
  const prefix = m[1] ? Number(m[1]) : null;
  const day = m[2] as Weekday;
  if (!WEEKDAY_SET.has(day)) return { prefix: null, day: null };
  return { prefix, day };
}

export function parseRRule(rule: string | null | undefined, startDate?: Date): RecurrenceState {
  const base = defaultRecurrenceState(startDate);
  if (!rule) return base;

  const parsed = parseRRuleString(rule);
  if (!parsed.FREQ) return base;

  const interval = parsed.INTERVAL ?? 1;
  const byDayTokens = parsed.BYDAY ?? [];
  const plainDays: Weekday[] = byDayTokens
    .map((t) => splitDayPrefix(t).day)
    .filter((d): d is Weekday => !!d);
  const prefixedDay = byDayTokens.length === 1 ? splitDayPrefix(byDayTokens[0]) : null;

  let end: EndCondition = { kind: "never" };
  if (parsed.COUNT) end = { kind: "count", count: parsed.COUNT };
  else if (parsed.UNTIL) {
    const iso = untilToLocalDateString(parsed.UNTIL);
    if (iso) end = { kind: "until", until: iso };
  }

  switch (parsed.FREQ) {
    case "DAILY":
      return { ...base, preset: "daily", interval, end };
    case "WEEKLY": {
      const byDay = plainDays.length > 0 ? plainDays : base.byDay;
      if (interval === 1) {
        return { ...base, preset: "weekly", interval: 1, byDay, end };
      }
      if (interval === 2) {
        return { ...base, preset: "biweekly", interval: 2, byDay, end };
      }
      return { ...base, preset: "custom", interval, byDay, end };
    }
    case "MONTHLY": {
      if (parsed.BYMONTHDAY) {
        return {
          ...base,
          preset: "monthly",
          monthlyMode: "byDate",
          interval,
          byMonthDay: parsed.BYMONTHDAY,
          end,
        };
      }
      if (prefixedDay && prefixedDay.day && prefixedDay.prefix !== null) {
        return {
          ...base,
          preset: "monthly",
          monthlyMode: "byDay",
          interval,
          bySetPos: prefixedDay.prefix,
          byDayMonthly: prefixedDay.day,
          end,
        };
      }
      return { ...base, preset: "custom", interval, end };
    }
    case "YEARLY":
      return { ...base, preset: "yearly", interval, end };
    default:
      return { ...base, preset: "custom", interval, end };
  }
}

function endSegment(end: EndCondition): string {
  if (end.kind === "count" && end.count > 0) return `COUNT=${end.count}`;
  if (end.kind === "until" && end.until) {
    const u = localDateStringToUntil(end.until);
    return u ? `UNTIL=${u}` : "";
  }
  return "";
}

export function buildRRule(state: RecurrenceState): string {
  const interval = Math.max(1, Math.floor(state.interval || 1));
  const segments: string[] = [];

  switch (state.preset) {
    case "daily":
      segments.push("FREQ=DAILY");
      if (interval !== 1) segments.push(`INTERVAL=${interval}`);
      break;
    case "weekly": {
      segments.push("FREQ=WEEKLY");
      if (interval !== 1) segments.push(`INTERVAL=${interval}`);
      if (state.byDay.length > 0) segments.push(`BYDAY=${state.byDay.join(",")}`);
      break;
    }
    case "biweekly": {
      segments.push("FREQ=WEEKLY", "INTERVAL=2");
      if (state.byDay.length > 0) segments.push(`BYDAY=${state.byDay.join(",")}`);
      break;
    }
    case "monthly": {
      segments.push("FREQ=MONTHLY");
      if (interval !== 1) segments.push(`INTERVAL=${interval}`);
      if (state.monthlyMode === "byDate") {
        segments.push(`BYMONTHDAY=${Math.max(1, Math.min(31, state.byMonthDay))}`);
      } else {
        segments.push(`BYDAY=${state.bySetPos}${state.byDayMonthly}`);
      }
      break;
    }
    case "yearly":
      segments.push("FREQ=YEARLY");
      if (interval !== 1) segments.push(`INTERVAL=${interval}`);
      break;
    case "custom": {
      // Custom keeps the same shape as weekly but with arbitrary interval
      // and any number of weekdays.
      segments.push("FREQ=WEEKLY");
      if (interval !== 1) segments.push(`INTERVAL=${interval}`);
      if (state.byDay.length > 0) segments.push(`BYDAY=${state.byDay.join(",")}`);
      break;
    }
  }

  const end = endSegment(state.end);
  if (end) segments.push(end);

  return segments.join(";");
}

export const ORDINAL_LABELS: { value: number; label: string }[] = [
  { value: 1, label: "First" },
  { value: 2, label: "Second" },
  { value: 3, label: "Third" },
  { value: 4, label: "Fourth" },
  { value: -1, label: "Last" },
];
