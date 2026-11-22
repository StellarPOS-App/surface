import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Money from '@/components/ui/Money';
import PageHeader from '@/components/ui/PageHeader';
import {
  useHourly,
  useRevenueByDay,
  useStoreSettings,
  useSummary,
  useTopProducts,
} from '@/hooks/queries';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { METHOD_LABEL } from '@/lib/pos';
import { publicErrorMessage } from '@/lib/safeErrors';
import type { PaymentMethod, Summary } from '@/types';
import { cn } from '@/utils/helpers';

const METHOD_COLOR: Record<PaymentMethod, string> = {
  cash: '#2F6B3B',
  card: '#B4532A',
  stellar: '#3B3FB6',
};
const RANGES = [
  { days: 1, label: 'Today' },
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
];

/** The end-of-day "Z report", printed the way a till prints it. */
function ZReport({ summary, label }: { summary: Summary; label: string }) {
  const store = useStoreSettings().data;
  const total = summary.byMethod.reduce((s, m) => s + m.amountCents, 0);
  const row = (k: string, v: React.ReactNode, strong?: boolean) => (
    <div className={cn('flex justify-between gap-3', strong && 'text-base font-semibold text-ink')}>
      <span>{k}</span>
      <span className="tabular-nums">{v}</span>
    </div>
  );
  return (
    <article className="receipt-edge bg-paper-card px-6 pb-8 pt-6 font-mono text-[13px] text-ink-2 shadow-slip">
      <p className="text-center font-display text-lg font-bold uppercase text-ink">Z report</p>
      <p className="text-center text-xs">
        {store?.name} / {label}
      </p>
      <div className="rule-dashed my-4" />
      {row('Gross sales', <Money cents={summary.totalRevenueCents} />, true)}
      {row('Transactions', summary.totalSales)}
      {row('Average ticket', <Money cents={summary.averageTicketCents} />)}
      {row('Units sold', summary.unitsSold)}
      {row('Discounts', <Money cents={summary.discountCents} />)}
      {row('Tax collected', <Money cents={summary.taxCents} />)}
      <div className="rule-dashed my-4" />
      <p className="eyebrow mb-2">Tender</p>
      {summary.byMethod.length === 0 && <p>No payments yet.</p>}
      {summary.byMethod.map((m) => (
        <div key={m.method} className="mb-2">
          {row(`${METHOD_LABEL[m.method]} (${m.count})`, <Money cents={m.amountCents} />)}
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper-2">
            <div
              className="h-full"
              style={{
                width: `${total ? (m.amountCents / total) * 100 : 0}%`,
                background: METHOD_COLOR[m.method],
              }}
            />
          </div>
        </div>
      ))}
      <div className="rule-dashed my-4" />
      {row('Refunds', summary.refunds)}
      {row('Voids', summary.voids)}
      {row('Customers on file', summary.customers)}
      {summary.lowStockProducts > 0 && (
        <Link
          to="/inventory?lowStock=1"
          className="mt-3 block rounded bg-amber-soft px-2 py-1.5 text-center text-amber hover:underline"
        >
          {summary.lowStockProducts} product{summary.lowStockProducts === 1 ? '' : 's'} running low
        </Link>
      )}
      <p className="mt-4 text-center text-[11px]">printed {new Date().toLocaleString()}</p>
    </article>
  );
}

