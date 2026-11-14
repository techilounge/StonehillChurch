/**
 * Characterization tests for the zod schemas in lib/validators.ts.
 *
 * Snapshots were recorded under zod 3 before the zod 4 upgrade. They pin down
 * what the app actually depends on: which inputs pass, the parsed output
 * (including defaults and transforms), and the field errors returned to forms.
 * A snapshot diff after a zod upgrade is a behavior change that must be
 * reviewed, not blindly updated.
 */
import { describe, expect, it } from "vitest";
import type { z } from "zod";
import * as v from "@/lib/validators";
import {
  announcementsSeed,
  eventsSeed,
  homepageSlidesSeed,
  leadersSeed,
  ministriesSeed,
  pagesSeed,
  resourcesSeed,
  sermonsSeed,
  siteSettingsSeed,
  youtubeSettingsSeed,
} from "../../scripts/seedData";

type Outcome =
  | { ok: true; data: unknown }
  | { ok: false; fieldErrors: Record<string, string[] | undefined>; formErrors: string[] };

function outcome(schema: z.ZodTypeAny, input: unknown): Outcome {
  const result = schema.safeParse(input);
  if (result.success) {
    return { ok: true, data: JSON.parse(JSON.stringify(result.data ?? null)) };
  }
  const flat = result.error.flatten();
  return { ok: false, fieldErrors: flat.fieldErrors, formErrors: flat.formErrors };
}

/** Pass/fail plus the set of failing fields, ignoring message wording. */
function shape(o: Outcome) {
  return o.ok ? { ok: true } : { ok: false, fields: Object.keys(o.fieldErrors).sort() };
}

const seedFixtures: Array<[string, z.ZodTypeAny, Array<{ id: string; data: unknown }>]> = [
  ["homepageSlides", v.homepageSlideSchema, homepageSlidesSeed],
  ["sermons", v.sermonSchema, sermonsSeed],
  ["events", v.eventSchema, eventsSeed],
  ["ministries", v.ministrySchema, ministriesSeed],
  ["leaders", v.leaderSchema, leadersSeed],
  ["announcements", v.announcementSchema, announcementsSeed],
  ["resources", v.resourceSchema, resourcesSeed],
  ["pages", v.pageSchema, pagesSeed],
  ["siteSettings", v.siteSettingSchema, siteSettingsSeed],
  ["youtubeSettings", v.youtubeSettingsSchema, [youtubeSettingsSeed]],
];

describe("collection schemas against seed documents", () => {
  for (const [name, schema, docs] of seedFixtures) {
    it(`${name}: parsed output is unchanged`, () => {
      expect(docs.map((doc) => ({ id: doc.id, ...outcome(schema, doc.data) }))).toMatchSnapshot();
    });
  }
});

describe("collection schemas with empty input", () => {
  for (const [name, schema] of Object.entries(v.collectionSchemas)) {
    it(`${name}: rejects {} on the same fields`, () => {
      expect(shape(outcome(schema as z.ZodTypeAny, {}))).toMatchSnapshot();
    });
  }
});

describe("CMS partial update schemas", () => {
  // validatePartialData parses the patch, then merges it over the existing
  // document. Defaults filled in here would overwrite stored values.
  const modules: Array<[string, z.ZodTypeAny]> = [
    ["homepageSlides", v.homepageSlideSchema],
    ["sermons", v.sermonSchema],
    ["events", v.eventSchema],
    ["ministries", v.ministrySchema],
    ["leaders", v.leaderSchema],
    ["leaderCategories", v.leaderCategorySchema],
    ["announcements", v.announcementSchema],
    ["resources", v.resourceSchema],
    ["pages", v.pageSchema],
    ["popups", v.popupSchema],
    ["siteSettings", v.siteSettingSchema],
  ];

  for (const [name, schema] of modules) {
    it(`${name}: patch output only contains what was sent`, () => {
      const patch = (input: Record<string, unknown>): Outcome => {
        const result = v.safeParsePartialUpdate(schema, input);
        if (result.success) return { ok: true, data: JSON.parse(JSON.stringify(result.data)) };
        const flat = result.error.flatten();
        return { ok: false, fieldErrors: flat.fieldErrors, formErrors: flat.formErrors };
      };
      expect({
        empty: patch({}),
        statusOnly: patch({ status: "published" }),
        titleOnly: patch({ title: "Updated title" }),
      }).toMatchSnapshot();
    });
  }
});

const person = { name: "Jane Doe", email: "jane@example.com" };

