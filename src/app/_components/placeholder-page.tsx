type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
};

export function PlaceholderPage({ eyebrow, title }: PlaceholderPageProps) {
  return (
    <div className="container-content section-padding">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.08em] text-accent-dark">
        {eyebrow}
      </p>
      <h1 className="max-w-3xl text-display-sm font-heading text-primary md:text-display">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-body-lg text-text-muted">
        [PHASE 1 TEMPORARY PLACEHOLDER]
      </p>
    </div>
  );
}

