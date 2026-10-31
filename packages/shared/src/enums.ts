export const UserRole = {
  ADMIN: 'ADMIN',
  ANALYST: 'ANALYST',
  USER: 'USER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const VerificationStatus = {
  VERIFICADO: 'VERIFICADO',
  EM_ANALISE: 'EM_ANALISE',
  NAO_CONFIRMADO: 'NAO_CONFIRMADO',
  ALTO_RISCO: 'ALTO_RISCO',
  SUSPENSO: 'SUSPENSO',
  CANCELADO: 'CANCELADO',
  ENCERRADO: 'ENCERRADO',
} as const;
export type VerificationStatus =
  (typeof VerificationStatus)[keyof typeof VerificationStatus];

export const AuctionType = {
  JUDICIAL: 'JUDICIAL',
  EXTRAJUDICIAL: 'EXTRAJUDICIAL',
  PUBLICO: 'PUBLICO',
  PRIVADO: 'PRIVADO',
} as const;
export type AuctionType = (typeof AuctionType)[keyof typeof AuctionType];

export const BrazilianState = {
  AC: 'AC',
  AL: 'AL',
  AP: 'AP',
  AM: 'AM',
  BA: 'BA',
  CE: 'CE',
  DF: 'DF',
  ES: 'ES',
  GO: 'GO',
  MA: 'MA',
  MT: 'MT',
  MS: 'MS',
  MG: 'MG',
  PA: 'PA',
  PB: 'PB',
  PR: 'PR',
  PE: 'PE',
  PI: 'PI',
  RJ: 'RJ',
  RN: 'RN',
  RS: 'RS',
  RO: 'RO',
  RR: 'RR',
  SC: 'SC',
  SP: 'SP',
  SE: 'SE',
  TO: 'TO',
} as const;
export type BrazilianState =
  (typeof BrazilianState)[keyof typeof BrazilianState];

export const BRAZILIAN_STATES = Object.values(BrazilianState);

export const STATE_REGIONS: Record<
  BrazilianState,
  'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'
> = {
  AC: 'Norte',
  AP: 'Norte',
  AM: 'Norte',
  PA: 'Norte',
  RO: 'Norte',
  RR: 'Norte',
  TO: 'Norte',
  AL: 'Nordeste',
  BA: 'Nordeste',
  CE: 'Nordeste',
  MA: 'Nordeste',
  PB: 'Nordeste',
  PE: 'Nordeste',
  PI: 'Nordeste',
  RN: 'Nordeste',
  SE: 'Nordeste',
  DF: 'Centro-Oeste',
  GO: 'Centro-Oeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  ES: 'Sudeste',
  MG: 'Sudeste',
  RJ: 'Sudeste',
  SP: 'Sudeste',
  PR: 'Sul',
  RS: 'Sul',
  SC: 'Sul',
};

export const CategorySlug = {
  VEICULOS: 'veiculos',
  MOTOCICLETAS: 'motocicletas',
  IMOVEIS_RESIDENCIAIS: 'imoveis-residenciais',
  IMOVEIS_COMERCIAIS: 'imoveis-comerciais',
  TERRENOS: 'terrenos',
  CAMINHOES: 'caminhoes',
  MAQUINAS: 'maquinas',
  EQUIPAMENTOS: 'equipamentos',
  SUCATAS: 'sucatas',
  MATERIAIS_DIVERSOS: 'materiais-diversos',
} as const;
export type CategorySlug = (typeof CategorySlug)[keyof typeof CategorySlug];
