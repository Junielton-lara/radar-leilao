import { DedupeService } from './dedupe.service';

describe('DedupeService', () => {
  it('normalizes text for comparison', () => {
    expect(DedupeService.normalizeText('Leilão Judicial — SP')).toBe(
      'leilao judicial sp',
    );
  });

  it('scores identical procedure refs highly', () => {
    const score = DedupeService.organizerProcedureScore(
      {
        organizerName: 'Tribunal de Justiça de SP',
        procedureRef: '0001234-56.2024.8.26.0100',
        title: 'Leilão de imóvel',
      },
      {
        organizerName: 'TJSP',
        procedureRef: '0001234-56.2024.8.26.0100',
        title: 'Imóvel em leilão',
      },
    );
    expect(score).toBeGreaterThanOrEqual(0.7);
  });

  it('returns low score for unrelated titles', () => {
    const score = DedupeService.organizerProcedureScore(
      { title: 'Leilão de veículos em Curitiba' },
      { title: 'Edital de terrenos em Manaus' },
    );
    expect(score).toBeLessThan(0.5);
  });

  it('token set ratio is 1 for same tokens', () => {
    expect(
      DedupeService.tokenSetRatio('leilão judicial sp', 'sp judicial leilão'),
    ).toBe(1);
  });
});
