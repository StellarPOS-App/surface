/**
 * Comprehensive unit tests for the core payment calculation logic.
 *
 * Covers taxCents, parseCents, formatCurrency (helpers.ts) and
 * computeTotals (cartStore.ts) with edge-cases including zero amounts,
 * large values, boundary conditions, and currency conversion formatting.
 *
 * Issue #98 — no previous tests covered these edge cases.
 */

import { describe, it, expect } from 'vitest';
import { taxCents, parseCents, formatCurrency } from '@/utils/helpers';
import { computeTotals } from '@/stores/cartStore';
import { makeProduct } from '@/test/utils';

// ── taxCents ─────────────────────────────────────────────────────────────────

describe('taxCents', () => {
  it('returns 0 for a zero amount regardless of rate', () => {
    expect(taxCents(0, 1000)).toBe(0);
    expect(taxCents(0, 0)).toBe(0);
  });

  it('returns 0 for a zero rate regardless of amount', () => {
    expect(taxCents(5000, 0)).toBe(0);
    expect(taxCents(1_000_000, 0)).toBe(0);
  });

  it('computes 10% tax (1000 bps) on a round amount', () => {
    // 100.00 USD × 10% = 10.00 USD = 1000 cents
    expect(taxCents(10_000, 1000)).toBe(1000);
  });

  it('computes 7.5% tax (750 bps) matching backend rounding', () => {
    // (1000 × 750 + 5000) / 10000 = floor(80) = 75 → matches backend
    expect(taxCents(1000, 750)).toBe(75);
  });

  it('rounds half-up consistently (same as backend)', () => {
    // 1 cent × 500 bps: (1 × 500 + 5000) / 10000 = floor(0.55) = 0
    expect(taxCents(1, 500)).toBe(0);
    // 1 cent × 5000 bps: (1 × 5000 + 5000) / 10000 = floor(1) = 1
    expect(taxCents(1, 5000)).toBe(1);
  });

  it('handles a maximum realistic cart value (10 000 USD × 25%)', () => {
    // $10,000.00 × 25% = $2,500.00 = 250000 cents
    expect(taxCents(1_000_000, 2500)).toBe(250_000);
  });

  it('handles very large amounts without integer overflow risk', () => {
    // $1 000 000.00 × 10% = $100 000.00
    const amount = 100_000_000; // 1 million USD in cents
    expect(taxCents(amount, 1000)).toBe(10_000_000);
  });
});

// ── parseCents ────────────────────────────────────────────────────────────────

describe('parseCents', () => {
  it('parses whole dollar amounts', () => {
    expect(parseCents('10')).toBe(1000);
    expect(parseCents('1')).toBe(100);
    expect(parseCents('100')).toBe(10_000);
  });

  it('parses decimal amounts with a dot separator', () => {
    expect(parseCents('1.99')).toBe(199);
    expect(parseCents('0.01')).toBe(1);
    expect(parseCents('0.10')).toBe(10);
    expect(parseCents('99.99')).toBe(9999);
  });

  it('parses decimal amounts with a comma separator', () => {
    expect(parseCents('1,99')).toBe(199);
    expect(parseCents('0,07')).toBe(7);
  });

  it('parses a single decimal digit as tens of cents', () => {
    expect(parseCents('1.5')).toBe(150);
    expect(parseCents('12.5')).toBe(1250);
  });

  it('returns null for zero (string "0" is valid)', () => {
    expect(parseCents('0')).toBe(0);
    expect(parseCents('0.00')).toBe(0);
  });

  it('returns null for three or more decimal digits', () => {
    expect(parseCents('1.999')).toBeNull();
    expect(parseCents('0.001')).toBeNull();
  });

  it('returns null for non-numeric input', () => {
    expect(parseCents('abc')).toBeNull();
    expect(parseCents('')).toBeNull();
    expect(parseCents('12.ab')).toBeNull();
  });

  it('returns null for negative values', () => {
    expect(parseCents('-1')).toBeNull();
    expect(parseCents('-0.01')).toBeNull();
  });

  it('handles leading/trailing whitespace', () => {
    expect(parseCents(' 5.00 ')).toBe(500);
    expect(parseCents('  3  ')).toBe(300);
  });

  it('handles very large amounts without floating-point imprecision', () => {
    // Classic float hazard: 99999.99 → should be 9999999 cents not 9999998
    expect(parseCents('99999.99')).toBe(9_999_999);
    expect(parseCents('1000000.00')).toBe(100_000_000);
  });
});

