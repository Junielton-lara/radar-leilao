import type { BrazilianState } from '@prisma/client';

/** Centróide aproximado (capital) — posição no mapa quando geocode exato não existe. */
export const STATE_CENTROIDS: Record<
  BrazilianState,
  { latitude: number; longitude: number }
> = {
  AC: { latitude: -9.974, longitude: -67.824 },
  AL: { latitude: -9.665, longitude: -35.735 },
  AP: { latitude: 0.035, longitude: -51.07 },
  AM: { latitude: -3.119, longitude: -60.021 },
  BA: { latitude: -12.971, longitude: -38.501 },
  CE: { latitude: -3.717, longitude: -38.543 },
  DF: { latitude: -15.793, longitude: -47.882 },
  ES: { latitude: -20.315, longitude: -40.312 },
  GO: { latitude: -16.686, longitude: -49.265 },
  MA: { latitude: -2.538, longitude: -44.282 },
  MT: { latitude: -15.601, longitude: -56.097 },
  MS: { latitude: -20.469, longitude: -54.62 },
  MG: { latitude: -19.916, longitude: -43.934 },
  PA: { latitude: -1.455, longitude: -48.502 },
  PB: { latitude: -7.115, longitude: -34.863 },
  PR: { latitude: -25.428, longitude: -49.273 },
  PE: { latitude: -8.047, longitude: -34.877 },
  PI: { latitude: -5.089, longitude: -42.801 },
  RJ: { latitude: -22.906, longitude: -43.172 },
  RN: { latitude: -5.794, longitude: -35.211 },
  RS: { latitude: -30.034, longitude: -51.217 },
  RO: { latitude: -8.761, longitude: -63.903 },
  RR: { latitude: 2.823, longitude: -60.675 },
  SC: { latitude: -27.595, longitude: -48.548 },
  SP: { latitude: -23.55, longitude: -46.633 },
  SE: { latitude: -10.947, longitude: -37.073 },
  TO: { latitude: -10.184, longitude: -48.333 },
};

export function jitterForId(id: string, scale = 0.35): {
  latitude: number;
  longitude: number;
} {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  const a = ((h % 1000) / 1000 - 0.5) * scale;
  const b = (((h >> 10) % 1000) / 1000 - 0.5) * scale;
  return { latitude: a, longitude: b };
}

export function resolveMapCoordinates(
  state: BrazilianState | null | undefined,
  id: string,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): { latitude: number; longitude: number; approximate: boolean } | null {
  if (latitude != null && longitude != null) {
    return { latitude: Number(latitude), longitude: Number(longitude), approximate: false };
  }
  if (!state || !STATE_CENTROIDS[state]) return null;
  const base = STATE_CENTROIDS[state];
  const j = jitterForId(id);
  return {
    latitude: base.latitude + j.latitude,
    longitude: base.longitude + j.longitude,
    approximate: true,
  };
}
