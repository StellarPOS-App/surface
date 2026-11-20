import {
  cn,
  formatAssetAmount,
  formatCurrency,
  initials,
  isEmail,
  parseCents,
  parseTimestamp,
  taxCents,
  truncateMiddle,
} from './helpers';

describe('helpers', () => {
  it('formats cents as currency', () => {
    expect(formatCurrency(1250, 'USD', 'en-US')).toBe('$12.50');
    expect(formatCurrency(0, 'USD', 'en-US')).toBe('$0.00');
    expect(formatCurrency(150000, 'NGN', 'en-NG')).toMatch(/1,500\.00/);
  });

  it('parses money input into cents without floats', () => {
    expect(parseCents('12.5')).toBe(1250);
    expect(parseCents('12,50')).toBe(1250);
    expect(parseCents('0.07')).toBe(7);
    expect(parseCents(' 3 ')).toBe(300);
    expect(parseCents('19.99')).toBe(1999);
    expect(parseCents('1.234')).toBeNull();
    expect(parseCents('abc')).toBeNull();
    expect(parseCents('-1')).toBeNull();
  });

  it('formats Stellar amounts', () => {
    expect(formatAssetAmount('12.5000000')).toBe('12.50');
    expect(formatAssetAmount('3.3333334')).toBe('3.3333334');
  });

  it('reads SQLite UTC timestamps as UTC', () => {
    expect(parseTimestamp('2026-01-02 10:00:00').toISOString()).toBe('2026-01-02T10:00:00.000Z');
    expect(parseTimestamp('2026-01-02T10:00:00.000Z').toISOString()).toBe(
      '2026-01-02T10:00:00.000Z',
    );
  });

  it('matches backend tax rounding', () => {
    expect(taxCents(1000, 750)).toBe(75);
    expect(taxCents(999, 750)).toBe(75);
    expect(taxCents(6, 750)).toBe(0);
  });

  it('has small string utilities', () => {
    expect(truncateMiddle('GABCDEFGHIJKLMNOP', 4, 4)).toBe('GABC...MNOP');
    expect(truncateMiddle('SHORT', 4, 4)).toBe('SHORT');
    expect(initials('Ada  Lovelace King')).toBe('AL');
    expect(isEmail('a@b.co')).toBe(true);
    expect(isEmail('a@b')).toBe(false);
    expect(cn('p-2', 'p-4', undefined)).toBe('p-4');
  });
});
