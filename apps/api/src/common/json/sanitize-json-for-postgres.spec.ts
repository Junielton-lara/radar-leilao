import {
  sanitizeJsonForPostgres,
  stripNullBytes,
} from '../json/sanitize-json-for-postgres';

describe('sanitizeJsonForPostgres', () => {
  it('removes null bytes from strings', () => {
    expect(stripNullBytes('a\u0000b')).toBe('ab');
  });

  it('sanitizes nested JSON', () => {
    const input = { results: [{ content: 'x\u0000y' }] };
    expect(sanitizeJsonForPostgres(input)).toEqual({
      results: [{ content: 'xy' }],
    });
  });
});
