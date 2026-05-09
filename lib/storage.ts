import { getDownloadURL, ref, uploadBytes, type UploadMetadata } from "firebase/storage";
import { getFirebaseStorage } from "@/lib/firebaseClient";

export const storageFolders = {
  images: "images",
  sermons: "sermons",
  resources: "resources",
  forms: "forms",
} as const;

export function getStoragePath(folder: keyof typeof storageFolders, fileName: string) {
  const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
  return `${storageFolders[folder]}/${Date.now()}-${safeFileName}`;
}

export async function uploadPublicFile(file: File, folder: keyof typeof storageFolders, metadata?: UploadMetadata) {
  const path = getStoragePath(folder, file.name);
  const fileRef = ref(getFirebaseStorage(), path);
  const snapshot = await uploadBytes(fileRef, file, metadata);
  const url = await getDownloadURL(snapshot.ref);

  return {
    path,
    url,
    contentType: snapshot.metadata.contentType,
    size: snapshot.metadata.size,
  };
}
