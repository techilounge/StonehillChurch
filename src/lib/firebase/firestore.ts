import { collection, type CollectionReference, type DocumentData } from "firebase/firestore";

import { firebaseDb } from "./client";

export function getCollectionRef(path: string): CollectionReference<DocumentData> {
  return collection(firebaseDb, path);
}

