const TERMINAL = new Set(['ENCERRADO', 'CANCELADO']);

function toDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Leilões sem data de fim só aparecem se revisados recentemente. */
export const MAP_RECENT_WITHOUT_END_DAYS = 30;
export const MAP_ONGOING_RECHECK_DAYS = 14;

/**
 * Regra do radar: não exibir edital encerrado nem oportunidade stale sem data.
 */
export function isAuctionActiveForMap(
  input: {
    endDate?: Date | string | null;
    startDate?: Date | string | null;
    lastCheckedAt?: Date | string | null;
    verificationStatus?: string | null;
  },
  now = new Date(),
): boolean {
  if (input.verificationStatus && TERMINAL.has(input.verificationStatus)) {
    return false;
  }

  const end = toDate(input.endDate);
  if (end && end.getTime() <= now.getTime()) return false;

  const start = toDate(input.startDate);
  if (end && end.getTime() > now.getTime()) return true;
  if (start && start.getTime() > now.getTime()) return true;

  const checked = toDate(input.lastCheckedAt);
  if (!checked) return false;

  const staleCutoff = new Date(now);
  staleCutoff.setDate(staleCutoff.getDate() - MAP_RECENT_WITHOUT_END_DAYS);
  const ongoingCutoff = new Date(now);
  ongoingCutoff.setDate(ongoingCutoff.getDate() - MAP_ONGOING_RECHECK_DAYS);

  if (!end && !start) return checked >= staleCutoff;
  if (!end && start && start.getTime() <= now.getTime()) {
    return checked >= ongoingCutoff;
  }
  if (!end) return checked >= staleCutoff;

  return false;
}

export function formatSearchMonthYearPtBr(now = new Date()): string {
  return now.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}

export function buildUpcomingAuctionSearchDateHint(now = new Date()): string {
  const monthYear = formatSearchMonthYearPtBr(now);
  const iso = now.toISOString().slice(0, 10);
  return `próximos leilões agenda ${monthYear} data sessão encerramento após ${iso} edital futuro`;
}
