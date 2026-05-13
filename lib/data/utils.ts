import "server-only";

const DEFAULT_RUNTIME_READ_TIMEOUT_MS = 5000;
const DEFAULT_BUILD_READ_TIMEOUT_MS = 750;
const configuredReadTimeout = Number(process.env.FIRESTORE_READ_TIMEOUT_MS);

const DEFAULT_READ_TIMEOUT_MS = Number.isFinite(configuredReadTimeout)
  ? configuredReadTimeout
  : process.env.NEXT_PHASE === "phase-production-build"
    ? DEFAULT_BUILD_READ_TIMEOUT_MS
    : DEFAULT_RUNTIME_READ_TIMEOUT_MS;

const loggedFallbackContexts = new Set<string>();

class FirestoreReadTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Firestore read timed out after ${timeoutMs}ms.`);
    this.name = "FirestoreReadTimeoutError";
  }
}

const TIMESTAMP_FIELDS = [
  "createdAt",
  "updatedAt",
  "publishedAt",
  "sermonDate",
  "startDateTime",
  "endDateTime",
  "startDate",
  "endDate",
  "statusUpdatedAt",
  "lastLoginAt",
  "expiresAt",
  "acceptedAt",
  "revokedAt",
  "emailSentAt",
] as const;

type TimestampField = (typeof TIMESTAMP_FIELDS)[number];
type TimestampKeys<T> = Extract<keyof T, TimestampField>;

export type Serialized<T> = Omit<T, TimestampKeys<T>> & {
  id: string;
} & {
  [K in TimestampKeys<T>]?: string | null;
};

function hasToDate(value: unknown): value is { toDate: () => Date } {
  return (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  );
}

export function serializeFirestoreTimestamp(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (hasToDate(value)) {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return null;
}

export function serializeData<T extends object>(data: T): Serialized<T> {
  const serialized = Object.assign({}, data) as Record<string, unknown>;

  for (const field of TIMESTAMP_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(serialized, field)) {
      serialized[field] = serializeFirestoreTimestamp(serialized[field]);
    }
  }

  return serialized as Serialized<T>;
}

export function logDataFallback(context: string, error: unknown): void {
  if (loggedFallbackContexts.has(context)) {
    return;
  }

  loggedFallbackContexts.add(context);
  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : typeof error === "string"
        ? error
        : "Unknown error";

  process.stdout.write(`[data] ${context}: using fallback after read failure. ${detail}\n`);
}

export function withReadTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DEFAULT_READ_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new FirestoreReadTimeoutError(timeoutMs));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}
