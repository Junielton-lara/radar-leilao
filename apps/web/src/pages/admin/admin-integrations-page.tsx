import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EndpointFallback } from '@/features/admin/endpoint-fallback';
import {
  adminApi,
  isEndpointUnavailable,
  type IntegrationSettings,
} from '@/lib/admin-api';
import { apiRequest } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

const PROVIDERS = ['tavily', 'ai'] as const;

export function AdminIntegrationsPage() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<
    Record<string, { apiKey: string; active: boolean; note: string }>
  >({});

  const listQuery = useQuery({
    queryKey: ['admin-integrations'],
    queryFn: async (): Promise<IntegrationSettings[]> => {
      try {
        return await adminApi.listIntegrations();
      } catch (err) {
        if (!isEndpointUnavailable(err)) throw err;
        // fallback list path used by settings page
        return apiRequest<IntegrationSettings[]>('/settings/integrations');
      }
    },
  });

  const [testResults, setTestResults] = useState<
    Record<string, { ok: boolean; message: string; latencyMs?: number }>
  >({});

  const testMutation = useMutation({
    mutationFn: (provider: string) => adminApi.testIntegration(provider),
    onSuccess: (data, provider) => {
      setTestResults((prev) => ({ ...prev, [provider]: data }));
    },
    onError: (err, provider) => {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          ok: false,
          message: (err as Error).message,
        },
      }));
    },
  });

  const saveMutation = useMutation({
    mutationFn: (provider: string) => {
      const draft = drafts[provider] ?? {
        apiKey: '',
        active: true,
        note: '',
      };
      return adminApi.putIntegration(provider, {
        apiKey: draft.apiKey || undefined,
        active: draft.active,
        note: draft.note || undefined,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-integrations'] });
    },
  });

  if (listQuery.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    );
  }

  if (listQuery.isError) {
    return <EndpointFallback error={listQuery.error} />;
  }

  const byProvider = new Map(
    (listQuery.data ?? []).map((item) => [item.provider.toLowerCase(), item]),
  );

  const providers = Array.from(
    new Set([
      ...PROVIDERS,
      ...(listQuery.data ?? []).map((i) => i.provider.toLowerCase()),
    ]),
  );

  return (
    <div className="space-y-3" data-testid="admin-integrations">
      <p className="text-sm text-text-muted">
        Chaves mascaradas · novas chaves são enviadas apenas no salvamento.
      </p>
      {providers.map((provider) => {
        const current = byProvider.get(provider);
        const draft = drafts[provider] ?? {
          apiKey: '',
          active: current?.active ?? false,
          note: current?.note ? String(current.note) : '',
        };
        return (
          <section
            key={provider}
            className="rounded-2xl border border-border bg-bg-card p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold capitalize">{provider}</h2>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  current?.configured || current?.active
                    ? 'bg-success/15 text-success'
                    : 'bg-white/5 text-text-dim'
                }`}
              >
                {current?.configured || current?.active
                  ? 'configurado'
                  : 'não configurado'}
              </span>
            </div>
            <p className="mt-2 text-xs text-text-dim">
              Chave atual:{' '}
              {current?.apiKeyMasked
                ? String(current.apiKeyMasked)
                : '•••••••• (mascarada / ausente)'}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Input
                type="password"
                placeholder="Nova API key (opcional)"
                value={draft.apiKey}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [provider]: { ...draft, apiKey: e.target.value },
                  }))
                }
                autoComplete="off"
              />
              <Input
                placeholder="Nota operacional"
                value={draft.note}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [provider]: { ...draft, note: e.target.value },
                  }))
                }
              />
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-text-muted">
              <input
                type="checkbox"
                className="accent-brand"
                checked={draft.active}
                onChange={(e) =>
                  setDrafts((prev) => ({
                    ...prev,
                    [provider]: { ...draft, active: e.target.checked },
                  }))
                }
              />
              Integração ativa
            </label>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-text-dim">
                {current?.updatedAt
                  ? `Atualizado ${formatRelativeTime(String(current.updatedAt))}`
                  : 'Sem data de atualização'}
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={testMutation.isPending}
                  onClick={() => testMutation.mutate(provider)}
                >
                  <Plug className="h-3.5 w-3.5" />
                  Testar conexão
                </Button>
                <Button
                  size="sm"
                  onClick={() => saveMutation.mutate(provider)}
                  disabled={saveMutation.isPending}
                >
                  Salvar
                </Button>
              </div>
            </div>
            {testResults[provider] ? (
              <p
                className={`mt-2 text-xs ${
                  testResults[provider].ok ? 'text-success' : 'text-danger'
                }`}
              >
                {testResults[provider].message}
                {testResults[provider].latencyMs != null
                  ? ` (${testResults[provider].latencyMs} ms)`
                  : ''}
              </p>
            ) : null}
            {saveMutation.isError &&
            saveMutation.variables === provider ? (
              <p className="mt-2 text-xs text-danger">
                {isEndpointUnavailable(saveMutation.error)
                  ? 'endpoint ainda não disponível'
                  : (saveMutation.error as Error).message}
              </p>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
