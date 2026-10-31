import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import type { AuctionDetail, VerificationStatus } from '@lancex/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  STATUS_COLORS,
  isAutoDesmancheFocus,
} from '@/features/radar/category-meta';
import {
  labelAuctionType,
  labelVerification,
} from '@/lib/auction-labels';
import { ApiError, apiRequest } from '@/lib/api';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';

type TabId =
  | 'overview'
  | 'values'
  | 'dates'
  | 'lots'
  | 'documents'
  | 'ai'
  | 'history';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'values', label: 'Valores' },
  { id: 'dates', label: 'Datas' },
  { id: 'lots', label: 'Lotes' },
  { id: 'documents', label: 'Documentos' },
  { id: 'ai', label: 'Inteligência artificial' },
  { id: 'history', label: 'Histórico' },
];

interface AuctionDocument {
  id: string;
  name: string;
  url?: string | null;
  mimeType?: string | null;
  createdAt?: string | null;
}

interface AiInsight {
  id?: string;
  summary?: string | null;
  riskScore?: number | null;
  confidence?: number | null;
  notes?: string | null;
  generatedAt?: string | null;
}

interface HistoryEvent {
  id: string;
  eventType: string;
  reason?: string | null;
  createdAt: string;
  actorName?: string | null;
}

async function fetchOptional<T>(path: string): Promise<T | null> {
  try {
    return await apiRequest<T>(path);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 501)) {
      return null;
    }
    throw err;
  }
}

