import type { AuctionType, VerificationStatus } from '@lancex/shared';

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  VERIFICADO: 'Verificado',
  EM_ANALISE: 'Em análise',
  NAO_CONFIRMADO: 'Não confirmado',
  ALTO_RISCO: 'Alto risco',
  SUSPENSO: 'Suspenso',
  CANCELADO: 'Cancelado',
  ENCERRADO: 'Encerrado',
};

export const AUCTION_TYPE_LABELS: Record<string, string> = {
  JUDICIAL: 'Judicial',
  EXTRAJUDICIAL: 'Extrajudicial',
  ADMINISTRATIVO: 'Administrativo',
  PARTICULAR: 'Particular',
  ONLINE: 'Online',
  PRESENCIAL: 'Presencial',
};

export function labelVerification(status: VerificationStatus): string {
  return VERIFICATION_LABELS[status] ?? status;
}

export function labelAuctionType(type: AuctionType | null | undefined): string {
  if (!type) return '—';
  return AUCTION_TYPE_LABELS[type] ?? type;
}
