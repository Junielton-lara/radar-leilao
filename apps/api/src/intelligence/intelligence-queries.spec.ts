import { BrazilianState } from '@prisma/client';
import {
  buildIntelligenceSearchQuery,
  defaultDiscoveryCategorySlugs,
} from './intelligence-queries';

describe('buildIntelligenceSearchQuery', () => {
  it('prioriza edital para veículos', () => {
    const q = buildIntelligenceSearchQuery('SP' as BrazilianState, 'veiculos');
    expect(q.toLowerCase()).toContain('edital');
    expect(q).toContain('SP');
    expect(q.toLowerCase()).toContain('automóveis');
  });

  it('inclui foco de sucata', () => {
    const q = buildIntelligenceSearchQuery('PR' as BrazilianState, 'sucatas');
    expect(q.toLowerCase()).toContain('sucata');
    expect(q.toLowerCase()).toContain('inserv');
  });

  it('expõe slugs veiculares padrão', () => {
    expect(defaultDiscoveryCategorySlugs()).toEqual([
      'veiculos',
      'motocicletas',
      'caminhoes',
      'sucatas',
      'pecas-desmanche',
    ]);
  });
});
