export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

export function uniqueSlug(base: string, suffix?: string): string {
  const s = slugify(base);
  const extra = suffix ? `-${suffix.slice(0, 8)}` : `-${Date.now().toString(36)}`;
  return `${s}${extra}`.slice(0, 100);
}
