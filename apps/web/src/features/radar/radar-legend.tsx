import { CATEGORY_COLORS, STATUS_COLORS } from './category-meta';

const STATUS_LABELS: Record<string, string> = {
  VERIFICADO: 'Verificado',
  EM_ANALISE: 'Em análise',
  NAO_CONFIRMADO: 'Não confirmado',
  ALTO_RISCO: 'Alto risco',
  SUSPENSO: 'Suspenso',
  CANCELADO: 'Cancelado',
  ENCERRADO: 'Encerrado',
};

const CATEGORY_LABELS: Record<string, string> = {
  veiculos: 'Veículos',
  motocicletas: 'Motocicletas',
  'imoveis-residenciais': 'Imóveis residenciais',
  'imoveis-comerciais': 'Imóveis comerciais',
  terrenos: 'Terrenos',
  caminhoes: 'Caminhões',
  maquinas: 'Máquinas',
  equipamentos: 'Equipamentos',
  sucatas: 'Sucatas',
  'materiais-diversos': 'Materiais diversos',
};

export function RadarLegend({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border border-border bg-bg-card/90 p-3 shadow-lg backdrop-blur"
      data-testid="radar-legend"
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-dim">
        Legenda
      </div>

      <div className={compact ? 'mt-2 space-y-2' : 'mt-3 grid gap-3 sm:grid-cols-2'}>
        <div>
          <div className="mb-1.5 text-[10px] font-medium text-text-muted">
            Categorias
          </div>
          <ul className="space-y-1">
            {Object.entries(CATEGORY_COLORS).map(([slug, color]) => (
              <li
                key={slug}
                className="flex items-center gap-2 text-[11px] text-text-muted"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: color }}
                />
                <span className="truncate">
                  {CATEGORY_LABELS[slug] ?? slug}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-medium text-text-muted">
            Status
          </div>
          <ul className="space-y-1">
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <li
                key={status}
                className="flex items-center gap-2 text-[11px] text-text-muted"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/20"
                  style={{ background: color }}
                />
                <span>{STATUS_LABELS[status] ?? status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-text-dim">
        Marcador oco = posição aproximada pela UF (sem geocode de endereço).
      </p>
    </div>
  );
}
