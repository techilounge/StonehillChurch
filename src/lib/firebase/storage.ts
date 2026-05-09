import { ref, type StorageReference } from "firebase/storage";

import { firebaseStorage } from "./client";

export const STORAGE_FOLDERS = {
  homepageSlides: "homepage-slides",
  sermons: "sermons",
  events: "events",
  ministries: "ministries",
  leaders: "leaders",
  announcements: "announcements",
  resources: "resources",
  media: "media",
} as const;

export function getStorageFolderRef(folder: keyof typeof STORAGE_FOLDERS): StorageReference {
  return ref(firebaseStorage, STORAGE_FOLDERS[folder]);
}

