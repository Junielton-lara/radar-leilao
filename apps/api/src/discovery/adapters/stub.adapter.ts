import { SourceType } from '@prisma/client';
import {
  AdapterStatus,
  DiscoverContext,
  DiscoveredItem,
  ExtractedContent,
  NormalizedAuctionCandidate,
  SourceAdapter,
} from './source-adapter.interface';

/** Honest stub: does not scrape; respects robots by refusing unconfigured adapters. */
export abstract class StubSourceAdapter implements SourceAdapter {
  abstract readonly type: SourceType | string;
  abstract readonly label: string;

  status(): AdapterStatus {
    return {
      ready: false,
      code: 'ADAPTER_NOT_IMPLEMENTED',
      message: `${this.label}: adapter não configurado. Implementação específica necessária; sem scraping ilegal.`,
    };
  }

  async discover(_ctx: DiscoverContext): Promise<DiscoveredItem[]> {
    const s = this.status();
    throw Object.assign(new Error(s.message), { code: s.code, adapterStatus: s });
  }

  async search(_query: string, _ctx: DiscoverContext): Promise<DiscoveredItem[]> {
    return this.discover(_ctx);
  }

  async extract(urls: string[]): Promise<ExtractedContent[]> {
    return urls.map((url) => ({
      url,
      status: 'skipped' as const,
      message: this.status().message,
    }));
  }

  normalize(): NormalizedAuctionCandidate | null {
    return null;
  }

  validate(candidate: NormalizedAuctionCandidate) {
    const reasons: string[] = [];
    if (!candidate.title?.trim()) reasons.push('title obrigatório');
    if (!candidate.canonicalUrl?.trim()) reasons.push('canonicalUrl obrigatório');
    return { ok: reasons.length === 0, reasons };
  }

  async getChanges(_since: Date): Promise<DiscoveredItem[]> {
    return [];
  }
}

export class GovernmentPortalAdapter extends StubSourceAdapter {
  readonly type = SourceType.GOVERNMENT;
  readonly label = 'GovernmentPortalAdapter';
}

export class DiariosAdapter extends StubSourceAdapter {
  readonly type = SourceType.DIARIO_OFICIAL;
  readonly label = 'DiariosAdapter';
}

export class TribunalAdapter extends StubSourceAdapter {
  readonly type = SourceType.TRIBUNAL;
  readonly label = 'TribunalAdapter';
}

export class PrefeturaAdapter extends StubSourceAdapter {
  readonly type = SourceType.PREFEITURA;
  readonly label = 'PrefeturaAdapter';
}

export class OrgaoPublicoAdapter extends StubSourceAdapter {
  readonly type = SourceType.ORGAO_PUBLICO;
  readonly label = 'OrgaoPublicoAdapter';
}

export class LeiloeiroAdapter extends StubSourceAdapter {
  readonly type = SourceType.LEILOEIRO;
  readonly label = 'LeiloeiroAdapter';
}

export class PlataformaPrivadaAdapter extends StubSourceAdapter {
  readonly type = SourceType.PLATAFORMA_PRIVADA;
  readonly label = 'PlataformaPrivadaAdapter';
}

export class BancoAdapter extends StubSourceAdapter {
  readonly type = SourceType.BANCO;
  readonly label = 'BancoAdapter';
}
