import { describe, it, expect } from 'vitest';
import { buildReport, toLocalDate } from './settlementReport';
import type { Transaction } from '@/types';

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: '1',
    reference: 'REF-001',
    userId: 'u1',
    cashierName: 'Alice',
    customerId: null,
    customerName: null,
    subtotalCents: 1000,
    discountCents: 0,
    taxCents: 80,
    totalCents: 1080,
    paidCents: 1080,
    balanceCents: 0,
    status: 'completed',
    note: '',
    createdAt: '2024-01-15T10:00:00Z',
    completedAt: '2024-01-15T10:01:00Z',
    ...overrides,
  };
}

describe('toLocalDate', () => {
  it('converts a UTC ISO string to a YYYY-MM-DD in UTC', () => {
    expect(toLocalDate('2024-01-15T23:00:00Z', 'UTC')).toBe('2024-01-15');
  });

  it('converts a UTC ISO string to a local date one day ahead for UTC+1', () => {
    // 2024-01-15T23:30:00Z is 2024-01-16T00:30:00 in Africa/Lagos (UTC+1)
    expect(toLocalDate('2024-01-15T23:30:00Z', 'Africa/Lagos')).toBe('2024-01-16');
  });
});

describe('buildReport', () => {
  it('counts only completed transactions', () => {
    const txs = [
      makeTx({ status: 'completed' }),
      makeTx({ status: 'void', completedAt: null }),
      makeTx({ status: 'pending', completedAt: null }),
    ];
    const report = buildReport(txs, '2024-01-15', 'UTC', 'USD');
    expect(report.transactionCount).toBe(1);
  });

  it('sums gross revenue, tax and discounts across all completed transactions', () => {
    const txs = [
      makeTx({ totalCents: 1000, taxCents: 80, discountCents: 50, paidCents: 1000 }),
      makeTx({
        totalCents: 2000,
        taxCents: 160,
        discountCents: 100,
        paidCents: 2000,
        reference: 'REF-002',
      }),
    ];
    const report = buildReport(txs, '2024-01-15', 'UTC', 'USD');
    expect(report.grossRevenueCents).toBe(3000);
    expect(report.taxCents).toBe(240);
    expect(report.discountCents).toBe(150);
    expect(report.netRevenueCents).toBe(3000 - 240 - 150);
  });

  it('calculates tip as paidCents minus totalCents when paidCents is higher', () => {
    const txs = [
      makeTx({ totalCents: 1000, paidCents: 1150 }), // 150 cent tip
      makeTx({ totalCents: 2000, paidCents: 2000, reference: 'REF-002' }), // no tip
    ];
    const report = buildReport(txs, '2024-01-15', 'UTC', 'USD');
    expect(report.tipCents).toBe(150);
    expect(report.rows[0].tipCents).toBe(150);
    expect(report.rows[1].tipCents).toBe(0);
  });

  it('reports zero tips and revenue for an empty day', () => {
    const report = buildReport([], '2024-01-15', 'UTC', 'USD');
    expect(report.transactionCount).toBe(0);
    expect(report.grossRevenueCents).toBe(0);
    expect(report.tipCents).toBe(0);
    expect(report.rows).toHaveLength(0);
  });

  it('propagates metadata fields correctly', () => {
    const report = buildReport([], '2024-03-20', 'Africa/Lagos', 'NGN');
    expect(report.date).toBe('2024-03-20');
    expect(report.timezone).toBe('Africa/Lagos');
    expect(report.currency).toBe('NGN');
  });
});
