type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PublicPageShell({ eyebrow, title, description }: PublicPageShellProps) {
  return (
    <section className="mx-auto min-h-[58vh] max-w-7xl px-6 py-20">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stonehill-dark">{eyebrow}</p>
        <h1 className="text-4xl font-semibold text-stonehill-primary md:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-500">{description}</p>
      </div>
    </section>
  );
}
