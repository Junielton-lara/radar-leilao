/** Postgres text/JSON rejects U+0000 in strings (SQLSTATE 22P05). */
export function stripNullBytes(value: string): string {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code !== 0) out += value[i];
  }
  return out;
}

export function sanitizeJsonForPostgres<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return stripNullBytes(value) as T;
  }
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJsonForPostgres(item)) as T;
  }
  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    out[key] = sanitizeJsonForPostgres(nested);
  }
  return out as T;
}
