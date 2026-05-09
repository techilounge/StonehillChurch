import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type FirestoreDataConverter,
  type OrderByDirection,
  type QueryConstraint,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
  type WhereFilterOp,
} from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebaseClient";
import type { ContentStatus } from "@/types/shared";

export const collections = {
  users: "users",
  homepageSlides: "homepageSlides",
  sermons: "sermons",
  events: "events",
  ministries: "ministries",
  leaders: "leaders",
  announcements: "announcements",
  resources: "resources",
  mediaAssets: "mediaAssets",
  formSubmissions: "formSubmissions",
  siteSettings: "siteSettings",
  pages: "pages",
  youtubeSettings: "youtubeSettings",
  auditLogs: "auditLogs",
} as const;

export type CollectionName = (typeof collections)[keyof typeof collections];

export const SINGLETON_DOCS = {
  youtubeSettings: "default",
} as const;

export function createConverter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore(data: T): DocumentData {
      return data;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return snapshot.data(options) as T;
    },
  };
}

export type WhereClause = [string, WhereFilterOp, unknown];
export type OrderClause = [string, OrderByDirection?];

export type QueryOptions = {
  where?: WhereClause[];
  orderBy?: OrderClause[];
  limit?: number;
};

function buildConstraints(options?: QueryOptions): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  if (options?.where) {
    for (const [field, op, value] of options.where) {
      constraints.push(where(field, op, value));
    }
  }
  if (options?.orderBy) {
    for (const [field, direction] of options.orderBy) {
      constraints.push(orderBy(field, direction ?? "asc"));
    }
  }
  if (typeof options?.limit === "number") {
    constraints.push(fsLimit(options.limit));
  }
  return constraints;
}

export async function listDocuments<T extends DocumentData>(
  collectionName: CollectionName,
  options?: QueryOptions,
): Promise<Array<T & { id: string }>> {
  const ref = collection(getFirebaseFirestore(), collectionName).withConverter(createConverter<T>());
  const snapshot = await getDocs(query(ref, ...buildConstraints(options)));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

export async function getDocument<T extends DocumentData>(
  collectionName: CollectionName,
  id: string,
): Promise<(T & { id: string }) | null> {
  const ref = doc(getFirebaseFirestore(), collectionName, id).withConverter(createConverter<T>());
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    return null;
  }
  return { id: snapshot.id, ...snapshot.data() };
}

export async function createDocument<T extends DocumentData>(
  collectionName: CollectionName,
  data: T,
) {
  return addDoc(collection(getFirebaseFirestore(), collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function upsertDocument<T extends DocumentData>(
  collectionName: CollectionName,
  id: string,
  data: T,
) {
  return setDoc(
    doc(getFirebaseFirestore(), collectionName, id),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function patchDocument<T extends DocumentData>(
  collectionName: CollectionName,
  id: string,
  data: Partial<T>,
) {
  return updateDoc(doc(getFirebaseFirestore(), collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export const PUBLISHED: ContentStatus = "published";

export function publishedQuery(extra?: QueryOptions): QueryOptions {
  return {
    ...extra,
    where: [["status", "==", PUBLISHED], ...(extra?.where ?? [])],
  };
}

export function activeAndPublishedQuery(extra?: QueryOptions): QueryOptions {
  return {
    ...extra,
    where: [
      ["status", "==", PUBLISHED],
      ["active", "==", true],
      ...(extra?.where ?? []),
    ],
  };
}
