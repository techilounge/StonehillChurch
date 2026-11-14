import { describe, expect, it } from "vitest";
import {
  compareAnnouncementsForDisplay,
  getAnnouncementWindow,
  isAnnouncementActive,
  toAnnouncementDate,
} from "@/lib/announcements";

// The admin date input stores the chosen day as local midnight. These fixtures
// use the UTC equivalent of midnight US Central (05:00Z) to mirror real data.
const window = {
  startDate: "2026-11-01T05:00:00.000Z",
  endDate: "2026-11-14T06:00:00.000Z", // last display day: Nov 14 (CST)
};

describe("isAnnouncementActive", () => {
  it("stays visible for the whole of the end date, not just until its midnight", () => {
    expect(isAnnouncementActive(window, new Date("2026-11-14T18:00:00.000Z"))).toBe(true);
    expect(isAnnouncementActive(window, new Date("2026-11-15T05:59:59.000Z"))).toBe(true);
  });

  it("expires once the last display day is over", () => {
    expect(isAnnouncementActive(window, new Date("2026-11-15T06:00:00.000Z"))).toBe(false);
  });

  it("is hidden before the start date", () => {
    expect(isAnnouncementActive(window, new Date("2026-11-01T04:59:59.000Z"))).toBe(false);
    expect(isAnnouncementActive(window, new Date("2026-11-01T05:00:00.000Z"))).toBe(true);
  });

  it("treats missing or invalid dates as inactive", () => {
    const now = new Date("2026-11-05T00:00:00.000Z");
    expect(isAnnouncementActive({ startDate: window.startDate }, now)).toBe(false);
    expect(isAnnouncementActive({ endDate: window.endDate }, now)).toBe(false);
    expect(isAnnouncementActive({ startDate: "not a date", endDate: window.endDate }, now)).toBe(false);
  });
});

describe("toAnnouncementDate", () => {
  it("accepts Dates, ISO strings and Firestore Timestamp-like objects", () => {
    const iso = "2026-11-01T05:00:00.000Z";
    expect(toAnnouncementDate(new Date(iso))?.toISOString()).toBe(iso);
    expect(toAnnouncementDate(iso)?.toISOString()).toBe(iso);
    expect(toAnnouncementDate({ toDate: () => new Date(iso) })?.toISOString()).toBe(iso);
    expect(toAnnouncementDate(null)).toBeNull();
    expect(toAnnouncementDate(new Date("invalid"))).toBeNull();
  });
});

describe("getAnnouncementWindow", () => {
  it("returns an inclusive end boundary one millisecond before the next day", () => {
    const { end } = getAnnouncementWindow(window);
    expect(end?.toISOString()).toBe("2026-11-15T05:59:59.999Z");
  });
});

describe("compareAnnouncementsForDisplay", () => {
  it("orders by priority, then by most recent start date", () => {
    const items = [
      { id: "old-normal", priority: "normal", startDate: "2026-11-01T05:00:00.000Z" },
      { id: "urgent", priority: "urgent", startDate: "2026-10-01T05:00:00.000Z" },
      { id: "new-normal", priority: "normal", startDate: "2026-11-10T05:00:00.000Z" },
      { id: "low", priority: "low", startDate: "2026-11-12T05:00:00.000Z" },
      { id: "high", priority: "high", startDate: "2026-09-01T05:00:00.000Z" },
    ];
    expect([...items].sort(compareAnnouncementsForDisplay).map((item) => item.id)).toEqual([
      "urgent",
      "high",
      "new-normal",
      "old-normal",
      "low",
    ]);
  });

  it("treats an unknown priority as normal", () => {
    const unknown = { priority: "bogus", startDate: "2026-11-01T05:00:00.000Z" };
    const normal = { priority: "normal", startDate: "2026-11-01T05:00:00.000Z" };
    expect(compareAnnouncementsForDisplay(unknown, normal)).toBe(0);
  });
});
