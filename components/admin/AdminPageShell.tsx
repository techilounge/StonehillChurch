import type { ReactNode } from "react";

type AdminPageShellProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function AdminPageShell({ title, description, children }: AdminPageShellProps) {
  return (
    <section>
      <div className="border-b border-slate-200 pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-stonehill-dark">Admin Console</p>
        <h1 className="mt-3 text-3xl font-semibold text-stonehill-primary">{title}</h1>
        <p className="mt-3 max-w-2xl text-slate-500">{description}</p>
      </div>
      {children ? (
        <div className="mt-8">{children}</div>
      ) : (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm text-slate-500">CMS module foundation. Data models, forms, and role checks will be implemented in the next phase.</p>
        </div>
      )}
    </section>
  );
}
