"use client";

import * as React from "react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import type { UserInviteStatus } from "@/types/invites";

type InviteRow = {
  id: string;
  email: string;
  role: string;
  status: UserInviteStatus;
  expiresAt?: string | null;
  createdAt?: string | null;
  invitedByEmail?: string | null;
  emailSentAt?: string | null;
};

type Props = {
  invites: InviteRow[];
  reloadKey: number;
  onChanged: () => void;
};

type ListResponse =
  | { ok: true; data: { invites: InviteRow[] } }
  | { ok: false; error: { code: string; message: string } };

function statusVariant(
  status: UserInviteStatus,
): "default" | "secondary" | "destructive" | "success" | "outline" {
  switch (status) {
    case "pending":
      return "secondary";
    case "accepted":
      return "success";
    case "revoked":
    case "expired":
      return "destructive";
    default:
      return "outline";
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export function PendingInvitesTable({ invites: initial, reloadKey, onChanged }: Props) {
  const [invites, setInvites] = React.useState<InviteRow[]>(initial);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [revokingId, setRevokingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setInvites(initial);
  }, [initial]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/users/invites", { credentials: "include" });
        const payload = (await response.json().catch(() => null)) as ListResponse | null;
        if (cancelled) return;
        if (!response.ok || !payload || !payload.ok) {
          setError((payload && !payload.ok && payload.error?.message) || "Could not load invites.");
          return;
        }
        setInvites(payload.data.invites);
      } catch {
        if (!cancelled) setError("Network error loading invites.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (reloadKey > 0) load();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  async function revoke(id: string) {
    setRevokingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/invites/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: { message?: string } }
          | null;
        setError(payload?.error?.message ?? "Could not revoke invite.");
        return;
      }
      onChanged();
    } catch {
      setError("Network error revoking invite.");
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Invitations</h2>
        {loading && <span className="text-xs text-slate-500">Refreshing…</span>}
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}
      <>
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">Invited by</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">Expires</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-900/70">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                    No invitations yet.
                  </td>
                </tr>
              ) : (
                invites.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 text-sm text-slate-900">{row.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-900/80">{row.role}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900/80">
                      {row.invitedByEmail ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900/80">
                      {formatDate(row.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {row.status === "pending" ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={revokingId === row.id}
                          onClick={() => revoke(row.id)}
                        >
                          {revokingId === row.id ? "Revoking…" : "Revoke"}
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {invites.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              No invitations yet.
            </div>
          ) : (
            invites.map((row) => (
              <div key={row.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 truncate">{row.email}</div>
                    <div className="text-sm text-slate-900/80 truncate">Role: {row.role}</div>
                  </div>
                  <Badge variant={statusVariant(row.status)} className="shrink-0">{row.status}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-900/80">
                  <div>
                    <span className="block text-xs font-medium text-slate-900/60">Invited by</span>
                    <span className="truncate block">{row.invitedByEmail ?? "—"}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-900/60">Expires</span>
                    <span className="truncate block">{formatDate(row.expiresAt)}</span>
                  </div>
                </div>

                {row.status === "pending" && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={revokingId === row.id}
                      onClick={() => revoke(row.id)}
                    >
                      {revokingId === row.id ? "Revoking…" : "Revoke Invitation"}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </>
    </div>
  );
}
