import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EndpointFallback } from '@/features/admin/endpoint-fallback';
import { adminApi, type SourceRecord } from '@/lib/admin-api';

export function AdminSourcesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    baseUrl: '',
    type: 'TAVILY',
    notes: '',
  });

  const listQuery = useQuery({
    queryKey: ['admin-sources'],
    queryFn: () => adminApi.listSources(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminApi.createSource({
        name: form.name.trim(),
        baseUrl: form.baseUrl.trim() || null,
        type: form.type.trim() || null,
        notes: form.notes.trim() || null,
        active: true,
      }),
    onSuccess: () => {
      setForm({ name: '', baseUrl: '', type: 'TAVILY', notes: '' });
      void queryClient.invalidateQueries({ queryKey: ['admin-sources'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteSource(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-sources'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (source: SourceRecord) =>
      adminApi.updateSource(source.id, { active: !source.active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-sources'] });
    },
  });

  if (listQuery.isError) {
    return <EndpointFallback error={listQuery.error} />;
  }

  return (
    <div className="space-y-4" data-testid="admin-sources">
      <section className="rounded-2xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Nova fonte</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            placeholder="URL base"
            value={form.baseUrl}
            onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
          />
          <select
            className="h-10 rounded-xl border border-border bg-bg-elevated px-3 text-sm"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
          >
            {[
              'TAVILY',
              'MANUAL',
              'GOVERNMENT',
              'DIARIO_OFICIAL',
              'TRIBUNAL',
              'PREFEITURA',
              'ORGAO_PUBLICO',
              'LEILOEIRO',
              'PLATAFORMA_PRIVADA',
              'BANCO',
            ].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Input
            placeholder="Notas"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <Button
          className="mt-3"
          size="sm"
          disabled={!form.name.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar
        </Button>
        {createMutation.isError ? (
          <p className="mt-2 text-xs text-danger">
            {(createMutation.error as Error).message}
          </p>
        ) : null}
      </section>

      {listQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-16" />
          ))}
        </div>
      ) : (listQuery.data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-xs text-text-dim">
          Nenhuma fonte cadastrada.
        </div>
      ) : (
        <ul className="space-y-2">
          {listQuery.data?.map((source) => (
            <li
              key={source.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm font-semibold">{source.name}</div>
                <div className="mt-1 text-[11px] text-text-dim">
                  {[source.type, source.baseUrl].filter(Boolean).join(' · ') ||
                    'Sem metadados'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleMutation.mutate(source)}
                >
                  {source.active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Remover fonte"
                  onClick={() => deleteMutation.mutate(source.id)}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
