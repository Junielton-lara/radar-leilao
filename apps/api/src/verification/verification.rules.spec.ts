import { VerificationStatus } from '@prisma/client';
import { applyVerificationRules } from './verification.rules';

describe('applyVerificationRules', () => {
  it('does not set VERIFICADO from AI suggestion alone', () => {
    const decision = applyVerificationRules({
      hasOfficialSourceUrl: false,
      hasDocument: false,
      hasOrganizer: false,
      hasAuctioneer: false,
      hasProcedureRef: false,
      hasDates: false,
      hasExplicitCancelOrSuspendSignal: false,
      hasEndedSignal: false,
      riskFlags: [],
      aiSuggestedStatus: VerificationStatus.VERIFICADO,
    });
    expect(decision.status).toBe(VerificationStatus.NAO_CONFIRMADO);
    expect(decision.reasons.some((r) => /Sugestão de IA/.test(r))).toBe(true);
  });

  it('sets VERIFICADO when core evidence is present', () => {
    const decision = applyVerificationRules({
      hasOfficialSourceUrl: true,
      hasDocument: true,
      hasOrganizer: true,
      hasAuctioneer: false,
      hasProcedureRef: true,
      hasDates: true,
      hasExplicitCancelOrSuspendSignal: false,
      hasEndedSignal: false,
      riskFlags: [],
    });
    expect(decision.status).toBe(VerificationStatus.VERIFICADO);
  });

  it('sets ALTO_RISCO on fraud flags', () => {
    const decision = applyVerificationRules({
      hasOfficialSourceUrl: true,
      hasDocument: true,
      hasOrganizer: true,
      hasAuctioneer: true,
      hasProcedureRef: true,
      hasDates: true,
      hasExplicitCancelOrSuspendSignal: false,
      hasEndedSignal: false,
      riskFlags: ['golpe'],
    });
    expect(decision.status).toBe(VerificationStatus.ALTO_RISCO);
  });

  it('sets EM_ANALISE with partial evidence', () => {
    const decision = applyVerificationRules({
      hasOfficialSourceUrl: true,
      hasDocument: false,
      hasOrganizer: false,
      hasAuctioneer: false,
      hasProcedureRef: false,
      hasDates: false,
      hasExplicitCancelOrSuspendSignal: false,
      hasEndedSignal: false,
      riskFlags: [],
    });
    expect(decision.status).toBe(VerificationStatus.EM_ANALISE);
  });
});
