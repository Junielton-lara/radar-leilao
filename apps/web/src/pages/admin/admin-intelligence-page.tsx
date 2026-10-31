import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api';

export function AdminIntelligencePage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('LanceX Intelligence — Rodada importada');
  const [markdown, setMarkdown] = useState('');

  const promptQuery = useQuery({
    queryKey: ['admin-intelligence-prompt'],
    queryFn: () =>
      apiRequest<{ prompt: string; meta: unknown }>('/admin/intelligence/prompt'),
  });

  const snapshotMutation = useMutation({
    mutationFn: () =>
      apiRequest('/admin/intelligence/snapshot', { method: 'POST' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['radar-intelligence'] });
    },
  });

  const importMutation = useMutation({
    mutationFn: () =>
      apiRequest('/admin/intelligence/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          narrativeMarkdown: markdown,
        }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['radar-intelligence'] });
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">LanceX Intelligence</h1>
        <p className="mt-1 text-sm text-text-muted">
          Prompt oficial, rodadas nacionais e importação do relatório (ex.: saída
          do ChatGPT) para exibir no mapa.
        </p>
      </div>

      <section className="card-soft p-4">
        <h2 className="text-sm font-bold">Gerar snapshot do banco</h2>
        <p className="mt-1 text-xs text-text-muted">
          Cria uma rodada com métricas reais (verificados, risco, cobertura) —
          sem inventar editais.
        </p>
        <Button
          className="mt-3"
          size="sm"
          disabled={snapshotMutation.isPending}
          onClick={() => snapshotMutation.mutate()}
        >
          {snapshotMutation.isPending ? 'Gerando…' : 'Nova rodada (dados reais)'}
        </Button>
      </section>

      <section className="card-soft p-4">
        <h2 className="text-sm font-bold">Importar relatório completo</h2>
        <p className="mt-1 text-xs text-text-muted">
          Cole aqui o texto da rodada nacional (Receita, PRF, DETRAN…). Ele
          aparece no radar para todos os usuários.
        </p>
        <input
          className="mt-3 w-full rounded-xl border border-border px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título da rodada"
        />
        <textarea
          className="mt-2 min-h-[280px] w-full rounded-xl border border-border px-3 py-2 font-mono text-xs leading-relaxed"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="Cole o markdown / texto da análise…"
        />
        <Button
          className="mt-3"
          size="sm"
          disabled={!markdown.trim() || importMutation.isPending}
          onClick={() => importMutation.mutate()}
        >
          {importMutation.isPending ? 'Importando…' : 'Publicar no radar'}
        </Button>
      </section>

      <section className="card-soft p-4">
        <h2 className="text-sm font-bold">Prompt do agente (somente leitura)</h2>
        {promptQuery.isLoading ? (
          <div className="skeleton mt-3 h-40" />
        ) : (
          <pre className="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
            {promptQuery.data?.prompt}
          </pre>
        )}
      </section>
    </div>
  );
}
