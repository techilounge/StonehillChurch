import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let appCheckInitialized = false;
let appCheckInstance: AppCheck | null = null;

type AppCheckDebugGlobal = typeof globalThis & {
  FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
};

function appCheckSiteKey(): string | null {
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY?.trim();
  return siteKey || null;
}

function appCheckDebugToken(): boolean | string | null {
  const token = process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN?.trim();

  if (!token || token === "0" || token.toLowerCase() === "false") {
    return null;
  }

  return token.toLowerCase() === "true" ? true : token;
}

export function getFirebaseClientApp(): FirebaseApp {
  const existingApp = getApps()[0];
  return existingApp ?? initializeApp(firebaseConfig);
}

export function initializeFirebaseAppCheck(): AppCheck | null {
  if (typeof window === "undefined" || appCheckInitialized) {
    return appCheckInstance;
  }

  const siteKey = appCheckSiteKey();
  if (!siteKey) {
    return null;
  }

  const debugToken = appCheckDebugToken();
  if (debugToken) {
    (globalThis as AppCheckDebugGlobal).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
  }

  try {
    appCheckInstance = initializeAppCheck(getFirebaseClientApp(), {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckInitialized = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("already initialized") && !message.includes("already-initialized")) {
      console.error("[firebase] App Check initialization failed.", error);
    }
    appCheckInitialized = true;
  }

  return appCheckInstance;
}

export function getFirebaseAuth(): Auth {
  initializeFirebaseAppCheck();
  return getAuth(getFirebaseClientApp());
}

export function getFirebaseFirestore(): Firestore {
  initializeFirebaseAppCheck();
  return getFirestore(getFirebaseClientApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  initializeFirebaseAppCheck();
  return getStorage(getFirebaseClientApp());
}