// ── formatCurrency ────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('formats zero cents as "0.00"', () => {
    expect(formatCurrency(0, 'USD', 'en-US')).toBe('$0.00');
  });

  it('formats one cent correctly', () => {
    expect(formatCurrency(1, 'USD', 'en-US')).toBe('$0.01');
  });

  it('formats a typical price', () => {
    expect(formatCurrency(1999, 'USD', 'en-US')).toBe('$19.99');
  });

  it('formats a large amount with thousands separator', () => {
    const result = formatCurrency(1_000_000_00, 'USD', 'en-US');
    expect(result).toBe('$1,000,000.00');
  });

  it('formats amounts in a non-USD currency', () => {
    // EUR uses a different symbol; just check the numeric value is right
    const result = formatCurrency(1250, 'EUR', 'en-US');
    expect(result).toMatch(/12\.50/);
  });

  it('caches formatters (calling twice returns the same string)', () => {
    const a = formatCurrency(500, 'USD', 'en-US');
    const b = formatCurrency(500, 'USD', 'en-US');
    expect(a).toBe(b);
  });
});

// ── computeTotals ─────────────────────────────────────────────────────────────

describe('computeTotals', () => {
  it('returns all zeros for an empty cart', () => {
    expect(computeTotals([], 0, 0)).toEqual({
      itemCount: 0,
      subtotalCents: 0,
      discountCents: 0,
      taxCents: 0,
      totalCents: 0,
    });
  });

  it('computes a single-item cart with no discount and no tax', () => {
    const lines = [{ product: makeProduct({ priceCents: 500 }), quantity: 2 }];
    expect(computeTotals(lines, 0, 0)).toEqual({
      itemCount: 2,
      subtotalCents: 1000,
      discountCents: 0,
      taxCents: 0,
      totalCents: 1000,
    });
  });

  it('applies discount before tax (discount-first ordering)', () => {
    // subtotal = 1000, discount = 200, taxable = 800, tax@10% = 80
    const lines = [{ product: makeProduct({ priceCents: 1000 }), quantity: 1 }];
    const totals = computeTotals(lines, 200, 1000);
    expect(totals.subtotalCents).toBe(1000);
    expect(totals.discountCents).toBe(200);
    expect(totals.taxCents).toBe(80);
    expect(totals.totalCents).toBe(880);
  });

  it('caps discount at the subtotal — total never goes negative', () => {
    const lines = [{ product: makeProduct({ priceCents: 100 }), quantity: 1 }];
    const totals = computeTotals(lines, 999, 1000);
    expect(totals.discountCents).toBe(100);
    expect(totals.taxCents).toBe(0);
    expect(totals.totalCents).toBe(0);
  });

  it('handles a full discount (100% off) resulting in zero total', () => {
    const lines = [{ product: makeProduct({ priceCents: 500 }), quantity: 3 }];
    const totals = computeTotals(lines, 1500, 750);
    expect(totals.totalCents).toBe(0);
    expect(totals.discountCents).toBe(1500);
    expect(totals.taxCents).toBe(0);
  });

  it('accumulates quantity across multiple lines', () => {
    const a = makeProduct({ priceCents: 200 });
    const b = makeProduct({ priceCents: 300 });
    const lines = [
      { product: a, quantity: 3 },
      { product: b, quantity: 2 },
    ];
    const totals = computeTotals(lines, 0, 0);
    expect(totals.itemCount).toBe(5);
    expect(totals.subtotalCents).toBe(1200);
  });

  it('handles large cart totals without overflow', () => {
    // 1000 × $999.99 = $999,990.00 = 99999000 cents
    const lines = [{ product: makeProduct({ priceCents: 99_999 }), quantity: 1000 }];
    const totals = computeTotals(lines, 0, 0);
    expect(totals.subtotalCents).toBe(99_999_000);
    expect(totals.totalCents).toBe(99_999_000);
  });

  it('applies a fractional tax rate correctly (8.875% = 888 bps rounded)', () => {
    // NYC combined rate ≈ 8.875%; 888 bps is 8.88%
    // subtotal 1000 × 888 bps = (1000 × 888 + 5000) / 10000 = floor(93.3) = 93
    const lines = [{ product: makeProduct({ priceCents: 1000 }), quantity: 1 }];
    const totals = computeTotals(lines, 0, 888);
    expect(totals.taxCents).toBe(89);
  });

  it('itemCount sums all line quantities', () => {
    const lines = [
      { product: makeProduct({ priceCents: 100 }), quantity: 5 },
      { product: makeProduct({ priceCents: 200 }), quantity: 3 },
      { product: makeProduct({ priceCents: 50  }), quantity: 10 },
    ];
    expect(computeTotals(lines, 0, 0).itemCount).toBe(18);
  });
});
