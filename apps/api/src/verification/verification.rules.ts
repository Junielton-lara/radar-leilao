import { VerificationStatus } from '@prisma/client';

export type EvidenceFlags = {
  hasOfficialSourceUrl: boolean;
  hasDocument: boolean;
  hasOrganizer: boolean;
  hasAuctioneer: boolean;
  hasProcedureRef: boolean;
  hasDates: boolean;
  hasExplicitCancelOrSuspendSignal: boolean;
  hasEndedSignal: boolean;
  riskFlags: string[];
  aiSuggestedStatus?: VerificationStatus | string | null;
};

export type VerificationDecision = {
  status: VerificationStatus;
  reasons: string[];
  requiredEvidence: string[];
  confidence: number;
};

/**
 * Deterministic rules. AI suggestions never alone produce VERIFICADO.
 */
export function applyVerificationRules(
  flags: EvidenceFlags,
): VerificationDecision {
  const reasons: string[] = [];
  const required: string[] = [];

  if (flags.hasExplicitCancelOrSuspendSignal) {
    const status = flags.riskFlags.includes('cancelado')
      ? VerificationStatus.CANCELADO
      : VerificationStatus.SUSPENSO;
    return {
      status,
      reasons: ['Sinal explícito de suspensão/cancelamento nas evidências'],
      requiredEvidence: [],
      confidence: 0.9,
    };
  }

  if (flags.hasEndedSignal) {
    return {
      status: VerificationStatus.ENCERRADO,
      reasons: ['Sinal de encerramento detectado'],
      requiredEvidence: [],
      confidence: 0.85,
    };
  }

  if (flags.riskFlags.some((r) => /fraude|phishing|golpe|fake/i.test(r))) {
    return {
      status: VerificationStatus.ALTO_RISCO,
      reasons: ['Flags de risco elevado presentes'],
      requiredEvidence: ['evidência oficial adicional', 'revisão humana'],
      confidence: 0.8,
    };
  }

  if (!flags.hasOfficialSourceUrl) required.push('URL oficial da fonte');
  if (!flags.hasDocument) required.push('documento/edital');
  if (!flags.hasOrganizer) required.push('organizador identificado');
  if (!flags.hasDates) required.push('datas do leilão');

  const coreOk =
    flags.hasOfficialSourceUrl &&
    flags.hasDocument &&
    flags.hasOrganizer &&
    flags.hasDates;

  if (coreOk && (flags.hasProcedureRef || flags.hasAuctioneer)) {
    reasons.push(
      'Evidências mínimas satisfeitas (URL oficial + documento + organizador + datas + procedimento/leiloeiro)',
    );
    return {
      status: VerificationStatus.VERIFICADO,
      reasons,
      requiredEvidence: [],
      confidence: 0.75,
    };
  }

  if (flags.hasOfficialSourceUrl || flags.hasDocument) {
    reasons.push('Evidências parciais — análise humana recomendada');
    return {
      status: VerificationStatus.EM_ANALISE,
      reasons,
      requiredEvidence: required,
      confidence: 0.5,
    };
  }

  reasons.push('Evidências insuficientes para confirmação');
  // AI suggestion may nudge toward EM_ANALISE but never VERIFICADO alone
  if (
    flags.aiSuggestedStatus === VerificationStatus.VERIFICADO ||
    flags.aiSuggestedStatus === 'VERIFICADO'
  ) {
    reasons.push(
      'Sugestão de IA VERIFICADO ignorada — regras determinísticas não satisfeitas',
    );
  }

  return {
    status: VerificationStatus.NAO_CONFIRMADO,
    reasons,
    requiredEvidence: required,
    confidence: 0.3,
  };
}
