import { describe, it, expect } from "vitest";
import { isPopupActiveAt } from "@/lib/popup/scheduling";

const t = (iso: string) => new Date(iso).getTime();

describe("isPopupActiveAt", () => {
  it("is active when both bounds are missing", () => {
    expect(isPopupActiveAt({}, t("2026-05-16T12:00:00Z"))).toBe(true);
    expect(isPopupActiveAt({ startTime: null, endTime: null }, t("2026-05-16T12:00:00Z"))).toBe(true);
  });

  it("is inactive before startTime", () => {
    expect(
      isPopupActiveAt(
        { startTime: "2026-05-16T12:00:00Z", endTime: null },
        t("2026-05-16T11:59:59Z"),
      ),
    ).toBe(false);
  });

  it("is active at and after startTime when endTime is open", () => {
    expect(
      isPopupActiveAt(
        { startTime: "2026-05-16T12:00:00Z", endTime: null },
        t("2026-05-16T12:00:00Z"),
      ),
    ).toBe(true);
    expect(
      isPopupActiveAt(
        { startTime: "2026-05-16T12:00:00Z", endTime: null },
        t("2030-01-01T00:00:00Z"),
      ),
    ).toBe(true);
  });

  it("is inactive after endTime", () => {
    expect(
      isPopupActiveAt(
        { startTime: null, endTime: "2026-05-16T12:00:00Z" },
        t("2026-05-16T12:00:01Z"),
      ),
    ).toBe(false);
  });

  it("is active inside a closed window", () => {
    expect(
      isPopupActiveAt(
        { startTime: "2026-05-16T10:00:00Z", endTime: "2026-05-16T14:00:00Z" },
        t("2026-05-16T12:00:00Z"),
      ),
    ).toBe(true);
  });

  it("accepts Date instances on either bound", () => {
    expect(
      isPopupActiveAt(
        {
          startTime: new Date("2026-05-16T10:00:00Z"),
          endTime: new Date("2026-05-16T14:00:00Z"),
        },
        t("2026-05-16T12:00:00Z"),
      ),
    ).toBe(true);
  });

  it("treats invalid date strings as no bound", () => {
    // An unparseable date shouldn't permanently lock a popup off — the
    // serializer can't produce one in practice, but if Firestore ever
    // hands us garbage we degrade to "no bound" rather than silently
    // hiding every popup.
    expect(
      isPopupActiveAt({ startTime: "not-a-date", endTime: null }, t("2026-05-16T12:00:00Z")),
    ).toBe(true);
  });
});