function HourStrip({ days }: { days: number }) {
  const { data: utc } = useHourly(days);
  if (!utc) return null;
  // The server buckets by UTC hour; rotate so the strip reads in local time.
  const offset = Math.round(-new Date().getTimezoneOffset() / 60);
  const data = Array.from({ length: 24 }, (_, local) => ({
    ...utc[(((local - offset) % 24) + 24) % 24],
    hour: local,
  }));
  const max = Math.max(1, ...data.map((h) => h.sales));
  return (
    <div>
      <div
        className="grid grid-cols-[repeat(24,minmax(0,1fr))] gap-[3px]"
        role="img"
        aria-label={`Sales by hour of day, last ${days} days`}
      >
        {data.map((h) => (
          <div
            key={h.hour}
            title={`${String(h.hour).padStart(2, '0')}:00, ${h.sales} sales`}
            className="h-10 rounded-sm"
            style={{ background: `rgb(29 27 22 / ${0.06 + (h.sales / max) * 0.84})` }}
          />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink-3">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>23</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [days, setDays] = useState(1);
  const summary = useSummary(days);
  const revenue = useRevenueByDay(days === 1 ? 14 : days);
  const top = useTopProducts(6, Math.max(days, 7));
  const money = useFormatMoney();
  const maxUnits = Math.max(1, ...(top.data?.map((t) => t.units) ?? [1]));

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader eyebrow="Reports" title="How the till is doing">
        <div
          className="flex rounded-lg border border-ink-line bg-paper-card p-1"
          role="radiogroup"
          aria-label="Range"
        >
          {RANGES.map((r) => (
            <button
              key={r.days}
              role="radio"
              aria-checked={days === r.days}
              onClick={() => setDays(r.days)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm',
                days === r.days ? 'bg-ink text-paper' : 'text-ink-2 hover:text-ink',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <div>
          {summary.isLoading && <LoadingSpinner size="lg" />}
          {summary.isError && (
            <EmptyState title="Report unavailable">{publicErrorMessage(summary.error)}</EmptyState>
          )}
          {summary.data && (
            <ZReport summary={summary.data} label={RANGES.find((r) => r.days === days)!.label} />
          )}
        </div>

        <div className="space-y-10">
          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold">Revenue by day</h2>
              <span className="eyebrow">{days === 1 ? 'last 14 days' : `last ${days} days`}</span>
            </div>
            <div className="h-64 rounded-xl border border-ink-line bg-paper-card p-4">
              {revenue.data && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue.data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                    <CartesianGrid
                      vertical={false}
                      stroke="rgb(var(--line))"
                      strokeDasharray="3 4"
                    />
                    <XAxis
                      dataKey="day"
                      tickFormatter={(d: string) =>
                        new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })
                      }
                      tick={{
                        fontSize: 11,
                        fontFamily: 'IBM Plex Mono',
                        fill: 'rgb(var(--ink-3))',
                      }}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={16}
                    />
                    <YAxis
                      tickFormatter={(c: number) => money(c).replace(/\.00$/, '')}
                      tick={{
                        fontSize: 11,
                        fontFamily: 'IBM Plex Mono',
                        fill: 'rgb(var(--ink-3))',
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={64}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgb(var(--paper-2))' }}
                      contentStyle={{
                        background: 'rgb(var(--card))',
                        border: '1px solid rgb(var(--line))',
                        borderRadius: 8,
                        fontFamily: 'IBM Plex Mono',
                        fontSize: 12,
                      }}
                      formatter={(v) => [money(Number(v)), 'Revenue']}
                      labelFormatter={(d) =>
                        new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })
                      }
                    />
                    <Bar
                      dataKey="revenueCents"
                      fill="rgb(var(--ink))"
                      radius={[3, 3, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold">When customers come in</h2>
              <span className="eyebrow">sales by local hour, {days} days</span>
            </div>
            <HourStrip days={days} />
          </section>

          <section>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold">Best sellers</h2>
              <span className="eyebrow">by units</span>
            </div>
            {top.data?.length === 0 && <EmptyState title="No sales in this range yet" />}
            <ol className="divide-y divide-ink-line border-y border-ink-line">
              {top.data?.map((p, i) => (
                <li
                  key={p.productId}
                  className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3"
                >
                  <span className="figures text-2xl font-semibold text-ink-3">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.name}</p>
                    <div className="mt-1.5 h-1 rounded-full bg-paper-2">
                      <div
                        className="h-full rounded-full bg-ink"
                        style={{ width: `${(p.units / maxUnits) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right font-mono text-sm">
                    <p>{p.units} sold</p>
                    <Money cents={p.revenueCents} className="text-xs text-ink-3" />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
