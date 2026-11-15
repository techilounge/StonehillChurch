/**
 * Role x action enforcement in lib/data/adminCms.ts, run against an in-memory
 * Firestore. Covers the rules the admin UI relies on but cannot enforce:
 * viewers are read-only, editors work on drafts only, settings are admin-only.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminSession } from "@/lib/auth";
import type { AdminRole } from "@/lib/permissions";
import { eventsSeed, leadersSeed, siteSettingsSeed } from "../../scripts/seedData";

vi.mock("server-only", () => ({}));

const db = new Map<string, Map<string, Record<string, unknown>>>();
let autoId = 0;

function col(name: string) {
  if (!db.has(name)) db.set(name, new Map());
  return db.get(name)!;
}

function snapshot(id: string, data: Record<string, unknown> | undefined) {
  return { id, exists: data !== undefined, data: () => (data ? { ...data } : undefined) };
}

function query(name: string, filters: Array<[string, unknown]> = []) {
  return {
    where: (field: string, _op: string, value: unknown) => query(name, [...filters, [field, value]]),
    orderBy: () => query(name, filters),
    limit: () => query(name, filters),
    get: async () => ({
      docs: [...col(name).entries()]
        .filter(([, d]) => filters.every(([f, v]) => d[f] === v))
        .map(([id, d]) => snapshot(id, d)),
    }),
  };
}

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminFirestore: () => ({
    collection: (name: string) => ({
      ...query(name),
      doc: (id = `auto-${++autoId}`) => ({
        id,
        get: async () => snapshot(id, col(name).get(id)),
        set: async (data: Record<string, unknown>, opts?: { merge?: boolean }) => {
          col(name).set(id, opts?.merge ? { ...col(name).get(id), ...data } : { ...data });
        },
        create: async (data: Record<string, unknown>) => {
          if (col(name).has(id)) throw Object.assign(new Error("exists"), { code: 6 });
          col(name).set(id, { ...data });
        },
        delete: async () => {
          col(name).delete(id);
        },
      }),
    }),
    batch: () => {
      const ops: Array<() => void> = [];
      return {
        update: (ref: { id: string }, data: Record<string, unknown>) => ops.push(() => void ref),
        commit: async () => ops.forEach((op) => op()),
      };
    },
  }),
}));

const cms = await import("@/lib/data/adminCms");
const { collections } = await import("@/lib/constants/collections");

function actor(role: AdminRole): AdminSession {
  return { uid: `${role.toLowerCase()}-uid`, email: null, role, approved: true, disabled: false };
}

const ROLES: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR", "VIEWER"];
const event = eventsSeed[0]!.data as Record<string, unknown>;
const draftEvent = { ...event, status: "draft" };
const publishedEvent = { ...event, status: "published" };

function seedEvents() {
  col(collections.events).set("draft-1", { ...draftEvent });
  col(collections.events).set("published-1", { ...publishedEvent });
}

async function outcome(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
    return "ok";
  } catch (error) {
    if (error instanceof cms.CmsAdminError) return error.code;
    throw error;
  }
}

beforeEach(() => {
  db.clear();
  seedEvents();
});

type Case = {
  action: string;
  run: (a: AdminSession) => Promise<unknown>;
  expected: Record<AdminRole, string>;
};

const ALL_OK = { SUPER_ADMIN: "ok", ADMIN: "ok", EDITOR: "ok", VIEWER: "ok" } as const;
const PUBLISHERS_ONLY = { SUPER_ADMIN: "ok", ADMIN: "ok", EDITOR: "FORBIDDEN", VIEWER: "FORBIDDEN" } as const;
const WRITERS = { SUPER_ADMIN: "ok", ADMIN: "ok", EDITOR: "ok", VIEWER: "FORBIDDEN" } as const;

const contentCases: Case[] = [
  { action: "list", run: (a) => cms.listCmsDocuments("events", a), expected: ALL_OK },
  { action: "get", run: (a) => cms.getCmsDocument("events", "draft-1", a), expected: ALL_OK },
  { action: "create a draft", run: (a) => cms.createCmsDocument("events", draftEvent, a), expected: WRITERS },
  {
    action: "create already published",
    run: (a) => cms.createCmsDocument("events", publishedEvent, a),
    expected: PUBLISHERS_ONLY,
  },
  {
    action: "edit a draft",
    run: (a) => cms.updateCmsDocument("events", "draft-1", { title: "Edited" }, a),
    expected: WRITERS,
  },
  {
    action: "publish via edit (status field)",
    run: (a) => cms.updateCmsDocument("events", "draft-1", { status: "published" }, a),
    expected: PUBLISHERS_ONLY,
  },
  {
    action: "edit live content",
    run: (a) => cms.updateCmsDocument("events", "published-1", { title: "Edited" }, a),
    expected: PUBLISHERS_ONLY,
  },
  {
    action: "unpublish live content to draft",
    run: (a) => cms.updateCmsDocument("events", "published-1", { status: "draft" }, a),
    expected: PUBLISHERS_ONLY,
  },
  { action: "publish", run: (a) => cms.publishCmsDocument("events", "draft-1", a), expected: PUBLISHERS_ONLY },
  { action: "archive", run: (a) => cms.archiveCmsDocument("events", "published-1", a), expected: PUBLISHERS_ONLY },
  { action: "delete (soft)", run: (a) => cms.deleteCmsDocument("events", "draft-1", a), expected: PUBLISHERS_ONLY },
  {
    action: "delete (hard)",
    run: (a) => cms.deleteCmsDocument("events", "draft-1", a, { hardDelete: true }),
    expected: PUBLISHERS_ONLY,
  },
  {
    action: "reorder",
    run: (a) => cms.reorderCmsDocuments("events", ["draft-1", "published-1"], a),
    expected: WRITERS,
  },
];

describe("content modules (events)", () => {
  for (const c of contentCases) {
    for (const role of ROLES) {
      it(`${role}: ${c.action} -> ${c.expected[role]}`, async () => {
        expect(await outcome(() => c.run(actor(role)))).toBe(c.expected[role]);
      });
    }
  }
});

describe("forbidden actions leave the data untouched", () => {
  it("an editor's attempt to publish does not change the document", async () => {
    const before = structuredClone(col(collections.events).get("draft-1"));
    await outcome(() => cms.updateCmsDocument("events", "draft-1", { status: "published" }, actor("EDITOR")));
    await outcome(() => cms.publishCmsDocument("events", "draft-1", actor("EDITOR")));
    expect(col(collections.events).get("draft-1")).toEqual(before);
  });

  it("a viewer's create writes nothing", async () => {
    await outcome(() => cms.createCmsDocument("events", draftEvent, actor("VIEWER")));
    expect(col(collections.events).size).toBe(2);
  });

  it("a viewer's hard delete removes nothing", async () => {
    await outcome(() => cms.deleteCmsDocument("events", "draft-1", actor("VIEWER"), { hardDelete: true }));
    expect(col(collections.events).has("draft-1")).toBe(true);
  });
});

describe("successful writes record the actor", () => {
  it("an editor's draft is stamped with their uid and stays a draft", async () => {
    const created = await cms.createCmsDocument("events", draftEvent, actor("EDITOR"));
    const stored = col(collections.events).get(created.id as string)!;
    expect(stored).toMatchObject({ status: "draft", createdBy: "editor-uid", updatedBy: "editor-uid" });
  });

  it("soft delete archives instead of deleting", async () => {
    const result = await cms.deleteCmsDocument("events", "published-1", actor("ADMIN"));
    expect(result).toMatchObject({ archived: true, deleted: false });
    expect(col(collections.events).get("published-1")).toMatchObject({ status: "archived", updatedBy: "admin-uid" });
  });
});

describe("site settings are admin-only, including reads", () => {
  const setting = siteSettingsSeed[0]!.data as Record<string, unknown> & { key: string };
  const ADMINS_ONLY = { SUPER_ADMIN: "ok", ADMIN: "ok", EDITOR: "FORBIDDEN", VIEWER: "FORBIDDEN" } as const;

  beforeEach(() => {
    col(collections.siteSettings).set(setting.key, { ...setting });
  });

  const cases: Case[] = [
    { action: "list", run: (a) => cms.listCmsDocuments("siteSettings", a), expected: ADMINS_ONLY },
    { action: "upsert", run: (a) => cms.upsertSiteSetting(setting as never, a), expected: ADMINS_ONLY },
    {
      action: "hard delete",
      run: (a) => cms.deleteCmsDocument("siteSettings", setting.key, a),
      expected: ADMINS_ONLY,
    },
  ];

  for (const c of cases) {
    for (const role of ROLES) {
      it(`${role}: ${c.action} -> ${c.expected[role]}`, async () => {
        expect(await outcome(() => c.run(actor(role)))).toBe(c.expected[role]);
      });
    }
  }
});

describe("modules without a draft/published lifecycle (leaders)", () => {
  const leader = leadersSeed[0]!.data as Record<string, unknown>;

  beforeEach(() => {
    col(collections.leaders).set("l1", { ...leader, active: true });
  });

  it("editors can edit leaders but cannot archive them", async () => {
    expect(await outcome(() => cms.updateCmsDocument("leaders", "l1", { name: "New Name" }, actor("EDITOR")))).toBe("ok");
    expect(await outcome(() => cms.archiveCmsDocument("leaders", "l1", actor("EDITOR")))).toBe("FORBIDDEN");
  });

  it("publishing is not a valid action for leaders", async () => {
    expect(await outcome(() => cms.publishCmsDocument("leaders", "l1", actor("ADMIN")))).toBe("UNSUPPORTED_LIFECYCLE");
  });
});

describe("tampered sessions", () => {
  it("an unapproved or disabled session object is refused even with a high role", async () => {
    const unapproved = { ...actor("SUPER_ADMIN"), approved: false } as unknown as AdminSession;
    const disabled = { ...actor("SUPER_ADMIN"), disabled: true } as unknown as AdminSession;
    for (const a of [unapproved, disabled]) {
      expect(await outcome(() => cms.listCmsDocuments("events", a))).toBe("FORBIDDEN");
      expect(await outcome(() => cms.publishCmsDocument("events", "draft-1", a))).toBe("FORBIDDEN");
    }
  });

  it("rejects document ids that could escape the collection", async () => {
    for (const id of ["a/b", "../users/x", "", "x".repeat(201)]) {
      expect(await outcome(() => cms.getCmsDocument("events", id, actor("ADMIN")))).toBe("INVALID_ID");
    }
  });
});
