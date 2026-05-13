"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { Button } from "@/components/shared/Button";

type AcceptInviteFormProps = {
  token: string;
  email: string;
  role: string;
  expiresAt: string | null;
};

type AcceptResponse =
  | { ok: true; data: { user: { email: string } } }
  | { ok: false; error: { code: string; message: string } };

function formatExpiry(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function AcceptInviteForm({ token, email, role, expiresAt }: AcceptInviteFormProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/users/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, name: name.trim() || undefined }),
      });
      const payload = (await response.json().catch(() => null)) as AcceptResponse | null;

      if (!response.ok || !payload || !payload.ok) {
        const message =
          (payload && !payload.ok && payload.error?.message) ||
          "Could not accept this invite. Try again or contact your administrator.";
        setError(message);
        setLoading(false);
        return;
      }

      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-7 w-7 text-green-700" aria-hidden="true" />
        </div>
        <div>
          <p className="text-lg font-semibold text-stonehill-ink">Account created</p>
          <p className="mt-1 text-sm text-stonehill-ink/70">
            Sign in with your email and the password you just set.
          </p>
        </div>
        <Link
          href="/admin/login"
          className="inline-flex items-center justify-center rounded-md bg-stonehill-evergreen px-4 py-2 text-sm font-medium text-white hover:bg-stonehill-forest"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  const expiry = formatExpiry(expiresAt);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-md border border-stonehill-line bg-stonehill-cream/50 px-4 py-3 text-sm">
        <p className="text-stonehill-ink">
          <span className="font-semibold">{email}</span>
        </p>
        <p className="mt-1 text-xs uppercase tracking-wider text-stonehill-forest">
          Role: {role}
        </p>
        {expiry && (
          <p className="mt-1 text-xs text-stonehill-ink/60">Invite expires {expiry}</p>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="font-medium leading-relaxed">{error}</p>
        </div>
      )}

      <FormField id="invite-name" label="Full name">
        <TextInput
          id="invite-name"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </FormField>

      <FormField
        id="invite-password"
        label="Password"
        description="At least 12 characters, with one letter and one number."
      >
        <TextInput
          id="invite-password"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={200}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormField>

      <FormField id="invite-password-confirm" label="Confirm password">
        <TextInput
          id="invite-password-confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={200}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </FormField>

      <Button type="submit" disabled={loading} className="w-full">
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