export function OpportunityDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>('overview');

  const detailQuery = useQuery({
    queryKey: ['auction', id],
    enabled: Boolean(id),
    queryFn: () => apiRequest<AuctionDetail>(`/auctions/${id}`),
  });

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: () =>
      apiRequest<Array<{ auctionId: string; auction?: { id: string } }>>(
        '/favorites',
      ),
  });

  const isFavorite = Boolean(
    favoritesQuery.data?.some(
      (f) => f.auctionId === id || f.auction?.id === id,
    ),
  );

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      if (isFavorite) {
        await apiRequest(`/favorites/${id}`, { method: 'DELETE' });
      } else {
        await apiRequest(`/favorites/${id}`, { method: 'POST' });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const documentsQuery = useQuery({
    queryKey: ['auction-documents', id],
    enabled: Boolean(id) && tab === 'documents',
    queryFn: () => fetchOptional<AuctionDocument[]>(`/auctions/${id}/documents`),
  });

  const aiQuery = useQuery({
    queryKey: ['auction-ai', id],
    enabled: Boolean(id) && tab === 'ai',
    queryFn: () => fetchOptional<AiInsight>(`/auctions/${id}/ai`),
  });

  const historyQuery = useQuery({
    queryKey: ['auction-history', id],
    enabled: Boolean(id) && tab === 'history',
    queryFn: () => fetchOptional<HistoryEvent[]>(`/auctions/${id}/history`),
  });

  if (detailQuery.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-3">
        <div className="skeleton h-8 w-40" />
        <div className="skeleton h-48" />
        <div className="skeleton h-64" />
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-border p-8 text-center">
        <p className="text-sm">Oportunidade não encontrada.</p>
        <Link to="/oportunidades" className="mt-3 inline-block text-sm text-brand">
          Voltar
        </Link>
      </div>
    );
  }

  const a = detailQuery.data;
  const status = a.verificationStatus as VerificationStatus;
  const desmanche = isAutoDesmancheFocus(a.category?.slug, a.title);

  return (
    <div className="mx-auto max-w-5xl space-y-4" data-testid="opportunity-detail">
      <Link to="/oportunidades" className="text-xs text-text-dim hover:text-text">
        ← Oportunidades
      </Link>

      <div className="rounded-2xl border border-border bg-bg-card p-5">
        <Badge
          style={{
            background: `${STATUS_COLORS[status]}22`,
            color: STATUS_COLORS[status],
          }}
        >
          {labelVerification(status)}
        </Badge>
        {desmanche ? (
          <Badge className="ml-2 bg-emerald-100 text-emerald-800">
            Foco desmanche / peças
          </Badge>
        ) : null}
        <h1 className="mt-2 font-display text-2xl font-bold">{a.title}</h1>
        <p className="mt-2 text-sm text-text-muted">
          {[a.city, a.state].filter(Boolean).join(' · ') || 'Localização pendente'}
          {a.category?.name ? ` · ${a.category.name}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-bold text-accent">
            Lance mín. {formatCurrency(a.minimumBid)}
          </span>
          <span className="text-text-muted">
            Avaliação {formatCurrency(a.appraisalValue)}
          </span>
          <Button
            size="sm"
            variant={isFavorite ? 'secondary' : 'default'}
            disabled={favoriteMutation.isPending}
            onClick={() => favoriteMutation.mutate()}
          >
            <Heart
              className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')}
            />
            {isFavorite ? 'Favorito' : 'Favoritar'}
          </Button>
        </div>
      </div>

      <div
        className="flex gap-1 overflow-x-auto rounded-2xl border border-border bg-bg-card/80 p-1"
        data-testid="opportunity-tabs"
      >
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'shrink-0 rounded-xl px-3 py-2 text-xs font-semibold transition',
              tab === item.id
                ? 'bg-brand text-white'
                : 'text-text-muted hover:bg-white/5 hover:text-text',
            )}
            data-testid={`opportunity-tab-${item.id}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-bg-card p-5">
        {tab === 'overview' ? (
          <div className="space-y-4">
            {desmanche ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
                Oportunidade relevante para{' '}
                <strong>desmanche, sucata e peças</strong>. Confira lotes,
                avaliação e edital na aba Lotes e Documentos.
              </div>
            ) : null}
            <p className="text-sm text-text-muted">
              {a.description ?? 'Sem descrição estruturada ainda.'}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Categoria" value={a.category?.name} />
              <Info label="Tipo de leilão" value={labelAuctionType(a.auctionType)} />
              <Info
                label="Local"
                value={[a.address, a.city, a.state].filter(Boolean).join(' · ')}
              />
              <Info label="Lotes cadastrados" value={String(a.lots.length)} />
              <Info label="Organizador" value={a.organizer?.name} />
              <Info label="Leiloeiro" value={a.auctioneer?.name} />
              <Info label="Fonte" value={a.source?.name} />
              <Info
                label="Confiança"
                value={
                  a.confidenceScore != null
                    ? `${Math.round(a.confidenceScore)}%`
                    : undefined
                }
              />
              <Info
                label="Última verificação"
                value={
                  a.lastCheckedAt
                    ? formatRelativeTime(a.lastCheckedAt)
                    : undefined
                }
              />
            </div>
            {a.originalUrl ? (
              <a
                href={a.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Abrir URL original
              </a>
            ) : null}
          </div>
        ) : null}

        {tab === 'values' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Avaliação" value={formatCurrency(a.appraisalValue)} />
            <Info label="Lance mínimo" value={formatCurrency(a.minimumBid)} />
            <Info
              label="Comissão"
              value={
                a.commissionPercentage != null
                  ? `${a.commissionPercentage}%`
                  : undefined
              }
            />
          </div>
        ) : null}

        {tab === 'dates' ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Publicação" value={formatDate(a.publicationDate)} />
            <Info label="Início" value={formatDate(a.startDate)} />
            <Info label="Encerramento" value={formatDate(a.endDate)} />
            <Info label="Primeira detecção" value={formatDate(a.firstSeenAt)} />
            <Info label="Criado em" value={formatDate(a.createdAt)} />
            <Info label="Atualizado em" value={formatDate(a.updatedAt)} />
          </div>
        ) : null}

        {tab === 'lots' ? (
          a.lots.length === 0 ? (
            <EmptyState message="Nenhum lote associado a esta oportunidade." />
          ) : (
            <ul className="space-y-2">
              {a.lots.map((lot) => (
                <li
                  key={lot.id}
                  className="rounded-xl border border-border-subtle px-3 py-2 text-sm"
                >
                  <div className="font-medium">
                    {lot.lotNumber ? `Lote ${lot.lotNumber} · ` : ''}
                    {lot.title}
                  </div>
                  {lot.description ? (
                    <p className="mt-1 text-xs text-text-muted">
                      {lot.description}
                    </p>
                  ) : null}
                  <div className="mt-1 text-xs text-text-muted">
                    Aval. {formatCurrency(lot.appraisalValue)} · Mín.{' '}
                    {formatCurrency(lot.minimumBid)}
                    {lot.status ? ` · ${lot.status}` : ''}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === 'documents' ? (
          documentsQuery.isLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-12" />
              <div className="skeleton h-12" />
            </div>
          ) : !documentsQuery.data || documentsQuery.data.length === 0 ? (
            <EmptyState message="Nenhum documento disponível para esta oportunidade." />
          ) : (
            <ul className="space-y-2">
              {documentsQuery.data.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{doc.name}</div>
                    <div className="text-[11px] text-text-dim">
                      {doc.mimeType ?? 'arquivo'}
                      {doc.createdAt
                        ? ` · ${formatRelativeTime(doc.createdAt)}`
                        : ''}
                    </div>
                  </div>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      Abrir
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )
        ) : null}

        {tab === 'ai' ? (
          aiQuery.isLoading ? (
            <div className="skeleton h-40" />
          ) : !aiQuery.data ? (
            <EmptyState message="Nenhuma análise de IA disponível ainda." />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                {aiQuery.data.summary ?? 'Sem resumo estruturado.'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Info
                  label="Risco"
                  value={
                    aiQuery.data.riskScore != null
                      ? String(aiQuery.data.riskScore)
                      : undefined
                  }
                />
                <Info
                  label="Confiança IA"
                  value={
                    aiQuery.data.confidence != null
                      ? `${Math.round(aiQuery.data.confidence)}%`
                      : undefined
                  }
                />
              </div>
              {aiQuery.data.notes ? (
                <p className="rounded-xl border border-border-subtle bg-bg-panel/60 px-3 py-2 text-xs text-text-muted">
                  {aiQuery.data.notes}
                </p>
              ) : null}
              {aiQuery.data.generatedAt ? (
                <p className="text-[11px] text-text-dim">
                  Gerado {formatRelativeTime(aiQuery.data.generatedAt)}
                </p>
              ) : null}
            </div>
          )
        ) : null}

        {tab === 'history' ? (
          historyQuery.isLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-14" />
              <div className="skeleton h-14" />
            </div>
          ) : !historyQuery.data || historyQuery.data.length === 0 ? (
            <EmptyState message="Nenhum evento de histórico registrado." />
          ) : (
            <ul className="space-y-2">
              {historyQuery.data.map((event) => (
                <li
                  key={event.id}
                  className="rounded-xl border border-border-subtle px-3 py-2"
                >
                  <div className="text-sm font-medium">
                    {event.reason ?? event.eventType}
                  </div>
                  <div className="mt-1 text-[11px] text-text-dim">
                    {event.actorName ? `${event.actorName} · ` : ''}
                    {formatRelativeTime(event.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-bg-panel/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-text-dim">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium">{value || '—'}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-xs text-text-dim">
      {message}
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return undefined;
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
