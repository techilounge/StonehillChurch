import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { type AdminRole, canAccessAdmin, normalizeRole } from "../../lib/permissions";
import { auth, db } from "../firebase";

export type AdminUserProfile = {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  approved: boolean;
  disabled: boolean;
  photoURL?: string | null;
};

type AdminAuthContextValue = {
  firebaseUser: FirebaseUser | null;
  profile: AdminUserProfile | null;
  loading: boolean;
  error: string | null;
  canAccessAdmin: boolean;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

function displayNameFromProfile(data: Record<string, unknown>, user: FirebaseUser): string {
  const firstName = typeof data.firstName === "string" ? data.firstName : "";
  const lastName = typeof data.lastName === "string" ? data.lastName : "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || user.displayName || user.email || "Admin user";
}

async function loadUserProfile(user: FirebaseUser): Promise<AdminUserProfile> {
  const snapshot = await getDoc(doc(db, "users", user.uid));

  if (!snapshot.exists()) {
    throw new Error("No approved admin profile was found for this account.");
  }

  const data = snapshot.data();
  const role = normalizeRole(data.role);

  if (!role) {
    throw new Error("This account does not have a valid admin role.");
  }

  const profile: AdminUserProfile = {
    uid: user.uid,
    email: typeof data.email === "string" ? data.email : user.email ?? "",
    displayName: displayNameFromProfile(data, user),
    role,
    approved: data.approved === true,
    disabled: data.disabled === true,
    photoURL:
      typeof data.profileImageUrl === "string"
        ? data.profileImageUrl
        : user.photoURL,
  };

  if (!canAccessAdmin(profile)) {
    throw new Error("This account is not authorized for the Admin Console.");
  }

  return profile;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<AdminUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadProfile = useCallback(async () => {
    const user = auth.currentUser;

    if (!user) {
      setProfile(null);
      setError(null);
      return;
    }

    try {
      setError(null);
      setProfile(await loadUserProfile(user));
    } catch (profileError) {
      setProfile(null);
      setError(
        profileError instanceof Error
          ? profileError.message
          : "Could not load the admin profile.",
      );
    }
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setFirebaseUser(user);
      setProfile(null);
      setError(null);

      if (user) {
        try {
          setProfile(await loadUserProfile(user));
        } catch (profileError) {
          setError(
            profileError instanceof Error
              ? profileError.message
              : "Could not load the admin profile.",
          );
        }
      }

      setLoading(false);
    });
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      firebaseUser,
      profile,
      loading,
      error,
      canAccessAdmin: canAccessAdmin(profile),
      logout: () => signOut(auth),
      reloadProfile,
    }),
    [error, firebaseUser, loading, profile, reloadProfile],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextValue {
  const context = useContext(AdminAuthContext);

  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  }

  return context;
}
