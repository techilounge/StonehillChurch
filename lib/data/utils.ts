import "server-only";

const DEFAULT_READ_TIMEOUT_MS = 5000;

export type Serialized<T> = Omit<T, "createdAt" | "updatedAt" | "publishedAt" | "sermonDate" | "startDateTime" | "endDateTime" | "startDate" | "endDate"> & {
  id: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  sermonDate?: string | null;
  startDateTime?: string | null;
  endDateTime?: string | null;
  startDate?: string | null;
  endDate?: string | null;
};

// Helper to serialize Firestore timestamps to strings for Client Components
export function serializeData<T extends { id?: string; [key: string]: any }>(data: T): Serialized<T> {
  const serialized = { ...data } as any;

  // Convert known timestamp fields to ISO strings
  const timestampFields = [
    "createdAt",
    "updatedAt",
    "publishedAt",
    "sermonDate",
    "startDateTime",
    "endDateTime",
    "startDate",
    "endDate"
  ];

  for (const field of timestampFields) {
    if (serialized[field] && typeof serialized[field].toDate === "function") {
      serialized[field] = serialized[field].toDate().toISOString();
    } else if (serialized[field] instanceof Date) {
      serialized[field] = serialized[field].toISOString();
    } else if (typeof serialized[field] === "string") {
      // Already a string, do nothing
    } else {
      serialized[field] = null;
    }
  }

  return serialized as Serialized<T>;
}

export function withReadTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DEFAULT_READ_TIMEOUT_MS,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("Firestore read timed out.")), timeoutMs);
    }),
  ]);
}
