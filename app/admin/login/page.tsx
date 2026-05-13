import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { ADMIN_DEFAULT_PATH, safeAdminReturnTo } from "@/lib/adminRoutes";
import { getCurrentAdminSession } from "@/lib/api/adminSession";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{
    returnTo?: string;
    reason?: string;
  }>;
};

function reasonMessage(reason: string | undefined): string | null {
  switch (reason) {
    case "email_unverified":
      return "Your email address has not been verified in Firebase Authentication. Ask an administrator to mark it as verified before signing in.";
    case "unapproved":
      return "Your account is signed in, but it has not been approved for admin access.";
    case "forbidden":
      return "Your account does not have permission to open that admin page.";
    case "unauthenticated":
      return "Please sign in to continue.";
    default:
      return null;
  }
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const returnTo = safeAdminReturnTo(params.returnTo ?? ADMIN_DEFAULT_PATH);
  const authResult = await getCurrentAdminSession("admin:access");

  if (authResult.ok) {
    redirect(returnTo);
  }

  const message = reasonMessage(params.reason);

  return (
    <main className="flex min-h-screen items-center justify-center bg-stonehill-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[420px]">
        {/* Header / Logo section */}
        <div className="mb-8 text-center sm:mx-auto sm:w-full sm:max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-stonehill-forest/10 mb-4 ring-8 ring-stonehill-forest/5">
            <ShieldCheck className="h-8 w-8 text-stonehill-forest" aria-hidden="true" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest text-stonehill-forest mb-1">
            Stonehill SDA Church
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-stonehill-ink">
            Admin Console
          </h1>
          <p className="mt-2 text-sm leading-6 text-stonehill-ink/70">
            Sign in with an approved staff account to continue.
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-stone-200/60 bg-white px-6 py-10 shadow-xl shadow-stone-200/40 sm:px-10">
          {message && (
            <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm">
              {message}
            </div>
          )}

          <AdminLoginForm returnTo={returnTo} />
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-stonehill-ink/50">
            &copy; {new Date().getFullYear()} Stonehill Seventh-day Adventist Church. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}
