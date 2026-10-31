import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, ShieldAlert, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LANCEX_MAP_COLOR_LEGEND } from '@/features/radar/category-meta';
import { apiRequest } from '@/lib/api';
import { formatRelativeTime } from '@/lib/utils';

export interface IntelligenceLatest {
  id: string;
  title: string;
  cutOffAt: string;
  source: string;
  metrics: {
    verified: number;
    inAnalysis: number;
    highRisk: number;
    notConfirmed: number;
    activeOpportunities: number;
    alertsCount: number;
    statesWithData: number;
    sourcesActive: number;
    lastSearchRunAt: string | null;
  };
  highlights: {
    verified: Array<{
      auctionId: string;
      title: string;
      state: string | null;
      categoryName: string | null;
      minimumBid: string | null;
      originalUrl: string | null;
    }>;
    inAnalysis: Array<{ auctionId: string; title: string }>;
    highRisk: Array<{ auctionId: string; title: string; summary: string }>;
  };
  limitations: string[];
  bodyMarkdown: string | null;
  narrativeMarkdown: string | null;
  mapLegend: Array<{ key: string; color: string; label: string }>;
  scheduleBrt: string[];
  meta: {
    disclaimer: string;
  };
}

function formatCutOff(iso: string) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function IntelligenceBriefingPanel() {
  const [open, setOpen] = useState(true);
  const [showNarrative, setShowNarrative] = useState(false);

  const query = useQuery({
    queryKey: ['radar-intelligence'],
    queryFn: () => apiRequest<IntelligenceLatest>('/radar/intelligence/latest'),
  });

  const data = query.data;
  if (query.isLoading) {
    return <div className="skeleton h-32 w-full rounded-2xl" />;
  }
  if (!data) return null;

  const narrative =
    data.narrativeMarkdown && data.source === 'import'
      ? data.narrativeMarkdown
      : data.narrativeMarkdown;

  return (
    <section className="card-soft overflow-hidden" data-testid="intelligence-briefing">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-brand" />
            <span className="text-sm font-bold text-text">{data.title}</span>
            {data.source === 'import' ? (
              <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                Importado
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Corte {formatCutOff(data.cutOffAt)} · Ciclos BRT{' '}
            {data.scheduleBrt.join(', ')}
          </p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-text-dim" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-text-dim" />
        )}
      </button>

      {open ? (
        <div className="space-y-4 border-t border-border px-4 py-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="Verificados" value={data.metrics.verified} tone="text-emerald-700" />
            <MetricCard label="Em análise" value={data.metrics.inAnalysis} tone="text-amber-700" />
            <MetricCard label="Alto risco" value={data.metrics.highRisk} tone="text-red-700" />
            <MetricCard label="Não confirmado" value={data.metrics.notConfirmed} tone="text-slate-600" />
          </div>

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-text-muted">
            {data.meta.disclaimer}
          </p>

          <div>
            <div className="mb-2 text-xs font-bold text-text">Legenda do mapa (LanceX)</div>
            <div className="flex flex-wrap gap-2">
              {(data.mapLegend?.length
                ? data.mapLegend
                : LANCEX_MAP_COLOR_LEGEND
              ).map((item) => (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-2 py-1 text-[10px] font-semibold text-text-muted"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: item.color }}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {data.highlights.verified.length > 0 ? (
            <div>
              <div className="mb-2 text-xs font-bold text-text">
                Amostra verificada no banco
              </div>
              <ul className="space-y-1.5">
                {data.highlights.verified.slice(0, 5).map((h) => (
                  <li key={h.auctionId}>
                    <Link
                      to={`/oportunidades/${h.auctionId}`}
                      className="text-xs font-semibold text-brand hover:underline"
                    >
                      {h.title}
                    </Link>
                    <span className="text-[11px] text-text-muted">
                      {' '}
                      · {h.state ?? '—'} · {h.categoryName ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.highlights.highRisk.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50/80 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                <ShieldAlert className="h-3.5 w-3.5" />
                Alertas de risco
              </div>
              <ul className="mt-1 space-y-1">
                {data.highlights.highRisk.slice(0, 3).map((h) => (
                  <li key={h.auctionId} className="text-[11px] text-red-900">
                    <Link to={`/oportunidades/${h.auctionId}`} className="font-semibold underline">
                      {h.title}
                    </Link>
                    {h.summary ? ` — ${h.summary}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {narrative && data.source === 'import' ? (
            <div>
              <button
                type="button"
                className="text-xs font-bold text-brand hover:underline"
                onClick={() => setShowNarrative((v) => !v)}
              >
                {showNarrative ? 'Ocultar' : 'Ver'} relatório completo importado
              </button>
              {showNarrative ? (
                <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-100">
                  {narrative}
                </pre>
              ) : null}
            </div>
          ) : null}

          {data.metrics.lastSearchRunAt ? (
            <p className="text-[10px] text-text-dim">
              Última coleta: {formatRelativeTime(data.metrics.lastSearchRunAt)}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-semibold uppercase text-text-dim">{label}</div>
      <div className={`text-xl font-extrabold ${tone}`}>{value}</div>
    </div>
  );
}
