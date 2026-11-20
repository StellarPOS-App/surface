import type { ReactNode } from 'react';
import { useStoreSettings } from '@/hooks/queries';
import BrandMark from './BrandMark';

/** A sample receipt, drawn in HTML, showing what the product actually prints. */
function SampleReceipt() {
  const lines: [string, string, string][] = [
    ['2', 'Flat White', '8.40'],
    ['1', 'Butter Croissant', '3.00'],
    ['1', 'Zobo 350ml', '2.60'],
  ];
  return (
    <div className="receipt-edge mx-auto w-full max-w-[300px] rotate-[-2deg] bg-paper-card px-6 pb-8 pt-6 font-mono text-[12px] text-ink shadow-slip">
      <p className="text-center font-display text-base font-bold">KOFI'S COFFEE</p>
      <p className="text-center text-ink-3">S-000124 / 08:42</p>
      <div className="rule-dashed my-3" />
      {lines.map(([qty, name, price]) => (
        <div key={name} className="flex justify-between gap-2">
          <span>
            {qty} x {name}
          </span>
          <span className="tabular-nums">{price}</span>
        </div>
      ))}
      <div className="rule-dashed my-3" />
      <div className="flex justify-between text-sm font-semibold">
        <span>TOTAL USD</span>
        <span className="tabular-nums">14.00</span>
      </div>
      <div className="mt-2 flex justify-between">
        <span className="text-lumen">PAID STELLAR</span>
        <span className="tabular-nums">14.0000000 USDC</span>
      </div>
      <p className="mt-1 break-all text-[10px] text-ink-3">tx 9f2c...e71a, settled in 5s</p>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  const store = useStoreSettings().data;
  return (
    <div className="min-h-app grid lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink px-12 py-10 text-paper lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <BrandMark className="text-paper [&_path:last-child]:fill-[#6E72F0]" />
          <span className="font-display text-lg font-bold">StellarPOS</span>
        </div>
        <div className="mt-16 max-w-md">
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight">
            Open the till.
            <br />
            <span className="text-paper/55">Take any payment.</span>
          </h1>
          <ul className="mt-8 space-y-3 font-mono text-sm text-paper/75">
            <li>Cash with change, card, and split tender</li>
            <li>Stellar QR checkout that settles itself</li>
            <li>Live stock, end-of-day report, customer history</li>
          </ul>
        </div>
        <div className="mt-auto pt-10">
          <SampleReceipt />
        </div>
      </aside>
      <main className="flex flex-col px-6 py-10 sm:px-12">
        <div className="mb-10 flex items-center gap-3 lg:hidden">
          <BrandMark />
          <span className="font-display text-lg font-bold">StellarPOS</span>
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          {store && <p className="eyebrow mb-2">{store.name}</p>}
          {children}
        </div>
        <p className="mt-10 text-center font-mono text-xs text-ink-3">
          {store ? `Stellar ${store.stellar.network}` : 'Connecting to server...'}
        </p>
      </main>
    </div>
  );
}
