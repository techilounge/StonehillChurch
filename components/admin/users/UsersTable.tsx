"use client";

import * as React from "react";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import type { Serialized } from "@/lib/data/utils";
import type { AppUser, UserRole } from "@/types/auth";
import { USER_ROLES } from "@/types/auth";

type UsersTableProps = {
  users: Serialized<AppUser>[];
  currentUid: string;
};

type RowState = {
  role: UserRole;
  approved: boolean;
  disabled: boolean;
  saving: boolean;
  error: string | null;
};

function statusLabel(approved: boolean, disabled: boolean): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "success" | "outline";
} {
  if (disabled) return { label: "Disabled", variant: "destructive" };
  if (!approved) return { label: "Pending approval", variant: "secondary" };
  return { label: "Active", variant: "success" };
}

export function UsersTable({ users, currentUid }: UsersTableProps) {
  const [rows, setRows] = React.useState<Record<string, RowState>>(() =>
    Object.fromEntries(
      users.map((u) => [
        u.uid,
        {
          role: u.role,
          approved: u.approved === true,
          disabled: u.disabled === true,
          saving: false,
          error: null,
        },
      ]),
    ),
  );

  const setRow = React.useCallback(
    (uid: string, patch: Partial<RowState>) => {
      setRows((prev) => ({ ...prev, [uid]: { ...prev[uid], ...patch } }));
    },
    [],
  );

  const submitChange = React.useCallback(
    async (uid: string, change: { role?: UserRole; approved?: boolean; disabled?: boolean }) => {
      setRow(uid, { saving: true, error: null });
      try {
        const response = await fetch(`/api/admin/users/${uid}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(change),
        });
        const payload = (await response.json().catch(() => null)) as
          | { ok: true; data: { user: Serialized<AppUser> } }
          | { ok: false; error: { code: string; message: string } }
          | null;

        if (!response.ok || !payload || !payload.ok) {
          const message =
            (payload && !payload.ok && payload.error?.message) ||
            "Could not update this user.";
          setRow(uid, { saving: false, error: message });
          return;
        }

        const next = payload.data.user;
        setRow(uid, {
          role: next.role,
          approved: next.approved === true,
          disabled: next.disabled === true,
          saving: false,
          error: null,
        });
      } catch (error) {
        console.error("[UsersTable] update failed:", error);
        setRow(uid, { saving: false, error: "Network error. Try again." });
      }
    },
    [setRow],
  );

  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
        No users found.
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/40">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">Name</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">Email</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">Role</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-900/70">Status</th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-900/70">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {users.map((user) => {
              const row = rows[user.uid];
              const isSelf = user.uid === currentUid;
              const status = statusLabel(row.approved, row.disabled);

              return (
                <tr key={user.uid}>
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <span className="font-medium">{user.name}</span>
                    {isSelf && (
                      <span className="ml-2 text-xs text-slate-500">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900/80">{user.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      className="min-h-[44px] rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors"
                      value={row.role}
                      disabled={isSelf || row.saving}
                      onChange={(event) => {
                        const nextRole = event.target.value as UserRole;
                        if (nextRole === row.role) return;
                        submitChange(user.uid, { role: nextRole });
                      }}
                      aria-label={`Role for ${user.name}`}
                    >
                      {USER_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:justify-end">
                      {!row.approved && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSelf || row.saving}
                          onClick={() => submitChange(user.uid, { approved: true })}
                        >
                          Approve
                        </Button>
                      )}
                      {row.approved && !row.disabled && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSelf || row.saving}
                          onClick={() => submitChange(user.uid, { disabled: true })}
                        >
                          Disable
                        </Button>
                      )}
                      {row.disabled && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSelf || row.saving}
                          onClick={() => submitChange(user.uid, { disabled: false })}
                        >
                          Re-enable
                        </Button>
                      )}
                    </div>
                    {row.error && (
                      <p className="mt-1 text-xs text-red-600">{row.error}</p>
                    )}
                    {row.saving && (
                      <p className="mt-1 text-xs text-slate-500">Saving…</p>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {users.map((user) => {
          const row = rows[user.uid];
          const isSelf = user.uid === currentUid;
          const status = statusLabel(row.approved, row.disabled);

          return (
            <div key={user.uid} className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900 truncate">
                    {user.name}
                    {isSelf && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                  </div>
                  <div className="text-sm text-slate-900/80 truncate">{user.email}</div>
                </div>
                <Badge variant={status.variant} className="shrink-0">{status.label}</Badge>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-slate-900/70">Role</label>
                <select
                  className="w-full min-h-[44px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stonehill-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors"
                  value={row.role}
                  disabled={isSelf || row.saving}
                  onChange={(event) => {
                    const nextRole = event.target.value as UserRole;
                    if (nextRole === row.role) return;
                    submitChange(user.uid, { role: nextRole });
                  }}
                  aria-label={`Role for ${user.name}`}
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                {!row.approved && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={isSelf || row.saving}
                    onClick={() => submitChange(user.uid, { approved: true })}
                  >
                    Approve
                  </Button>
                )}
                {row.approved && !row.disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={isSelf || row.saving}
                    onClick={() => submitChange(user.uid, { disabled: true })}
                  >
                    Disable
                  </Button>
                )}
                {row.disabled && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    disabled={isSelf || row.saving}
                    onClick={() => submitChange(user.uid, { disabled: false })}
                  >
                    Re-enable
                  </Button>
                )}
              </div>
              
              {(row.error || row.saving) && (
                <div className="text-right">
                  {row.error && <p className="text-xs text-red-600">{row.error}</p>}
                  {row.saving && <p className="text-xs text-slate-500">Saving…</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
