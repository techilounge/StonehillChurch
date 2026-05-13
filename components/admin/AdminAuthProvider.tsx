"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { ADMIN_LOGIN_PATH } from "@/lib/adminRoutes";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import type { AdminSession } from "@/lib/auth";

type AdminAuthContextValue = {
  session: AdminSession;
  signingOut: boolean;
  signOutAdmin: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({
  session,
  children,
}: {
  session: AdminSession;
  children: ReactNode;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOutAdmin = useCallback(async () => {
    setSigningOut(true);

    try {
      await fetch("/api/auth", { method: "DELETE" }).catch(() => undefined);
      await signOut(getFirebaseAuth()).catch(() => undefined);
      router.replace(ADMIN_LOGIN_PATH);
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }, [router]);

  const value = useMemo(
    () => ({ session, signingOut, signOutAdmin }),
    [session, signingOut, signOutAdmin],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  }

  return context;
}
