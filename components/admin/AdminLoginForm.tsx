"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { LogIn, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/Button";
import { safeAdminReturnTo } from "@/lib/adminRoutes";
import { getFirebaseAuth } from "@/lib/firebaseClient";
import Link from "next/link";

type AuthApiError = {
  ok: false;
  error?: {
    code?: string;
    message?: string;
  };
};

function friendlyFirebaseError(error: unknown): string {
  if (
    typeof error === "object" &&
    error &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    switch ((error as { code: string }).code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "The email or password is not correct.";
      case "auth/too-many-requests":
        return "Too many sign-in attempts. Please wait a moment and try again.";
      default:
        return "Could not sign in. Please try again.";
    }
  }

  return "Could not sign in. Please try again.";
}

export function AdminLoginForm({ returnTo }: { returnTo: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResetMessage(null);
    setLoading(true);

    const auth = getFirebaseAuth();

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const idToken = await credential.user.getIdToken(true);
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as AuthApiError | null;
        await fetch("/api/auth", { method: "DELETE" }).catch(() => undefined);
        await signOut(auth).catch(() => undefined);
        throw new Error(result?.error?.message ?? "This account is not authorized for admin access.");
      }

      router.replace(safeAdminReturnTo(returnTo));
      router.refresh();
    } catch (loginError) {
      const message = friendlyFirebaseError(loginError);
      setError(
        message === "Could not sign in. Please try again." && loginError instanceof Error
          ? loginError.message
          : message,
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    setError(null);
    setResetMessage(null);

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    setResetLoading(true);
    const auth = getFirebaseAuth();

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage("If an account with that email exists, a password reset link has been sent.");
    } catch (resetError) {
      if ((resetError as { code?: string })?.code === "auth/user-not-found") {
        setResetMessage("If an account with that email exists, a password reset link has been sent.");
      } else {
        console.error("[auth] password reset failed", resetError);
        setError("Could not send password reset email. Please try again later.");
      }
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
          <p className="font-medium leading-relaxed">{error}</p>
        </div>
      )}

      {resetMessage && (
        <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-700 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden="true" />
          <p className="font-medium leading-relaxed">{resetMessage}</p>
        </div>
      )}

      <div className="space-y-4">
        <FormField id="admin-email" label="Email Address">
          <TextInput
            id="admin-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full transition-colors focus:ring-2 focus:ring-stonehill-dark/20"
            placeholder="admin@stonehillsda.org"
          />
        </FormField>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="admin-password" className="text-sm font-medium text-slate-900">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetLoading || loading}
              className="text-sm font-medium text-stonehill-dark hover:text-stonehill-dark/80 hover:underline transition-colors disabled:opacity-50 disabled:hover:no-underline"
            >
              {resetLoading ? "Sending..." : "Forgot password?"}
            </button>
          </div>
          <TextInput
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full transition-colors focus:ring-2 focus:ring-stonehill-dark/20"
          />
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full justify-center h-11 text-base font-semibold shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn className="mr-2 h-5 w-5" aria-hidden="true" />
            Sign In to Admin Console
          </>
        )}
      </Button>
    </form>
  );
}
