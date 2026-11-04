import { ApiError, apiRequest } from './api';

export class EndpointUnavailableError extends Error {
  constructor(path: string) {
    super(`endpoint ainda não disponível (${path})`);
    this.name = 'EndpointUnavailableError';
  }
}

export function isEndpointUnavailable(err: unknown): boolean {
  return err instanceof EndpointUnavailableError;
}

export function unavailableMessage(err: unknown): string {
  if (err instanceof EndpointUnavailableError) {
    return 'endpoint ainda não disponível';
  }
  if (err instanceof Error) return err.message;
  return 'Erro inesperado';
}

async function adminRequest<T>(
  path: string,
  options?: RequestInit & { token?: string | null; skipAuth?: boolean },
): Promise<T> {
  try {
    return await apiRequest<T>(path, options);
  } catch (err) {
    if (
      err instanceof ApiError &&
      (err.status === 404 || err.status === 501 || err.status === 405)
    ) {
      throw new EndpointUnavailableError(path);
    }
    throw err;
  }
}

export interface AdminDashboard {
  totalAuctions?: number;
  verified?: number;
  pendingReview?: number;
  sourcesActive?: number;
  runsRunning?: number;
  queueDepth?: number;
  lastRunAt?: string | null;
  note?: string | null;
  opportunitiesByStatus?: Record<string, number>;
  [key: string]: unknown;
}

export interface SourceRecord {
  id: string;
  name: string;
  url?: string | null;
  baseUrl?: string | null;
  sourceType?: string | null;
  type?: string | null;
  status?: string | null;
  active?: boolean;
  notes?: string | null;
  lastRunAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DiscoveryRun {
  id: string;
  status: string;
  name?: string | null;
  sourceId?: string | null;
  sourceName?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  foundCount?: number | null;
  opportunitiesFound?: number | null;
  error?: string | null;
}

export interface QueueStats {
  name: string;
  waiting?: number;
  active?: number;
  completed?: number;
  failed?: number;
  delayed?: number;
  paused?: boolean;
}

export interface IntegrationSettings {
  provider: string;
  configured?: boolean;
  active?: boolean;
  apiKeyMasked?: string | null;
  note?: string | null;
  updatedAt?: string | null;
  [key: string]: unknown;
}

export interface ReviewQueueItem {
  id: string;
  title: string;
  verificationStatus: string;
  state?: string | null;
  city?: string | null;
  categoryName?: string | null;
  updatedAt?: string | null;
}

function mapSource(row: SourceRecord): SourceRecord {
  return {
    ...row,
    baseUrl: row.baseUrl ?? row.url ?? null,
    type: row.type ?? row.sourceType ?? null,
    active: row.active ?? row.status === 'active',
  };
}

function mapRun(row: Record<string, unknown>): DiscoveryRun {
  return {
    id: String(row.id),
    status: String(row.status ?? 'unknown'),
    name: (row.name as string | null) ?? null,
    sourceId: (row.sourceId as string | null) ?? null,
    sourceName: (row.name as string | null) ?? 'Coleta geral',
    startedAt:
      (row.startedAt as string | null) ??
      (row.createdAt as string | null) ??
      null,
    finishedAt: (row.finishedAt as string | null) ?? null,
    foundCount:
      (row.foundCount as number | null) ??
      ((row._count as { items?: number } | undefined)?.items ?? null),
    opportunitiesFound: (row.opportunitiesFound as number | null) ?? null,
    error: (row.error as string | null) ?? null,
  };
}

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboard> => {
    const raw = await adminRequest<{
      opportunitiesByStatus?: Record<string, number>;
      sources?: Array<{ status?: string; lastRunAt?: string | null }>;
      lastSearches?: Array<{
        finishedAt?: string | null;
        startedAt?: string | null;
        createdAt?: string;
        status?: string;
      }>;
      pendingJobs?: {
        redisAvailable?: boolean;
        queues?: Record<string, { waiting?: number; active?: number }>;
      };
      tavily?: { configured?: boolean; active?: boolean };
      note?: string;
    }>('/admin/dashboard');

    const byStatus = raw.opportunitiesByStatus ?? {};
    const totalAuctions = Object.values(byStatus).reduce(
      (a, b) => a + Number(b || 0),
      0,
    );
    const last = raw.lastSearches?.[0];
    const queues = raw.pendingJobs?.queues ?? {};
    const queueDepth = Object.values(queues).reduce(
      (sum, q) => sum + Number(q.waiting ?? 0) + Number(q.active ?? 0),
      0,
    );
    const runsRunning = Object.values(queues).reduce(
      (sum, q) => sum + Number(q.active ?? 0),
      0,
    );

    return {
      ...raw,
      totalAuctions,
      verified: byStatus.VERIFICADO ?? byStatus.verified ?? 0,
      pendingReview:
        byStatus.EM_ANALISE ?? byStatus.PENDENTE_REVISAO ?? byStatus.inAnalysis ?? 0,
      sourcesActive: (raw.sources ?? []).filter((s) => s.status === 'active')
        .length,
      runsRunning,
      queueDepth,
      lastRunAt:
        last?.finishedAt ?? last?.startedAt ?? last?.createdAt ?? null,
      note:
        raw.note ??
        (raw.pendingJobs?.redisAvailable === false
          ? 'Filas em modo inline (Redis indisponível / JOBS_ENABLED=false).'
          : null),
    };
  },

