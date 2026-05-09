type AdminPlaceholderPageProps = {
  title: string;
};

export function AdminPlaceholderPage({ title }: AdminPlaceholderPageProps) {
  return (
    <section className="w-full">
      <p className="mb-2 text-sm font-semibold uppercase tracking-[0.08em] text-accent-dark">
        Phase 1 Admin Shell
      </p>
      <h1 className="text-heading-lg font-heading text-primary">{title}</h1>
      <div className="mt-6 rounded-card border border-primary/10 bg-white p-6 shadow-card">
        <p className="text-text-muted">[PHASE 1 TEMPORARY ADMIN PLACEHOLDER]</p>
      </div>
    </section>
  );
}

