import { redirect } from "next/navigation";
import { PageHeader } from "@/components/admin/PageHeader";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { UsersInvitesSection } from "@/components/admin/users/UsersInvitesSection";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { listAdminUsers } from "@/lib/data/users";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { collections } from "@/lib/constants/collections";
import { serializeData } from "@/lib/data/utils";
import type { UserInvite, UserInviteStatus } from "@/types/invites";

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

async function listInvitesForPage(): Promise<InviteRow[]> {
  try {
    const snapshot = await getAdminFirestore()
      .collection(collections.userInvites)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    return snapshot.docs.map((doc) => {
      const data = serializeData({ id: doc.id, ...(doc.data() as UserInvite) }) as Record<
        string,
        unknown
      >;
      delete data.tokenHash;
      return data as unknown as InviteRow;
    });
  } catch (error) {
    console.error("[users page] failed to load invites:", error);
    return [];
  }
}

export default async function UsersAdminPage() {
  const auth = await getCurrentAdminSession("users:manage");

  if (!auth.ok) {
    // Layout already redirects unauthenticated requests; this catches the
    // approved-but-non-SUPER_ADMIN case.
    redirect("/admin/dashboard");
  }

  const [users, invites] = await Promise.all([listAdminUsers(), listInvitesForPage()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage admin users, roles, and permission assignments."
      />
      <UsersInvitesSection initialInvites={invites} />
      <UsersTable users={users} currentUid={auth.session.uid} />
    </div>
  );
}
