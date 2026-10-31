import { Injectable, Logger } from '@nestjs/common';

export type GeocodeRequest = {
  auctionId: string;
  address?: string;
  city?: string;
  state?: string;
};

/**
 * Optional geocoding helper + queue stub.
 * Does not invent coordinates. Real provider wiring is pending API key.
 */
@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  status() {
    const key = process.env.GEOCODING_API_KEY?.trim();
    return {
      configured: Boolean(key),
      message: key
        ? 'Geocoding key presente — provider a conectar.'
        : 'Geocoding não configurado (GEOCODING_API_KEY). Fila aceita jobs sem efeito até configurar.',
    };
  }

  async geocode(_req: GeocodeRequest) {
    const status = this.status();
    if (!status.configured) {
      this.logger.debug(`Geocode no-op: ${status.message}`);
      return {
        ok: false,
        skipped: true,
        ...status,
      };
    }
    return {
      ok: false,
      skipped: true,
      message:
        'Provider de geocoding ainda não implementado; job registrado sem alterar coordenadas.',
    };
  }
}