const formFixtures: Record<string, unknown[]> = {
  contact: [
    { ...person, formType: "contact", message: "Hello there, I have a question." },
    { ...person, formType: "contact", message: "Hello there!", phone: "  ", subject: "" },
    { formType: "contact", name: "J", email: "not-an-email", message: "short" },
  ],
  prayer_request: [
    { ...person, formType: "prayer_request", message: "Please pray for my family." },
    { ...person, formType: "prayer_request", message: "Pray", confidential: true },
  ],
  volunteer: [
    { ...person, formType: "volunteer", message: "I can help!", areas: ["Children's Ministry", " Music "] },
    { ...person, formType: "volunteer", message: "I can help!", areas: "Greeting" },
    { ...person, formType: "volunteer", message: "I can help!", areas: [] },
  ],
  announcement_request: [
    { ...person, formType: "announcement_request", announcementTitle: "Bake sale", announcementBody: "Sunday after church." },
    { ...person, formType: "announcement_request", announcementTitle: "B", announcementBody: "" },
  ],
  membership_transfer: [
    { ...person, formType: "membership_transfer", message: "Transferring from Dallas.", currentChurch: "Dallas SDA" },
    { ...person, formType: "membership_transfer", message: "Moving.", transferDirection: "sideways" },
  ],
  maintenance_request: [
    { ...person, formType: "maintenance_request", location: "Fellowship hall", issue: "Leaking faucet" },
    { ...person, formType: "maintenance_request", location: "Hall", issue: "Leak", urgency: "urgent" },
  ],
  plan_your_visit: [
    { ...person, formType: "plan_your_visit", visitDate: "Next Sabbath" },
    { ...person, formType: "plan_your_visit", visitDate: "Next Sabbath", numberOfAdults: 0, numberOfChildren: 1.5 },
  ],
  unknown: [{ ...person, formType: "newsletter", message: "Sign me up please" }, {}, "not an object"],
};

describe("public form submission schema", () => {
  for (const [formType, inputs] of Object.entries(formFixtures)) {
    it(`${formType}: pass/fail and failing fields are unchanged`, () => {
      expect(inputs.map((input) => shape(outcome(v.publicFormSubmissionSchema, input)))).toMatchSnapshot();
    });

    it(`${formType}: parsed output and error messages`, () => {
      expect(inputs.map((input) => outcome(v.publicFormSubmissionSchema, input))).toMatchSnapshot();
    });
  }
});

describe("standalone schemas", () => {
  const cases: Array<[string, z.ZodTypeAny, unknown[]]> = [
    ["emailSchema", v.emailSchema, ["a@b.co", "A@Example.COM", "bad", "a@b", " a@b.co "]],
    ["slugSchema", v.slugSchema, ["good-slug", "Bad Slug", "a", "trailing-", "x".repeat(200)]],
    ["urlSchema", v.urlSchema, ["https://example.com", "http://example.com", "/relative", "javascript:alert(1)", "mailto:a@b.co"]],
    ["optionalUrlSchema", v.optionalUrlSchema, [undefined, null, "", "https://example.com", "nope"]],
    ["configurableUrlSchema", v.configurableUrlSchema, ["/contact", "https://example.com", "", "javascript:alert(1)"]],
    ["httpsUrlSchema", v.httpsUrlSchema, ["https://example.com", "http://example.com"]],
    ["formSubmissionStatusUpdateSchema", v.formSubmissionStatusUpdateSchema, [
      { status: "new" },
      { status: "bogus" },
      { status: "archived", assignedTo: " ", internalNotes: "  note  " },
    ]],
    ["formSubmissionPayloadSchema", v.formSubmissionPayloadSchema, [
      { a: "x", b: 1, c: true, d: null, e: ["x", "y"] },
      { nested: { not: "allowed" } },
    ]],
    ["siteSettingValueSchema", v.siteSettingValueSchema, [
      "text", 3, true, null, ["a"],
      { height: { mode: "preset", preset: "large" } },
      { a: { b: { c: "too deep" } } },
    ]],
    ["menuDocumentSchema", v.menuDocumentSchema, [{}, { location: "header", items: [] }]],
    ["auditLogSchema", v.auditLogSchema, [{}]],
    ["userInviteSchema", v.userInviteSchema, [{}]],
  ];

  for (const [name, schema, inputs] of cases) {
    it(`${name}: behavior is unchanged`, () => {
      expect(inputs.map((input) => shape(outcome(schema, input)))).toMatchSnapshot();
      expect(inputs.map((input) => outcome(schema, input))).toMatchSnapshot();
    });
  }
});
