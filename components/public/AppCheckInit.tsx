"use client";

import { useEffect } from "react";
import { initializeFirebaseAppCheck } from "@/lib/firebaseClient";

export function AppCheckInit() {
  useEffect(() => {
    // Eagerly initialize Firebase App Check on the client
    initializeFirebaseAppCheck();
  }, []);

  return null;
}
