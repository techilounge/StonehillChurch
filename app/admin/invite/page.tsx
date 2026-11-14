import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { AcceptInviteForm } from "@/components/admin/users/AcceptInviteForm";
import { validateUserInviteToken, InviteFlowError } from "@/lib/data/userInvites";

export const dynamic = "force-dynamic";

type InvitePageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AcceptInvitePage({ searchParams }: InvitePageProps) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  let preview: { email: string; role: string; expiresAt: string | null } | null = null;
  let errorMessage: string | null = null;

  if (!token) {
    errorMessage = "This invite link is missing a token.";
  } else {
    try {
      const invite = await validateUserInviteToken(token);
      preview = {
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      };
    } catch (error) {
      if (error instanceof InviteFlowError) {
        errorMessage =
          error.code === "INVITE_EXPIRED"
            ? "This invite has expired. Ask an administrator to send a new one."
            : "This invite is no longer valid. Ask an administrator to send a new one.";
      } else {
        console.error("[invite page] lookup failed:", error);
        errorMessage = "This invite is no longer valid. Ask an administrator to send a new one.";
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[460px]">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stonehill-dark/10 ring-8 ring-stonehill-dark/5">
            <ShieldCheck className="h-8 w-8 text-stonehill-dark" aria-hidden="true" />
          </div>
          <p className="mb-1 text-sm font-bold uppercase tracking-widest text-stonehill-dark">
            Stonehill SDA Church
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Accept Invitation
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-900/70">
            Set up your admin account to finish onboarding.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/60 bg-white px-6 py-10 shadow-xl shadow-stone-200/40 sm:px-10">
          {errorMessage ? (
            <div className="space-y-4 text-center">
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {errorMessage}
              </p>
              <Link
                href="/admin/login"
                className="inline-block text-sm font-medium text-stonehill-dark hover:underline"
              >
                Go to sign in
              </Link>
            </div>
          ) : preview ? (
            <AcceptInviteForm
              token={token}
              email={preview.email}
              role={preview.role}
              expiresAt={preview.expiresAt}
            />
          ) : null}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-900/50">
            &copy; {new Date().getFullYear()} Stonehill Seventh-day Adventist Church. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
