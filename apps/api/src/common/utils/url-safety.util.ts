import { lookup } from 'dns/promises';
import { isIP } from 'net';

const BLOCKED_HOSTS = new Set(['localhost', 'metadata.google.internal']);

function isPrivateIp(ip: string): boolean {
  if (ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')) {
    return true;
  }
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export async function assertSafePublicUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('URL inválida');
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Somente http/https são permitidos');
  }
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host) || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Host bloqueado por proteção SSRF');
  }
  const literal = isIP(host);
  if (literal && isPrivateIp(host)) {
    throw new Error('IP privado bloqueado por proteção SSRF');
  }
  if (!literal) {
    const records = await lookup(host, { all: true });
    for (const r of records) {
      if (isPrivateIp(r.address)) {
        throw new Error('Resolução DNS aponta para IP privado (SSRF)');
      }
    }
  }
  return url;
}

export function normalizeCanonicalUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = '';
    if ((u.protocol === 'http:' && u.port === '80') || (u.protocol === 'https:' && u.port === '443')) {
      u.port = '';
    }
    let path = u.pathname.replace(/\/+$/, '') || '/';
    u.pathname = path;
    return u.toString();
  } catch {
    return raw.trim();
  }
}
