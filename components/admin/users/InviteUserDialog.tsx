"use client";

import * as React from "react";
import { Loader2, Copy, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { FormField } from "@/components/forms/FormField";
import { TextInput } from "@/components/forms/TextInput";
import { SelectInput } from "@/components/forms/SelectInput";
import { INVITABLE_USER_ROLES, type InvitableUserRole } from "@/types/invites";

type InviteResult =
  | {
      ok: true;
      data: {
        invite: { email: string; role: string };
        delivery:
          | { method: "email"; emailSent: true; resendMessageId: string | null }
          | {
              method: "copy_link";
              emailSent: false;
              inviteLink: string;
              reason: "resend_not_configured" | "resend_failed";
              emailError?: string;
            };
      };
    }
  | { ok: false; error: { code: string; message: string } };

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export function InviteUserDialog({ open, onClose, onCreated }: Props) {
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<InvitableUserRole>("EDITOR");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<InviteResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  const reset = React.useCallback(() => {
    setEmail("");
    setName("");
    setRole("EDITOR");
    setSubmitting(false);
    setError(null);
    setResult(null);
    setCopied(false);
  }, []);

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/users/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          role,
        }),
      });
      const payload = (await response.json().catch(() => null)) as InviteResult | null;

      if (!response.ok || !payload || !payload.ok) {
        const message =
          (payload && !payload.ok && payload.error?.message) ||
          "Could not create the invite.";
        setError(message);
        setSubmitting(false);
        return;
      }

      setResult(payload);
      setSubmitting(false);
      onCreated();
    } catch {
      setError("Network error. Try again.");
      setSubmitting(false);
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; ignore.
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 id="invite-dialog-title" className="text-lg font-semibold text-slate-900">
            Invite a new user
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-900/60 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {result && result.ok ? (
          <div className="space-y-5 px-6 py-6">
            <div className="flex items-start gap-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <p>
                Invite created for <strong>{result.data.invite.email}</strong> as{" "}
                <strong>{result.data.invite.role}</strong>.
              </p>
            </div>

            {result.data.delivery.method === "email" ? (
              <p className="text-sm text-slate-900/80">
                An invite email has been sent. The link expires in 7 days.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-900/80">
                  {result.data.delivery.reason === "resend_not_configured"
                    ? "Email sending is not configured. Copy this invite link and send it to the user yourself — this is the only time it will be shown."
                    : "The invite email could not be sent. Copy this link and share it directly — this is the only time it will be shown."}
                </p>
                {result.data.delivery.emailError && (
                  <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                    {result.data.delivery.emailError}
                  </p>
                )}
                <div className="flex items-stretch gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.data.delivery.inviteLink}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 rounded-md border border-slate-200 bg-slate-50/40 px-3 py-2 text-xs text-slate-900"
                    aria-label="Invite link"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink((result.data.delivery as { inviteLink: string }).inviteLink)}
                  >
                    {copied ? "Copied" : <><Copy className="mr-1 h-3.5 w-3.5" /> Copy</>}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
            {error && (
              <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <FormField id="invite-email" label="Email address">
              <TextInput
                id="invite-email"
                type="email"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField id="invite-fullname" label="Full name (optional)">
              <TextInput
                id="invite-fullname"
                type="text"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
              />
            </FormField>

            <FormField id="invite-role" label="Role">
              <SelectInput
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as InvitableUserRole)}
              >
                {INVITABLE_USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </SelectInput>
            </FormField>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