  listSources: async () => {
    const rows = await adminRequest<SourceRecord[]>('/sources');
    return rows.map(mapSource);
  },
  createSource: async (body: {
    name: string;
    baseUrl?: string | null;
    type?: string | null;
    notes?: string | null;
    active?: boolean;
  }) => {
    const sourceType = (body.type || 'MANUAL').toUpperCase();
    const row = await adminRequest<SourceRecord>('/sources', {
      method: 'POST',
      body: JSON.stringify({
        name: body.name,
        url: body.baseUrl || undefined,
        sourceType,
        status: body.active === false ? 'inactive' : 'active',
        configJson: body.notes ? { notes: body.notes } : undefined,
      }),
    });
    return mapSource(row);
  },
  updateSource: async (id: string, body: Partial<SourceRecord>) => {
    const row = await adminRequest<SourceRecord>(`/sources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: body.name,
        url: body.baseUrl ?? body.url,
        sourceType: body.type ?? body.sourceType,
        status:
          body.active === undefined
            ? body.status
            : body.active
              ? 'active'
              : 'inactive',
      }),
    });
    return mapSource(row);
  },
  deleteSource: (id: string) =>
    adminRequest<void>(`/sources/${id}`, { method: 'DELETE' }),

  listRuns: async () => {
    const rows = await adminRequest<Record<string, unknown>[]>('/discovery/runs');
    return rows.map(mapRun);
  },
  startRun: async (body?: { sourceId?: string }) => {
    // Sync = executa na hora (inline se Redis/JOBS off).
    const result = await adminRequest<{
      results?: Array<{
        ok?: boolean;
        searchRunId?: string;
        found?: number;
        persisted?: number;
        message?: string;
        code?: string;
      }>;
      sources?: number;
      message?: string;
      searchRunId?: string;
      found?: number;
      id?: string;
    }>('/discovery/runs/sync', {
      method: 'POST',
      body: JSON.stringify(body ?? {}),
    });

    const first = result.results?.[0];
    if (first?.message && first.ok === false) {
      throw new ApiError(
        503,
        first.message || first.code || 'Coleta recusada pela fonte',
      );
    }
    if ((result.sources ?? 0) === 0 && !body?.sourceId) {
      throw new ApiError(
        400,
        'Nenhuma fonte ativa. Em Admin → Fontes, cadastre uma fonte TAVILY e ative.',
      );
    }

    const runs = await adminApi.listRuns();
    const matched =
      runs.find((r) => r.id === first?.searchRunId || r.id === result.searchRunId) ??
      runs[0];

    const totalFound = (result.results ?? []).reduce(
      (sum, r) => sum + Number(r.found ?? 0),
      0,
    );
    const totalPersisted = (result.results ?? []).reduce(
      (sum, r) => sum + Number(r.persisted ?? 0),
      0,
    );

    if (matched) {
      return {
        ...matched,
        foundCount: totalFound || matched.foundCount,
        opportunitiesFound: totalPersisted || matched.opportunitiesFound,
      };
    }
    return {
      id: first?.searchRunId ?? result.searchRunId ?? 'sync',
      status: 'completed',
      sourceName: 'Coleta geral',
      foundCount: totalFound || first?.found || 0,
      opportunitiesFound: totalPersisted || first?.persisted || 0,
      startedAt: new Date().toISOString(),
    };
  },
  pauseRun: async (_id: string) => {
    throw new ApiError(
      501,
      'Pausa de coleta ainda não é suportada pela API — aguarde a conclusão da rodada.',
    );
  },

  getQueues: async (): Promise<QueueStats[]> => {
    const stats = await adminRequest<{
      redisAvailable?: boolean;
      message?: string;
      queues?: Record<
        string,
        {
          waiting?: number;
          active?: number;
          completed?: number;
          failed?: number;
          delayed?: number;
        }
      >;
    }>('/admin/jobs/stats');
    const queues = stats.queues ?? {};
    return Object.entries(queues).map(([name, q]) => ({
      name,
      waiting: q.waiting ?? 0,
      active: q.active ?? 0,
      completed: q.completed ?? 0,
      failed: q.failed ?? 0,
      delayed: q.delayed ?? 0,
      paused: stats.redisAvailable === false,
    }));
  },

  listReviewQueue: async (): Promise<ReviewQueueItem[]> => {
    const data = await apiRequest<{
      items: Array<{
        id: string;
        title: string;
        verificationStatus: string;
        state?: string | null;
        city?: string | null;
        category?: { name: string } | null;
        lastCheckedAt?: string | null;
      }>;
    }>('/auctions?verificationStatus=EM_ANALISE&pageSize=50&sort=recent').catch(
      async () =>
        apiRequest<{
          items: Array<{
            id: string;
            title: string;
            verificationStatus: string;
            state?: string | null;
            city?: string | null;
            category?: { name: string } | null;
            lastCheckedAt?: string | null;
          }>;
        }>('/auctions?pageSize=50&sort=recent'),
    );
    return (data.items ?? [])
      .filter((item) =>
        ['EM_ANALISE', 'PENDENTE_REVISAO', 'NAO_CONFIRMADO'].includes(
          item.verificationStatus,
        ),
      )
      .map((item) => ({
        id: item.id,
        title: item.title,
        verificationStatus: item.verificationStatus,
        state: item.state,
        city: item.city,
        categoryName: item.category?.name ?? null,
        updatedAt: item.lastCheckedAt ?? null,
      }));
  },

  patchVerification: (
    id: string,
    body: { status: string; justification: string },
  ) =>
    adminRequest(`/auctions/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  getIntegration: (provider: string) =>
    adminRequest<IntegrationSettings>(`/settings/integrations/${provider}`),

  putIntegration: (
    provider: string,
    body: { apiKey?: string; active?: boolean; note?: string },
  ) =>
    adminRequest<IntegrationSettings>('/settings/integrations', {
      method: 'PUT',
      body: JSON.stringify({ provider, ...body }),
    }),

  listIntegrations: () =>
    adminRequest<IntegrationSettings[]>('/settings/integrations'),

  testIntegration: (provider: string) =>
    adminRequest<{ ok: boolean; message: string; latencyMs?: number }>(
      `/settings/integrations/${provider}/test`,
      { method: 'POST' },
    ),

  backfillMapCoordinates: () =>
    adminRequest<{ scanned: number; updated: number }>(
      '/auctions/geo/backfill-states',
      { method: 'POST' },
    ),

  reclassifyVehicleCategories: () =>
    adminRequest<{
      scanned: number;
      updated: number;
      unchanged: number;
      skipped: number;
      assignedBySlug: Record<string, number>;
    }>('/auctions/vehicle-categories/reclassify', { method: 'POST' }),
};
