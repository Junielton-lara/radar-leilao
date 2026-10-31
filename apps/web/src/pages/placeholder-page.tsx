export function PlaceholderPage({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border px-6 py-16 text-center">
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-text-muted">
        Área reservada · implementação prevista na {phase}.
      </p>
    </div>
  );
}
