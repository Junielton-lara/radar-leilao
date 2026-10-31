import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';

interface IntegrationStatus {
  provider: string;
  active: boolean;
  configured: boolean;
  note: string | null;
  updatedAt: string;
}

export function SettingsPage() {
  const productQuery = useQuery({
    queryKey: ['product'],
    queryFn: () =>
      apiRequest<{ name: string; subtitle: string; byline: string }>(
        '/settings/product',
      ),
  });

  const integrationsQuery = useQuery({
    queryKey: ['integrations'],
    queryFn: () => apiRequest<IntegrationStatus[]>('/settings/integrations'),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="font-display text-2xl font-bold">Configurações</h1>

      <section className="rounded-2xl border border-border bg-bg-card p-5">
        <h2 className="text-sm font-semibold">Produto</h2>
        <p className="mt-2 text-sm text-text-muted">
          {productQuery.data?.name ?? 'LanceX'} —{' '}
          {productQuery.data?.subtitle ?? 'Radar Inteligente de Leilões'}
        </p>
        <p className="mt-1 text-xs text-text-dim">
          {productQuery.data?.byline ?? 'by +Gestor'}
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-bg-card p-5">
        <h2 className="text-sm font-semibold">Integrações</h2>
        <div className="mt-3 space-y-2">
          {(integrationsQuery.data ?? []).map((item) => (
            <div
              key={item.provider}
              className="rounded-xl border border-border-subtle px-3 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium capitalize">
                  {item.provider}
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    item.active
                      ? 'bg-success/15 text-success'
                      : 'bg-white/5 text-text-dim'
                  }`}
                >
                  {item.active ? 'ativo' : 'não configurado'}
                </span>
              </div>
              {item.note ? (
                <p className="mt-1 text-xs text-text-muted">{item.note}</p>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
