/**
 * Minimal in-memory stand-ins for the Firebase Admin Firestore and Auth APIs
 * the data layer uses. Server timestamps become real Dates on write so stored
 * documents look like what the app reads back. Not a full emulator: queries
 * support equality filters and limit only.
 */
import { FieldValue } from "firebase-admin/firestore";

type Data = Record<string, unknown>;

export class FakeFirestore {
  store = new Map<string, Map<string, Data>>();
  private autoId = 0;
  /** Set to make the next runTransaction throw before running. */
  failNextTransaction: Error | null = null;

  col(name: string): Map<string, Data> {
    if (!this.store.has(name)) this.store.set(name, new Map());
    return this.store.get(name)!;
  }

  seed(name: string, id: string, data: Data) {
    this.col(name).set(id, { ...data });
  }

  get(name: string, id: string): Data | undefined {
    return this.col(name).get(id);
  }

  private resolve(data: Data): Data {
    return Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v instanceof FieldValue ? new Date() : v]),
    );
  }

  private write(name: string, id: string, data: Data, merge: boolean) {
    const resolved = this.resolve(data);
    this.col(name).set(id, merge ? { ...this.col(name).get(id), ...resolved } : resolved);
  }

  private snapshot(name: string, id: string) {
    const data = this.col(name).get(id);
    return {
      id,
      exists: data !== undefined,
      ref: this.doc(name, id),
      data: () => (data ? { ...data } : undefined),
    };
  }

  doc(name: string, id?: string) {
    const docId = id ?? `auto-${++this.autoId}`;
    return {
      id: docId,
      path: `${name}/${docId}`,
      get: async () => this.snapshot(name, docId),
      set: async (data: Data, opts?: { merge?: boolean }) => this.write(name, docId, data, !!opts?.merge),
      update: async (data: Data) => {
        if (!this.col(name).has(docId)) throw Object.assign(new Error("not found"), { code: 5 });
        this.write(name, docId, data, true);
      },
      create: async (data: Data) => {
        if (this.col(name).has(docId)) throw Object.assign(new Error("exists"), { code: 6 });
        this.write(name, docId, data, false);
      },
      delete: async () => void this.col(name).delete(docId),
    };
  }

  private query(name: string, filters: Array<[string, unknown]>, max?: number) {
    return {
      where: (field: string, _op: string, value: unknown) =>
        this.query(name, [...filters, [field, value]], max),
      orderBy: () => this.query(name, filters, max),
      limit: (n: number) => this.query(name, filters, n),
      get: async () => {
        const docs = [...this.col(name).entries()]
          .filter(([, d]) => filters.every(([f, v]) => d[f] === v))
          .slice(0, max)
          .map(([id]) => this.snapshot(name, id));
        return { docs, size: docs.length, empty: docs.length === 0 };
      },
    };
  }

  collection(name: string) {
    return {
      ...this.query(name, []),
      doc: (id?: string) => this.doc(name, id),
      add: async (data: Data) => {
        const ref = this.doc(name);
        await ref.set(data);
        return ref;
      },
    };
  }

  async runTransaction<T>(
    fn: (tx: {
      get: (ref: { path: string }) => Promise<ReturnType<FakeFirestore["snapshot"]>>;
      set: (ref: { path: string }, data: Data, opts?: { merge?: boolean }) => void;
    }) => Promise<T>,
  ): Promise<T> {
    if (this.failNextTransaction) {
      const error = this.failNextTransaction;
      this.failNextTransaction = null;
      throw error;
    }
    // Writes are buffered and applied only if fn resolves, like Firestore.
    const writes: Array<() => void> = [];
    const split = (path: string) => path.split("/") as [string, string];
    const result = await fn({
      get: async (ref) => this.snapshot(...split(ref.path)),
      set: (ref, data, opts) => writes.push(() => this.write(...split(ref.path), data, !!opts?.merge)),
    });
    writes.forEach((w) => w());
    return result;
  }
}

export class FakeAuth {
  users = new Map<string, { uid: string; email: string; password: string; emailVerified: boolean; displayName?: string }>();
  deleted: string[] = [];
  private nextUid = 0;
  /** Called after a user is created; lets a test simulate a race. */
  afterCreate: ((uid: string) => void) | null = null;

  async createUser(input: { email: string; password: string; displayName?: string; emailVerified?: boolean }) {
    if ([...this.users.values()].some((u) => u.email === input.email)) {
      throw Object.assign(new Error("exists"), { code: "auth/email-already-exists" });
    }
    const uid = `uid-${++this.nextUid}`;
    this.users.set(uid, { uid, email: input.email, password: input.password, emailVerified: !!input.emailVerified, displayName: input.displayName });
    this.afterCreate?.(uid);
    return { uid };
  }

  async deleteUser(uid: string) {
    this.users.delete(uid);
    this.deleted.push(uid);
  }
}

/** Per-test-file singletons (vitest isolates modules per file). */
export const fakeDb = new FakeFirestore();
export const fakeAuth = new FakeAuth();
export const fakeClaims = new Map<string, Record<string, unknown>>();

export function resetFakes() {
  fakeDb.store.clear();
  fakeDb.failNextTransaction = null;
  fakeAuth.users.clear();
  fakeAuth.deleted.length = 0;
  fakeAuth.afterCreate = null;
  fakeClaims.clear();
}

/** Factory for vi.mock("@/lib/firebaseAdmin", ...). */
export function firebaseAdminMock() {
  return {
    getAdminFirestore: () => fakeDb,
    getAdminAuth: () => fakeAuth,
    syncUserClaims: async (uid: string, claims: Record<string, unknown>) => {
      fakeClaims.set(uid, claims);
    },
  };
}
