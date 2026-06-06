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

// ---------------------------------------------------------------------------
// Occurrence calculation
// ---------------------------------------------------------------------------

const WEEKDAY_INDEX: Record<Weekday, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

function untilToDate(until: string): Date | null {
  // RRULE UNTIL can be YYYYMMDD or YYYYMMDDTHHMMSSZ. Treat the date-only form
  // as end-of-day UTC so equality comparisons with same-day occurrences pass.
  const dateOnly = until.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (dateOnly) {
    return new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 23, 59, 59));
  }
  const datetime = until.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/);
  if (datetime) {
    return new Date(
      Date.UTC(
        Number(datetime[1]),
        Number(datetime[2]) - 1,
        Number(datetime[3]),
        Number(datetime[4]),
        Number(datetime[5]),
        Number(datetime[6]),
      ),
    );
  }
  return null;
}

function cloneDateWithTimeOfDay(template: Date, year: number, month: number, day: number): Date {
  return new Date(
    year,
    month,
    day,
    template.getHours(),
    template.getMinutes(),
    template.getSeconds(),
    template.getMilliseconds(),
  );
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function nthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number,
  anchor: Date,
): Date | null {
  if (n > 0) {
    const first = new Date(year, month, 1).getDay();
    const offset = (weekday - first + 7) % 7;
    const day = 1 + offset + (n - 1) * 7;
    if (day < 1 || day > daysInMonth(year, month)) return null;
    return cloneDateWithTimeOfDay(anchor, year, month, day);
  }
  if (n < 0) {
    const last = daysInMonth(year, month);
    const lastWeekday = new Date(year, month, last).getDay();
    const offset = (lastWeekday - weekday + 7) % 7;
    const day = last - offset + (n + 1) * 7;
    if (day < 1 || day > last) return null;
    return cloneDateWithTimeOfDay(anchor, year, month, day);
  }
  return null;
}

function startOfWeek(d: Date): Date {
  // Treat Sunday as the week start to match getDay()'s indexing.
  const out = new Date(d);
  out.setDate(out.getDate() - out.getDay());
  out.setHours(0, 0, 0, 0);
  return out;
}

const MAX_ITERATIONS = 1500;

/**
 * Walk RRULE occurrences forward from `anchor` and return the first occurrence
 * at or after `after`. Returns null when the rule is invalid, the series has
 * ended (COUNT/UNTIL exhausted), or no occurrence is found within an
 * iteration safety cap.
 *
 * Supports the subset produced by RecurrenceEditor: DAILY, WEEKLY (with
 * BYDAY), MONTHLY (BYMONTHDAY or BYDAY with positional prefix), YEARLY.
 */
export function nextOccurrence(
  rule: string | null | undefined,
  anchor: Date,
  after: Date = new Date(),
): Date | null {
  if (!rule) return null;
  if (Number.isNaN(anchor.getTime())) return null;

  const parsed = parseRRuleString(rule);
  if (!parsed.FREQ) return null;

  const interval = Math.max(1, parsed.INTERVAL ?? 1);
  const count = parsed.COUNT ?? null;
  const until = parsed.UNTIL ? untilToDate(parsed.UNTIL) : null;
  const byDayTokens = parsed.BYDAY ?? [];

  let occurrenceIndex = 0;
  const seen = new Set<number>();
  const check = (candidate: Date | null): Date | null | "stop" | "skip" => {
    if (!candidate) return "skip";
    const key = candidate.getTime();
    if (seen.has(key)) return "skip";
    seen.add(key);
    if (until && candidate > until) return "stop";
    occurrenceIndex++;
    if (count !== null && occurrenceIndex > count) return "stop";
    if (candidate >= after) return candidate;
    return "skip";
  };

  switch (parsed.FREQ) {
    case "DAILY": {
      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const candidate = new Date(anchor);
        candidate.setDate(anchor.getDate() + i * interval);
        const result = check(candidate);
        if (result === "stop") return null;
        if (result instanceof Date) return result;
      }
      return null;
    }

    case "WEEKLY": {
      const plainDays = byDayTokens
        .map((t) => splitDayPrefix(t).day)
        .filter((d): d is Weekday => !!d);
      const days = plainDays.length > 0 ? plainDays : [
        (Object.keys(WEEKDAY_INDEX) as Weekday[])[anchor.getDay()],
      ];
      const dayNums = days.map((d) => WEEKDAY_INDEX[d]).sort((a, b) => a - b);

      const week0 = startOfWeek(anchor);
      for (let cycle = 0; cycle < MAX_ITERATIONS / 7; cycle++) {
        for (const dayNum of dayNums) {
          const candidate = cloneDateWithTimeOfDay(
            anchor,
            week0.getFullYear(),
            week0.getMonth(),
            week0.getDate() + cycle * interval * 7 + dayNum,
          );
          if (candidate < anchor) continue;
          const result = check(candidate);
          if (result === "stop") return null;
          if (result instanceof Date) return result;
        }
      }
      return null;
    }

    case "MONTHLY": {
      const byMonthDay = parsed.BYMONTHDAY ?? null;
      const prefixed = byDayTokens.length === 1 ? splitDayPrefix(byDayTokens[0]) : null;

      for (let i = 0; i < MAX_ITERATIONS; i++) {
        const year = anchor.getFullYear();
        const month = anchor.getMonth() + i * interval;
        let candidate: Date | null = null;
        if (byMonthDay) {
          const ym = new Date(year, month, 1);
          if (byMonthDay > daysInMonth(ym.getFullYear(), ym.getMonth())) {
            candidate = null;
          } else {
            candidate = cloneDateWithTimeOfDay(anchor, ym.getFullYear(), ym.getMonth(), byMonthDay);
          }
        } else if (prefixed && prefixed.day && prefixed.prefix !== null) {
          const ym = new Date(year, month, 1);
          candidate = nthWeekdayOfMonth(
            ym.getFullYear(),
            ym.getMonth(),
            WEEKDAY_INDEX[prefixed.day],
            prefixed.prefix,
            anchor,
          );
        } else {
          // Default to anchor's day-of-month.
          const ym = new Date(year, month, 1);
          const day = Math.min(anchor.getDate(), daysInMonth(ym.getFullYear(), ym.getMonth()));
          candidate = cloneDateWithTimeOfDay(anchor, ym.getFullYear(), ym.getMonth(), day);
        }
        const result = check(candidate);
        if (result === "stop") return null;
        if (result instanceof Date) return result;
      }
      return null;
    }

    case "YEARLY": {
      for (let i = 0; i < 200; i++) {
        const candidate = cloneDateWithTimeOfDay(
          anchor,
          anchor.getFullYear() + i * interval,
          anchor.getMonth(),
          anchor.getDate(),
        );
        const result = check(candidate);
        if (result === "stop") return null;
        if (result instanceof Date) return result;
      }
      return null;
    }

    default:
      return null;
  }
}
