import { describe, expect, it } from "vitest";
import {
  buildAnnouncementMigrationPatch,
  deriveAnnouncementSummary,
  normalizeAnnouncement,
  slugifyAnnouncementTitle,
} from "@/lib/announcements";
import { announcementSchema } from "@/lib/validators";

const baseAnnouncement = {
  title: "Community Health Fair",
  body: "Free screenings and practical wellness resources for every age.",
  startDate: "2026-10-01T00:00:00.000Z",
  endDate: "2026-10-02T00:00:00.000Z",
  priority: "normal" as const,
  ctaLabel: null,
  ctaHref: null,
  imageUrl: null,
  imageAlt: null,
  status: "published" as const,
};

describe("announcement normalization", () => {
  it("preserves legacy channel behavior without mutating the source", () => {
    const source = { ...baseAnnouncement };
    const normalized = normalizeAnnouncement(source);

    expect(normalized).toMatchObject({
      slug: "community-health-fair",
      summary: baseAnnouncement.body,
      category: "general",
      publishToWebsite: true,
      showInAnnouncementBar: true,
      showOnHomepage: false,
    });
    expect(source).not.toHaveProperty("publishToWebsite");
  });

  it("preserves explicitly disabled or enabled placements", () => {
    const normalized = normalizeAnnouncement({
      ...baseAnnouncement,
      publishToWebsite: false,
      showInAnnouncementBar: false,
      showOnHomepage: true,
      category: "health",
    });

    expect(normalized.publishToWebsite).toBe(false);
    expect(normalized.showInAnnouncementBar).toBe(false);
    expect(normalized.showOnHomepage).toBe(true);
    expect(normalized.category).toBe("health");
  });

  it("derives safe slugs and plain-text summaries", () => {
    expect(slugifyAnnouncementTitle("  Café & Prayer Night!  ")).toBe("cafe-prayer-night");
    expect(deriveAnnouncementSummary("<p>Hello <strong>church</strong></p>")).toBe(
      "Hello church",
    );
    expect(deriveAnnouncementSummary("word ".repeat(100)).length).toBeLessThanOrEqual(300);
  });
});

describe("announcement migration patch", () => {
  it("only adds missing compatibility fields and is idempotent", () => {
    const patch = buildAnnouncementMigrationPatch(baseAnnouncement);
    expect(patch).toEqual({
      slug: "community-health-fair",
      summary: baseAnnouncement.body,
      category: "general",
      publishToWebsite: true,
      showInAnnouncementBar: true,
      showOnHomepage: false,
    });

    expect(buildAnnouncementMigrationPatch({ ...baseAnnouncement, ...patch })).toEqual({});
  });

  it("never overwrites explicitly configured values", () => {
    const patch = buildAnnouncementMigrationPatch({
      ...baseAnnouncement,
      slug: "custom-slug",
      summary: "Custom summary",
      category: "special",
      publishToWebsite: false,
      showInAnnouncementBar: false,
      showOnHomepage: true,
    });
    expect(patch).toEqual({});
  });
});

describe("announcement validation", () => {
  it("normalizes legacy input to the compatibility defaults", () => {
    const result = announcementSchema.parse(baseAnnouncement);
    expect(result.slug).toBe("community-health-fair");
    expect(result.publishToWebsite).toBe(true);
    expect(result.showInAnnouncementBar).toBe(true);
    expect(result.showOnHomepage).toBe(false);
  });

  it("rejects an invalid date range", () => {
    const result = announcementSchema.safeParse({
      ...baseAnnouncement,
      startDate: "2026-10-03T00:00:00.000Z",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.endDate).toBeDefined();
    }
  });

  it.each<[
    { ctaLabel: string | null; ctaHref: string | null },
    "ctaHref" | "ctaLabel",
  ]>([
    [{ ctaLabel: "Learn more", ctaHref: null }, "ctaHref"],
    [{ ctaLabel: null, ctaHref: "/learn-more" }, "ctaLabel"],
  ])("rejects incomplete CTA pairs", (cta, field) => {
    const result = announcementSchema.safeParse({ ...baseAnnouncement, ...cta });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors[field]).toBeDefined();
    }
  });

  it("requires meaningful alt text when an image is present", () => {
    const result = announcementSchema.safeParse({
      ...baseAnnouncement,
      imageUrl: "https://example.com/health-fair.webp",
      imageAlt: "Photo",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.imageAlt).toBeDefined();
    }
  });

  it("enforces slug and SEO limits", () => {
    const result = announcementSchema.safeParse({
      ...baseAnnouncement,
      slug: "Not A Slug",
      seoTitle: "x".repeat(71),
      seoDescription: "x".repeat(161),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.slug).toBeDefined();
      expect(errors.seoTitle).toBeDefined();
      expect(errors.seoDescription).toBeDefined();
    }
  });
});
