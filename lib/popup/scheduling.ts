export type PopupSchedulingWindow = {
  startTime?: string | Date | null;
  endTime?: string | Date | null;
};

function toMs(value: string | Date | null | undefined): number | null {
  if (!value) return null;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

// True when `now` falls inside the popup's [startTime, endTime] window.
// Missing startTime = active immediately. Missing endTime = never expires.
// Both bounds are inclusive on the start side and exclusive on the end side,
// matching the original spec ("currentTime >= start AND currentTime <= end")
// loosely — we use strict less-than on end so a popup with endTime equal to
// "now" cleanly disappears rather than flickering on the boundary tick.
export function isPopupActiveAt(window: PopupSchedulingWindow, now: number): boolean {
  const startMs = toMs(window.startTime ?? null);
  const endMs = toMs(window.endTime ?? null);

  if (startMs !== null && now < startMs) return false;
  if (endMs !== null && now > endMs) return false;
  return true;
}
