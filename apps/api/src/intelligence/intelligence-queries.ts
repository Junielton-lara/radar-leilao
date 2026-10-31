import { BrazilianState } from '@prisma/client';

const NATIONAL_SOURCES = [
  'Receita Federal SLE leilão',
  'PRF leilão veículos sucata',
  'DETRAN leilão edital',
  'Justiça leilão judicial',
  'prefeitura leilão veículos',
  'leiloeiro edital JUCESP JUCEMG',
];

export function buildIntelligenceSearchQuery(
  state: BrazilianState,
  categorySlug: string,
): string {
  const cat = categorySlug.toLowerCase();
  let focus = 'leilão edital oficial Brasil';
  if (cat.includes('sucata') || cat.includes('desmanche')) {
    focus =
      'leilão sucata desmontagem peças ferro-velho edital DETRAN PRF Receita';
  } else if (
    cat.includes('veiculo') ||
    cat.includes('moto') ||
    cat.includes('caminhao')
  ) {
    focus =
      'leilão veículos motos caminhões conservados sucata edital DETRAN PRF';
  } else if (cat.includes('ferroviario')) {
    focus = 'leilão material ferroviário trem vagão edital';
  } else if (cat.includes('imovel') || cat.includes('terreno')) {
    focus = 'leilão imóvel terreno judicial extrajudicial edital';
  } else if (cat.includes('maquina') || cat.includes('equipamento')) {
    focus = 'leilão máquinas equipamentos agrícolas industriais edital';
  }

  const sourceHint =
    NATIONAL_SOURCES[state.charCodeAt(0) % NATIONAL_SOURCES.length];
  return `${focus} ${state} ${sourceHint} site:gov.br OR site:receita.fazenda.gov.br OR edital PDF`;
}
