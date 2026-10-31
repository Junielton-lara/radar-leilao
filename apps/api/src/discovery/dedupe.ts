import { createHash } from 'crypto';

export function canonicalUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw.trim());
    u.hash = '';
    u.hostname = u.hostname.toLowerCase();
    if (
      (u.protocol === 'https:' && u.port === '443') ||
      (u.protocol === 'http:' && u.port === '80')
    ) {
      u.port = '';
    }
    // strip common tracking params
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(
      (k) => u.searchParams.delete(k),
    );
    let path = u.pathname;
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    u.pathname = path;
    return u.toString();
  } catch {
    return raw.trim().toLowerCase();
  }
}

export function fingerprint(parts: Array<string | null | undefined>): string {
  const normalized = parts
    .map((p) => (p ?? '').trim().toLowerCase().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join('|');
  return createHash('sha256').update(normalized).digest('hex');
}

export function titleSimilarity(a: string, b: string): number {
  const ta = new Set(
    a
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .split(/[^a-z0-9]+/i)
      .filter((t) => t.length > 2),
  );
  const tb = new Set(
    b
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .split(/[^a-z0-9]+/i)
      .filter((t) => t.length > 2),
  );
  if (ta.size === 0 || tb.size === 0) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  return inter / Math.max(ta.size, tb.size);
}

/** True when records should be linked as duplicates (never hard-delete). */
export function isLikelyDuplicate(input: {
  urlA?: string | null;
  urlB?: string | null;
  organizerA?: string | null;
  organizerB?: string | null;
  procedureA?: string | null;
  procedureB?: string | null;
  titleA?: string | null;
  titleB?: string | null;
}): boolean {
  const ca = canonicalUrl(input.urlA);
  const cb = canonicalUrl(input.urlB);
  if (ca && cb && ca === cb) return true;

  if (
    input.organizerA &&
    input.organizerB &&
    input.procedureA &&
    input.procedureB &&
    fingerprint([input.organizerA, input.procedureA]) ===
      fingerprint([input.organizerB, input.procedureB])
  ) {
    return true;
  }

  if (
    input.titleA &&
    input.titleB &&
    input.organizerA &&
    input.organizerB &&
    fingerprint([input.organizerA]) === fingerprint([input.organizerB]) &&
    titleSimilarity(input.titleA, input.titleB) >= 0.85
  ) {
    return true;
  }

  return false;
}
