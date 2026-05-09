import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import type { FormEvent } from "react";
import { useState } from "react";

import { auth, isFirebaseConfigured } from "../firebase";

function goToAdmin() {
  window.history.replaceState(null, "", "/admin");
  window.dispatchEvent(new Event("popstate"));
}

function authErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  switch (code) {
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Try again later or reset the password.";
    case "auth/popup-closed-by-user":
      return "";
    default:
      return "Could not sign in. Please try again.";
  }
}

export function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      goToAdmin();
    } catch (loginError) {
      setError(authErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSubmitting(true);

    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      goToAdmin();
    } catch (loginError) {
      setError(authErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="center-screen">
      <section className="panel stack" aria-labelledby="admin-login-heading">
        <div>
          <h1 id="admin-login-heading">Stonehill CMS Admin</h1>
          <p className="muted">Sign in with a Firebase Authentication account.</p>
        </div>

        {!isFirebaseConfigured && (
          <div className="error">
            Firebase client environment variables are missing. Admin sign-in is
            disabled until setup is complete.
          </div>
        )}

        <form className="stack" onSubmit={handleEmailLogin}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              autoComplete="email"
              disabled={!isFirebaseConfigured || submitting}
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              autoComplete="current-password"
              disabled={!isFirebaseConfigured || submitting}
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button className="button" disabled={!isFirebaseConfigured || submitting} type="submit">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button
          className="button secondary"
          disabled={!isFirebaseConfigured || submitting}
          onClick={handleGoogleLogin}
          type="button"
        >
          Continue With Google
        </button>
      </section>
    </main>
  );
}
