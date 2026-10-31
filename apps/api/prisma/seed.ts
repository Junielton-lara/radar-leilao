import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const STATE_META: Array<{ code: string; name: string; region: string }> = [
  { code: 'AC', name: 'Acre', region: 'Norte' },
  { code: 'AL', name: 'Alagoas', region: 'Nordeste' },
  { code: 'AP', name: 'Amapá', region: 'Norte' },
  { code: 'AM', name: 'Amazonas', region: 'Norte' },
  { code: 'BA', name: 'Bahia', region: 'Nordeste' },
  { code: 'CE', name: 'Ceará', region: 'Nordeste' },
  { code: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { code: 'ES', name: 'Espírito Santo', region: 'Sudeste' },
  { code: 'GO', name: 'Goiás', region: 'Centro-Oeste' },
  { code: 'MA', name: 'Maranhão', region: 'Nordeste' },
  { code: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { code: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  { code: 'MG', name: 'Minas Gerais', region: 'Sudeste' },
  { code: 'PA', name: 'Pará', region: 'Norte' },
  { code: 'PB', name: 'Paraíba', region: 'Nordeste' },
  { code: 'PR', name: 'Paraná', region: 'Sul' },
  { code: 'PE', name: 'Pernambuco', region: 'Nordeste' },
  { code: 'PI', name: 'Piauí', region: 'Nordeste' },
  { code: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste' },
  { code: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { code: 'RS', name: 'Rio Grande do Sul', region: 'Sul' },
  { code: 'RO', name: 'Rondônia', region: 'Norte' },
  { code: 'RR', name: 'Roraima', region: 'Norte' },
  { code: 'SC', name: 'Santa Catarina', region: 'Sul' },
  { code: 'SP', name: 'São Paulo', region: 'Sudeste' },
  { code: 'SE', name: 'Sergipe', region: 'Nordeste' },
  { code: 'TO', name: 'Tocantins', region: 'Norte' },
];

const CATEGORIES: Array<{
  name: string;
  slug: string;
  color: string;
  icon: string;
}> = [
  { name: 'Veículos', slug: 'veiculos', color: '#3B82F6', icon: 'car' },
  { name: 'Motocicletas', slug: 'motocicletas', color: '#06B6D4', icon: 'bike' },
  {
    name: 'Imóveis residenciais',
    slug: 'imoveis-residenciais',
    color: '#8B5CF6',
    icon: 'home',
  },
  {
    name: 'Imóveis comerciais',
    slug: 'imoveis-comerciais',
    color: '#A855F7',
    icon: 'building',
  },
  { name: 'Terrenos', slug: 'terrenos', color: '#22C55E', icon: 'map' },
  { name: 'Caminhões', slug: 'caminhoes', color: '#0EA5E9', icon: 'truck' },
  { name: 'Máquinas', slug: 'maquinas', color: '#EAB308', icon: 'tractor' },
  {
    name: 'Equipamentos',
    slug: 'equipamentos',
    color: '#F59E0B',
    icon: 'wrench',
  },
  { name: 'Sucatas', slug: 'sucatas', color: '#10B981', icon: 'recycle' },
  {
    name: 'Peças / desmanche',
    slug: 'pecas-desmanche',
    color: '#059669',
    icon: 'wrench',
  },
  {
    name: 'Ferroviário',
    slug: 'ferroviarios',
    color: '#6366F1',
    icon: 'train',
  },
  {
    name: 'Materiais diversos',
    slug: 'materiais-diversos',
    color: '#B45309',
    icon: 'box',
  },
];

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@lancex.app';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMeAdmin123!';
  const name = process.env.SEED_ADMIN_NAME ?? 'Administrador LanceX';

  const company = await prisma.company.upsert({
    where: { slug: 'lancex' },
    update: {},
    create: {
      name: 'LanceX',
      slug: 'lancex',
      plan: 'pro',
      status: 'active',
    },
  });

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      companyId: company.id,
    },
    create: {
      name,
      email,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      companyId: company.id,
    },
  });

  for (const cat of CATEGORIES) {
    await prisma.auctionCategory.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
      },
      create: cat,
    });
  }

  for (const state of STATE_META) {
    await prisma.stateCoverage.upsert({
      where: { state: state.code as never },
      update: {
        name: state.name,
        region: state.region,
      },
      create: {
        state: state.code as never,
        name: state.name,
        region: state.region,
        categoriesCovered: [],
        sourcesConsulted: 0,
        opportunitiesFound: 0,
        successCount: 0,
        failureCount: 0,
      },
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: 'product' },
    update: {
      valueJson: {
        name: 'LanceX',
        subtitle: 'Radar Inteligente de Leilões',
        byline: 'by +Gestor',
      },
    },
    create: {
      key: 'product',
      valueJson: {
        name: 'LanceX',
        subtitle: 'Radar Inteligente de Leilões',
        byline: 'by +Gestor',
      },
    },
  });

  await prisma.integrationSetting.upsert({
    where: { provider: 'tavily' },
    update: {},
    create: {
      provider: 'tavily',
      active: false,
      configJson: {
        configured: false,
        dailyLimit: 0,
        monthlyLimit: 0,
        note: 'Configure a API key em Settings (admin) ou TAVILY_API_KEY. Sem chave a coleta é recusada.',
      },
    },
  });

  await prisma.source.upsert({
    where: { slug: 'tavily-nacional' },
    update: { status: 'active', sourceType: 'TAVILY', priority: 100 },
    create: {
      name: 'Tavily — cobertura nacional',
      slug: 'tavily-nacional',
      url: 'https://api.tavily.com',
      sourceType: 'TAVILY',
      category: 'search',
      geographicScope: null,
      priority: 100,
      frequencyMinutes: 60,
      status: 'active',
      configJson: {
        note: 'Fonte padrão de discovery. Exige IntegrationSetting tavily ativa + chave.',
      },
    },
  });

  await prisma.integrationSetting.upsert({
    where: { provider: 'ai' },
    update: {},
    create: {
      provider: 'ai',
      active: false,
      configJson: {
        configured: false,
        note: 'Configure OPENAI_API_KEY/AI_API_KEY ou IntegrationSetting (ai). Sem chave a IA é recusada.',
      },
    },
  });

  console.log('Seed concluído:');
  console.log(`- Admin: ${email}`);
  console.log(`- Categorias: ${CATEGORIES.length}`);
  console.log(`- UFs cobertura: ${STATE_META.length}`);
  console.log('- Leilões fictícios: 0');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
