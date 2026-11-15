import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));

type MockDoc = {
  id: string;
  key?: unknown;
  value: unknown;
};

let mockDocs: MockDoc[] = [];

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminFirestore: () => ({
    collection: () => ({
      get: async () => ({
        docs: mockDocs.map((doc) => ({
          id: doc.id,
          data: () => ({
            key: doc.key ?? doc.id,
            value: doc.value,
          }),
        })),
      }),
    }),
  }),
}));

import { flattenSiteSettingDocs, getSiteSettings } from "@/lib/data/siteSettings";

describe("siteSettings grouped vs dotted resolution", () => {
  beforeEach(() => {
    mockDocs = [];
  });

  it("lets grouped CMS documents override legacy dotted seed keys regardless of document ID order", async () => {
    // Firestore returns documents sorted ascending by doc ID ("contact" < "contact.address").
    mockDocs = [
      {
        id: "contact",
        key: "contact",
        value: {
          email: "contact@stonehillchurch.org",
          phone: "(512) 537-1844",
          address: "4301 Kelly Ln, Pflugerville, TX 78660",
        },
      },
      { id: "contact.address", value: "1487 Stonehill Ridge Road, Spokane, WA 99203" },
      { id: "contact.email", value: "office@stonehillsda.org" },
      { id: "contact.phone", value: "+1-509-555-0117" },
      {
        id: "service_times",
        key: "service_times",
        value: {
          breakfast_service: "Saturdays · 9:00am",
          sabbath_school: "Saturdays · 10:00am",
          divine_worship: "Saturdays · 11:00am",
          prayer_meeting: "Wednesdays · 7:00pm",
        },
      },
      { id: "service_times.breakfast_service", value: "Saturdays · 9:00am" },
      { id: "service_times.sabbath_school", value: "Saturdays · 9:30am" },
    ];

    const settings = await getSiteSettings();

    expect(settings["contact.email"]).toBe("contact@stonehillchurch.org");
    expect(settings["contact.phone"]).toBe("(512) 537-1844");
    expect(settings["contact.address"]).toBe("4301 Kelly Ln, Pflugerville, TX 78660");
    expect(settings["service_times.sabbath_school"]).toBe("Saturdays · 10:00am");
    expect(settings["service_times.prayer_meeting"]).toBe("Wednesdays · 7:00pm");
  });

  it("preserves legacy dotted keys that are not present in grouped documents", () => {
    const result = flattenSiteSettingDocs([
      {
        id: "contact",
        key: "contact",
        value: { email: "new@stonehillchurch.org" },
      },
      { id: "contact.email", value: "old@stonehillsda.org" },
      { id: "contact.fax", value: "555-0199" },
    ]);

    expect(result["contact.email"]).toBe("new@stonehillchurch.org");
    expect(result["contact.fax"]).toBe("555-0199");
  });
});

