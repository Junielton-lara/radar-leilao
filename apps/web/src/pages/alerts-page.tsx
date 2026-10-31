import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

interface AlertRow {
  id: string;
  name: string;
  active: boolean;
  configJson: Record<string, unknown>;
  updatedAt: string;
}

interface NotificationRow {
  id: string;
  title: string;
  body?: string | null;
  type: string;
  readAt?: string | null;
  createdAt: string;
}

export function AlertsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [states, setStates] = useState('SP,RJ');
  const [keywords, setKeywords] = useState('');

  const alertsQuery = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiRequest<AlertRow[]>('/alerts'),
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiRequest<NotificationRow[]>('/notifications'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest<AlertRow>('/alerts', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          active: true,
          configJson: {
            states: states
              .split(',')
              .map((s) => s.trim().toUpperCase())
              .filter(Boolean),
            keywords: keywords.trim() || undefined,
          },
        }),
      }),
    onSuccess: () => {
      setName('');
      setKeywords('');
      void queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (alert: AlertRow) =>
      apiRequest(`/alerts/${alert.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: alert.name,
          configJson: alert.configJson,
          active: !alert.active,
        }),
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/alerts/${id}`, { method: 'DELETE' }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="alerts-page">
      <div>
        <h1 className="font-display text-2xl font-bold">Meus Alertas</h1>
        <p className="mt-1 text-sm text-text-muted">
          Regras de monitoramento e notificações geradas pelo LanceX.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Bell className="h-4 w-4 text-brand" />
          Novo alerta
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <Input
            placeholder="Nome (ex.: Imóveis SP)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="UFs (SP,RJ,MG)"
            value={states}
            onChange={(e) => setStates(e.target.value)}
          />
          <Input
            placeholder="Palavras-chave (opcional)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>
        <Button
          className="mt-3"
          size="sm"
          disabled={!name.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          <Plus className="h-3.5 w-3.5" />
          Criar alerta
        </Button>
        {createMutation.isError ? (
          <p className="mt-2 text-xs text-danger">
            {(createMutation.error as Error).message}
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Regras ativas</h2>
        {alertsQuery.isLoading ? (
          <div className="skeleton h-16" />
        ) : (alertsQuery.data?.length ?? 0) === 0 ? (
          <p className="text-xs text-text-dim">Nenhum alerta cadastrado.</p>
        ) : (
          alertsQuery.data?.map((alert) => (
            <div
              key={alert.id}
              className="flex flex-col gap-2 rounded-2xl border border-border bg-bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="text-sm font-semibold">{alert.name}</div>
                <div className="mt-1 text-[11px] text-text-dim">
                  {alert.active ? 'Ativo' : 'Pausado'}
                  {' · '}
                  {JSON.stringify(alert.configJson)}
                  {' · '}
                  {formatRelativeTime(alert.updatedAt)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => toggleMutation.mutate(alert)}
                >
                  {alert.active ? 'Pausar' : 'Ativar'}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Excluir"
                  onClick={() => deleteMutation.mutate(alert.id)}
                >
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Notificações recentes</h2>
        {notificationsQuery.isLoading ? (
          <div className="skeleton h-16" />
        ) : (notificationsQuery.data?.length ?? 0) === 0 ? (
          <p className="text-xs text-text-dim">
            Sem notificações. Elas aparecem quando a coleta encontra matches
            para seus alertas.
          </p>
        ) : (
          notificationsQuery.data?.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 ${
                n.readAt
                  ? 'border-border bg-bg-card/60'
                  : 'border-brand/40 bg-bg-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-semibold">{n.title}</div>
                  {n.body ? (
                    <p className="mt-1 text-xs text-text-muted">{n.body}</p>
                  ) : null}
                  <div className="mt-1 text-[11px] text-text-dim">
                    {n.type} · {formatRelativeTime(n.createdAt)}
                  </div>
                </div>
                {!n.readAt ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => markReadMutation.mutate(n.id)}
                  >
                    Marcar lida
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
