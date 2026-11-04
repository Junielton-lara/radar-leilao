/** Categorias prioritárias do radar LanceX (veículos e desmanche). */
export const VEHICLE_FOCUS_CATEGORY_SLUGS = [
  'veiculos',
  'motocicletas',
  'caminhoes',
  'sucatas',
  'pecas-desmanche',
] as const;

export type VehicleFocusCategorySlug =
  (typeof VEHICLE_FOCUS_CATEGORY_SLUGS)[number];

const VEHICLE_FOCUS_SET = new Set<string>(VEHICLE_FOCUS_CATEGORY_SLUGS);

const INSERVIVEL =
  /\b(inserv[ií]vel|sucata inserv|reciclagem|destrui[cç][aã]o|renajud|ferro-?velho)\b/i;
const APROVEITAVEL =
  /\b(aproveit[aá]vel|pe[cç]as? usadas?|desmontagem|desmanche|motor inserv|lote de pe[cç]as|chassi|somente desmontagem)\b/i;
const MOTO_KEYWORDS =
  /\b(moto\b|motos\b|motocicleta|scooter\b|ciclomotor)\b/i;
const TRUCK_KEYWORDS =
  /\b(caminh[aã]o|caminh[oõ]es|carreta|bitrem|rodotrem|[oô]nibus\b|micro-?[oô]nibus)\b/i;
const CAR_KEYWORDS =
  /\b(autom[oó]vel|autom[oó]veis|ve[ií]culo|ve[ií]culos|carro|carros|pick-?up|utilit[aá]rio|suv\b|van\b|hatch|sedan)\b/i;
const SUCATA_KEYWORD = /\bsucata\b/i;
const NON_VEHICLE =
  /\b(im[oó]vel|terreno|galp[aã]o|apartamento|casa\b|m[aá]quina agr[ií]cola|trator\b|retroescavadeira\b|galpão)\b/i;

function normalizeExistingSlug(
  slug: string | null | undefined,
): VehicleFocusCategorySlug | null {
  if (!slug) return null;
  const s = slug.toLowerCase();
  if (VEHICLE_FOCUS_SET.has(s)) return s as VehicleFocusCategorySlug;
  if (s.includes('sucata')) return 'sucatas';
  if (s.includes('desmanche') || s.includes('pecas')) return 'pecas-desmanche';
  if (s.includes('moto')) return 'motocicletas';
  if (s.includes('caminhao') || s.includes('caminh')) return 'caminhoes';
  if (s.includes('veiculo')) return 'veiculos';
  return null;
}

/**
 * Classifica leilão nas 5 categorias veiculares do radar.
 * Retorna null quando o texto indica claramente outra natureza (ex.: imóvel).
 */
export function inferVehicleCategorySlug(
  title: string | null | undefined,
  description?: string | null,
  existingSlug?: string | null,
): VehicleFocusCategorySlug | null {
  const fromSlug = normalizeExistingSlug(existingSlug);
  const text = `${title ?? ''} ${description ?? ''}`.trim();
  if (!text) return fromSlug;

  if (NON_VEHICLE.test(text) && !CAR_KEYWORDS.test(text) && !MOTO_KEYWORDS.test(text)) {
    return fromSlug;
  }

  if (fromSlug === 'pecas-desmanche' || fromSlug === 'sucatas') {
    if (APROVEITAVEL.test(text) && !INSERVIVEL.test(text)) return 'pecas-desmanche';
    if (SUCATA_KEYWORD.test(text) || INSERVIVEL.test(text)) return 'sucatas';
    return fromSlug;
  }

  if (APROVEITAVEL.test(text) && (SUCATA_KEYWORD.test(text) || INSERVIVEL.test(text))) {
    return 'pecas-desmanche';
  }
  if (SUCATA_KEYWORD.test(text) || (INSERVIVEL.test(text) && !CAR_KEYWORDS.test(text))) {
    return 'sucatas';
  }
  if (MOTO_KEYWORDS.test(text)) return 'motocicletas';
  if (TRUCK_KEYWORDS.test(text)) return 'caminhoes';
  if (CAR_KEYWORDS.test(text)) return 'veiculos';

  return fromSlug ?? (/\bleil[aã]o\b/i.test(text) ? 'veiculos' : null);
}

export function isVehicleFocusCategorySlug(
  slug: string | null | undefined,
): slug is VehicleFocusCategorySlug {
  return slug != null && VEHICLE_FOCUS_SET.has(slug);
}
