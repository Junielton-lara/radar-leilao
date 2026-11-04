import { BrazilianState } from '@prisma/client';
import {
  VEHICLE_FOCUS_CATEGORY_SLUGS,
  buildUpcomingAuctionSearchDateHint,
} from '@lancex/shared';

const EDITAL_CORE =
  'edital publicação aviso leilão extrajudicial judicial homologação JUCESP JUCEMG leiloeiro oficial data sessão encerramento lances';

const OFFICIAL_HINT =
  '(site:gov.br OR site:jus.br OR site:receita.fazenda.gov.br OR filetype:pdf edital)';

const CATEGORY_EDITAL_FOCUS: Record<string, string> = {
  veiculos: `${EDITAL_CORE} automóveis veículos carros pick-up DETRAN PRF Receita Federal SLE`,
  motocicletas: `${EDITAL_CORE} motocicletas motos ciclomotor DETRAN`,
  caminhoes: `${EDITAL_CORE} caminhões ônibus carretas transporte DETRAN PRF`,
  sucatas: `${EDITAL_CORE} sucata inservível veículos destruição reciclagem DETRAN PRF ferro-velho`,
  'pecas-desmanche': `${EDITAL_CORE} peças desmontagem desmanche aproveitável chassi motor`,
};

const STATE_ORG_HINTS: Partial<Record<BrazilianState, string>> = {
  SP: 'DETRAN SP edital leilão',
  RJ: 'DETRAN RJ edital leilão',
  MG: 'DETRAN MG edital leilão',
  PR: 'DETRAN PR edital leilão JUCEPAR',
  RS: 'DETRAN RS edital leilão',
  DF: 'DETRAN DF edital leilão',
};

export function buildIntelligenceSearchQuery(
  state: BrazilianState,
  categorySlug: string,
  now = new Date(),
): string {
  const dateHint = buildUpcomingAuctionSearchDateHint(now);
  const cat = categorySlug.toLowerCase();
  const vehicleKey = VEHICLE_FOCUS_CATEGORY_SLUGS.find((s) => cat.includes(s));
  if (vehicleKey) {
    const focus = CATEGORY_EDITAL_FOCUS[vehicleKey];
    const org = STATE_ORG_HINTS[state] ?? `prefeitura ${state} edital leilão veículos`;
    return `${focus} ${state} Brasil ${dateHint} ${org} ${OFFICIAL_HINT}`;
  }

  if (cat.includes('ferroviario')) {
    return `${EDITAL_CORE} material ferroviário trem vagão ${state} ${dateHint} ${OFFICIAL_HINT}`;
  }
  if (cat.includes('imovel') || cat.includes('terreno')) {
    return `${EDITAL_CORE} imóvel terreno ${state} ${dateHint} ${OFFICIAL_HINT}`;
  }
  if (cat.includes('maquina') || cat.includes('equipamento')) {
    return `${EDITAL_CORE} máquinas equipamentos ${state} ${dateHint} ${OFFICIAL_HINT}`;
  }

  return `${EDITAL_CORE} veículos motos caminhões sucata ${state} ${dateHint} ${OFFICIAL_HINT}`;
}

/** Queries padrão da rodada nacional — foco veicular + edital. */
export function defaultDiscoveryCategorySlugs(): string[] {
  return [...VEHICLE_FOCUS_CATEGORY_SLUGS];
}
