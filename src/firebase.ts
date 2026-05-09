import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const existingApp = getApps()[0];

const fallbackFirebaseConfig = {
  apiKey: "missing",
  appId: "missing",
  authDomain: "missing.firebaseapp.com",
  messagingSenderId: "missing",
  projectId: "missing",
  storageBucket: "missing.appspot.com",
};
const appConfig = isFirebaseConfigured ? firebaseConfig : fallbackFirebaseConfig;

export const firebaseApp = existingApp ?? initializeApp(appConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
