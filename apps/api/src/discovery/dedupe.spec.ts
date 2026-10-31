import {
  canonicalUrl,
  isLikelyDuplicate,
  titleSimilarity,
} from './dedupe';

describe('dedupe', () => {
  it('canonicalizes URLs removing tracking params', () => {
    expect(
      canonicalUrl(
        'https://Example.com/edital/?utm_source=x&id=1',
      ),
    ).toBe('https://example.com/edital?id=1');
  });

  it('detects duplicate by canonical URL', () => {
    expect(
      isLikelyDuplicate({
        urlA: 'https://a.com/x/',
        urlB: 'https://a.com/x?utm_campaign=1',
      }),
    ).toBe(true);
  });

  it('does not merge different titles from same organizer without procedure', () => {
    expect(
      isLikelyDuplicate({
        organizerA: 'Banco X',
        organizerB: 'Banco X',
        titleA: 'Leilão veículo SP',
        titleB: 'Leilão imóvel RJ',
      }),
    ).toBe(false);
  });

  it('computes title similarity', () => {
    expect(
      titleSimilarity(
        'Caminhão Volvo FH 540 São Paulo',
        'Caminhao Volvo FH 540 Sao Paulo',
      ),
    ).toBeGreaterThan(0.7);
  });
});
