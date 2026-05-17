import type { PopupFrequencyIntervalUnit, PopupFrequencyMode } from "@/types/popup";

// Minimal subset of the Web Storage API. Lets us pass either the real
// window.localStorage or a Map-backed stub in tests. Anything that can
// throw (Safari private mode quotas, disabled storage) is caught at the
// call sites that touch real storage — the pure helpers below assume an
// already-vetted backend.
export type FrequencyStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type PopupFrequencyConfig = {
  id: string;
  frequencyMode: PopupFrequencyMode;
  frequencyIntervalValue?: number | null;
  frequencyIntervalUnit?: PopupFrequencyIntervalUnit | null;
};

// Storage key shape comes straight from the spec ("popup_<id>_shown",
// "popup_<id>_lastShown") so anyone debugging in devtools sees the exact
// names from the ticket.
export function shownKey(popupId: string): string {
  return `popup_${popupId}_shown`;
}

export function lastShownKey(popupId: string): string {
  return `popup_${popupId}_lastShown`;
}

function intervalToMs(value: number, unit: PopupFrequencyIntervalUnit): number {
  switch (unit) {
    case "minutes":
      return value * 60_000;
    case "hours":
      return value * 60 * 60_000;
    case "days":
      return value * 24 * 60 * 60_000;
  }
}

// True when the popup is allowed to display under its frequency rule.
// Caller must have already verified the schedule (Start/End Time) — this
// function does not look at the schedule at all. Layering is intentional:
// schedule decides "is this popup live?", frequency decides "have we shown
// it recently enough to suppress it?".
export function isPopupAllowedByFrequency(
  popup: PopupFrequencyConfig,
  storage: FrequencyStorage,
  now: number,
): boolean {
  const mode = popup.frequencyMode ?? "every";

  if (mode === "every") return true;

  if (mode === "once") {
    return storage.getItem(shownKey(popup.id)) === null;
  }

  // interval mode
  const value = popup.frequencyIntervalValue;
  const unit = popup.frequencyIntervalUnit;
  // Misconfigured interval (missing value/unit) degrades to "always allowed"
  // rather than permanently hiding the popup. The schema refinement should
  // make this unreachable in practice, but live docs from before the field
  // existed can land here.
  if (!value || value < 1 || !unit) return true;

  const last = storage.getItem(lastShownKey(popup.id));
  if (last === null) return true;
  const lastMs = Number(last);
  if (!Number.isFinite(lastMs)) return true;

  return now - lastMs >= intervalToMs(value, unit);
}

// Records that the popup has just been shown. Idempotent for "every" mode
// (no-op). Must be called by the UI at the moment the popup actually
// becomes visible, not when it's merely allowed.
export function markPopupShown(
  popup: PopupFrequencyConfig,
  storage: FrequencyStorage,
  now: number,
): void {
  const mode = popup.frequencyMode ?? "every";
  if (mode === "every") return;
  if (mode === "once") {
    storage.setItem(shownKey(popup.id), "1");
    return;
  }
  // interval
  storage.setItem(lastShownKey(popup.id), String(now));
}
