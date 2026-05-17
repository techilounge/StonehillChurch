import { describe, it, expect, beforeEach } from "vitest";
import {
  isPopupAllowedByFrequency,
  markPopupShown,
  shownKey,
  lastShownKey,
  type FrequencyStorage,
} from "@/lib/popup/frequency";

function makeStorage(): FrequencyStorage & { _data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    _data: data,
    getItem: (k) => (data.has(k) ? data.get(k)! : null),
    setItem: (k, v) => {
      data.set(k, v);
    },
  };
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

let storage: ReturnType<typeof makeStorage>;
beforeEach(() => {
  storage = makeStorage();
});

describe("Show Every Time", () => {
  const popup = { id: "p1", frequencyMode: "every" as const };

  it("always allows", () => {
    expect(isPopupAllowedByFrequency(popup, storage, 0)).toBe(true);
    expect(isPopupAllowedByFrequency(popup, storage, Date.now())).toBe(true);
  });

  it("markPopupShown is a no-op for 'every'", () => {
    markPopupShown(popup, storage, 1000);
    expect(storage._data.size).toBe(0);
  });
});

describe("Show Once", () => {
  const popup = { id: "p2", frequencyMode: "once" as const };

  it("allows the first view, then suppresses forever", () => {
    expect(isPopupAllowedByFrequency(popup, storage, 1000)).toBe(true);
    markPopupShown(popup, storage, 1000);
    expect(storage._data.get(shownKey("p2"))).toBe("1");
    expect(isPopupAllowedByFrequency(popup, storage, 1000 + 100 * DAY)).toBe(false);
  });

  it("scopes the suppression flag per popup id", () => {
    markPopupShown(popup, storage, 1000);
    expect(isPopupAllowedByFrequency({ id: "different", frequencyMode: "once" }, storage, 1000)).toBe(
      true,
    );
  });
});

describe("Show on Time Interval", () => {
  it("allows when no last-shown record exists", () => {
    expect(
      isPopupAllowedByFrequency(
        { id: "p3", frequencyMode: "interval", frequencyIntervalValue: 1, frequencyIntervalUnit: "hours" },
        storage,
        0,
      ),
    ).toBe(true);
  });

  it("suppresses inside the cooldown window", () => {
    const popup = {
      id: "p3",
      frequencyMode: "interval" as const,
      frequencyIntervalValue: 30,
      frequencyIntervalUnit: "minutes" as const,
    };
    markPopupShown(popup, storage, 1_000_000);
    expect(storage._data.get(lastShownKey("p3"))).toBe(String(1_000_000));
    expect(isPopupAllowedByFrequency(popup, storage, 1_000_000 + 29 * MIN)).toBe(false);
  });

  it("re-allows once the cooldown has elapsed", () => {
    const popup = {
      id: "p3",
      frequencyMode: "interval" as const,
      frequencyIntervalValue: 2,
      frequencyIntervalUnit: "hours" as const,
    };
    markPopupShown(popup, storage, 1_000_000);
    expect(isPopupAllowedByFrequency(popup, storage, 1_000_000 + 2 * HOUR)).toBe(true);
    expect(isPopupAllowedByFrequency(popup, storage, 1_000_000 + 3 * HOUR)).toBe(true);
  });

  it("respects each unit", () => {
    const make = (unit: "minutes" | "hours" | "days") => ({
      id: "p3",
      frequencyMode: "interval" as const,
      frequencyIntervalValue: 1,
      frequencyIntervalUnit: unit,
    });

    // minutes
    let s = makeStorage();
    markPopupShown(make("minutes"), s, 0);
    expect(isPopupAllowedByFrequency(make("minutes"), s, MIN - 1)).toBe(false);
    expect(isPopupAllowedByFrequency(make("minutes"), s, MIN)).toBe(true);

    // hours
    s = makeStorage();
    markPopupShown(make("hours"), s, 0);
    expect(isPopupAllowedByFrequency(make("hours"), s, HOUR - 1)).toBe(false);
    expect(isPopupAllowedByFrequency(make("hours"), s, HOUR)).toBe(true);

    // days
    s = makeStorage();
    markPopupShown(make("days"), s, 0);
    expect(isPopupAllowedByFrequency(make("days"), s, DAY - 1)).toBe(false);
    expect(isPopupAllowedByFrequency(make("days"), s, DAY)).toBe(true);
  });

  it("degrades to 'always allowed' when interval value/unit are missing", () => {
    // Older docs predating the field, or a half-populated config, should
    // never permanently hide the popup. Schema refinement enforces the
    // happy path; this just covers the degraded read.
    expect(
      isPopupAllowedByFrequency(
        { id: "p3", frequencyMode: "interval", frequencyIntervalValue: null, frequencyIntervalUnit: null },
        storage,
        0,
      ),
    ).toBe(true);
  });

  it("ignores a corrupt lastShown value", () => {
    storage.setItem(lastShownKey("p3"), "not-a-number");
    expect(
      isPopupAllowedByFrequency(
        { id: "p3", frequencyMode: "interval", frequencyIntervalValue: 1, frequencyIntervalUnit: "days" },
        storage,
        0,
      ),
    ).toBe(true);
  });
});

describe("fallback when frequencyMode is missing", () => {
  it("treats undefined mode as 'every'", () => {
    expect(
      // @ts-expect-error — exercising the runtime fallback path
      isPopupAllowedByFrequency({ id: "legacy" }, storage, 0),
    ).toBe(true);
  });
});
