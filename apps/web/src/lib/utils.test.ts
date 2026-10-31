import { describe, expect, it } from 'vitest';
import { countdown, formatCurrency, formatNumber } from './utils';

describe('utils', () => {
  it('formats currency in BRL', () => {
    expect(formatCurrency('85000')).toContain('85');
    expect(formatCurrency(null)).toBe('—');
  });

  it('formats numbers in pt-BR', () => {
    expect(formatNumber(3594)).toMatch(/3.?594/);
  });

  it('returns null countdown without date', () => {
    expect(countdown(null)).toBeNull();
  });
});
