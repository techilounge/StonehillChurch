"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { InviteUserDialog } from "./InviteUserDialog";
import { PendingInvitesTable } from "./PendingInvitesTable";
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

export function UsersInvitesSection({ initialInvites }: { initialInvites: InviteRow[] }) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [reloadKey, setReloadKey] = React.useState(0);

  return (
    <>
      <div className="flex justify-end">
        <Button type="button" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite user
        </Button>
      </div>

      <PendingInvitesTable
        invites={initialInvites}
        reloadKey={reloadKey}
        onChanged={() => setReloadKey((k) => k + 1)}
      />

      <InviteUserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}
