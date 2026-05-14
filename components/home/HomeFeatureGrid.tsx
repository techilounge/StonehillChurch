export function HomeFeatureGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {["Worship", "Community", "Service"].map((item) => (
        <div key={item} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-stonehill-primary">{item}</h2>
        </div>
      ))}
    </div>
  );
}
