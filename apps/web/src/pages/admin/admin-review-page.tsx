import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { VerificationStatus } from '@lancex/shared';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EndpointFallback } from '@/features/admin/endpoint-fallback';
import { adminApi } from '@/lib/admin-api';
import { formatRelativeTime } from '@/lib/utils';

const REVIEW_STATUSES = [
  VerificationStatus.VERIFICADO,
  VerificationStatus.EM_ANALISE,
  VerificationStatus.NAO_CONFIRMADO,
  VerificationStatus.ALTO_RISCO,
  VerificationStatus.SUSPENSO,
  VerificationStatus.CANCELADO,
];

export function AdminReviewPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>(VerificationStatus.VERIFICADO);
  const [justification, setJustification] = useState('');

  const queueQuery = useQuery({
    queryKey: ['admin-review-queue'],
    queryFn: () => adminApi.listReviewQueue(),
  });

  const patchMutation = useMutation({
    mutationFn: () => {
      if (!selectedId) throw new Error('Selecione uma oportunidade');
      if (!justification.trim()) {
        throw new Error('Justificativa obrigatória');
      }
      return adminApi.patchVerification(selectedId, {
        status,
        justification: justification.trim(),
      });
    },
    onSuccess: () => {
      setJustification('');
      setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-review-queue'] });
    },
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]" data-testid="admin-review">
      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Fila de revisão (EM_ANALISE)</h2>
        {queueQuery.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-16" />
            ))}
          </div>
        ) : queueQuery.isError ? (
          <EndpointFallback error={queueQuery.error} />
        ) : (queueQuery.data?.length ?? 0) === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-xs text-text-dim">
            Nenhuma oportunidade em análise.
          </div>
        ) : (
          queueQuery.data?.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedId === item.id
                  ? 'border-brand bg-brand/10'
                  : 'border-border bg-bg-card hover:border-brand/40'
              }`}
            >
              <div className="text-sm font-semibold">{item.title}</div>
              <div className="mt-1 text-[11px] text-text-dim">
                {item.categoryName ?? 'Sem categoria'} ·{' '}
                {[item.city, item.state].filter(Boolean).join(' · ') || '—'}
                {item.updatedAt
                  ? ` · ${formatRelativeTime(item.updatedAt)}`
                  : ''}
              </div>
              <Link
                to={`/oportunidades/${item.id}`}
                className="mt-2 inline-flex text-[11px] text-brand hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Abrir detalhe
              </Link>
            </button>
          ))
        )}
      </section>

      <aside className="rounded-2xl border border-border bg-bg-card p-4">
        <h2 className="text-sm font-semibold">Alterar status</h2>
        {!selectedId ? (
          <p className="mt-3 text-xs text-text-dim">
            Selecione uma oportunidade da fila.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            <select
              className="flex h-10 w-full rounded-xl border border-border bg-bg-elevated px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {REVIEW_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Input
              placeholder="Justificativa"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            <Button
              className="w-full"
              size="sm"
              disabled={patchMutation.isPending}
              onClick={() => patchMutation.mutate()}
            >
              Salvar verificação
            </Button>
            {patchMutation.isError ? (
              <p className="text-xs text-danger">
                {(patchMutation.error as Error).message.includes('ainda não')
                  ? 'endpoint ainda não disponível'
                  : (patchMutation.error as Error).message}
              </p>
            ) : null}
            {patchMutation.isSuccess ? (
              <p className="text-xs text-success">Status atualizado.</p>
            ) : null}
          </div>
        )}
      </aside>
    </div>
  );
}
