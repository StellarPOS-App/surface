import { mockFetch } from '@/test/utils';
import type { Transaction } from '@/types';
import { csvCell, toCsv } from './csv';
import { fetchAllOrders, ordersToCsv } from './exportOrders';

const sale = (n: number, extra: Partial<Transaction> = {}): Transaction => ({
  id: `t${n}`,
  reference: `S-${String(n).padStart(6, '0')}`,
  userId: 'u',
  cashierName: 'Ada',
  customerName: null,
  customerId: null,
  subtotalCents: 1000,
  discountCents: 0,
  taxCents: 75,
  totalCents: 1075,
  paidCents: 1075,
  balanceCents: 0,
  status: 'completed',
  note: '',
  createdAt: '2026-10-01 10:00:00',
  completedAt: '2026-10-01 10:00:00',
  ...extra,
});

describe('csv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(12.5)).toBe('12.5');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvCell('=HYPERLINK("http://evil")')).toBe('"\'=HYPERLINK(""http://evil"")"');
    expect(csvCell('+1')).toBe("'+1");
    expect(csvCell('@cmd')).toBe("'@cmd");
  });

  it('writes a BOM, header and CRLF rows', () => {
    const bom = String.fromCharCode(0xfeff);
    expect(toCsv([{ a: 1 }], [{ header: 'A', value: (r) => r.a }])).toBe(`${bom}A\r\n1\r\n`);
  });
});

describe('order export', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('pages through every sale and reports progress', async () => {
    const pages = [1, 2, 3].map((p) => ({
      success: true,
      data: Array.from({ length: p < 3 ? 100 : 50 }, (_, i) => sale((p - 1) * 100 + i + 1)),
      pagination: { page: p, limit: 100, total: 250, pages: 3 },
    }));
    let call = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(pages[call++]), { status: 200 })),
    );
    const progress: number[] = [];
    const all = await fetchAllOrders({ status: 'completed' }, (done) => progress.push(done));
    expect(all).toHaveLength(250);
    expect(progress).toEqual([100, 200, 250]);
  });

  it('can be cancelled', async () => {
    mockFetch({
      'GET /api/v1/transactions': {
        body: {
          success: true,
          data: [sale(1)],
          pagination: { page: 1, limit: 100, total: 500, pages: 5 },
        },
      },
    });
    const ctrl = new AbortController();
    const done = fetchAllOrders({}, () => ctrl.abort(), ctrl.signal);
    await expect(done).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('formats money as decimals', () => {
    const csv = ordersToCsv([sale(7, { note: '=SUM(A1)' })]);
    expect(csv).toContain(
      'S-000007,2026-10-01 10:00:00,completed,Ada,,10.00,0.00,0.75,10.75,10.75,',
    );
    expect(csv).toContain("'=SUM(A1)");
  });
});
