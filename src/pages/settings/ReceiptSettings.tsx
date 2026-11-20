import ReceiptView from '@/components/pos/ReceiptView';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Field';
import {
  MAX_FOOTER,
  MAX_HEADER,
  useReceiptStore,
  type ReceiptOptions,
} from '@/stores/receiptStore';
import type { Transaction } from '@/types';

const SAMPLE: Transaction = {
  id: 'preview',
  reference: 'S-000123',
  userId: 'u',
  cashierName: 'Ada Admin',
  customerId: 'c',
  customerName: 'Amaka Obi',
  subtotalCents: 1140,
  discountCents: 0,
  taxCents: 0,
  totalCents: 1140,
  paidCents: 1140,
  balanceCents: 0,
  status: 'completed',
  note: '',
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  items: [
    {
      id: 'i1',
      productId: 'p1',
      name: 'Flat White',
      sku: 'COF-FLW',
      unitPriceCents: 420,
      quantity: 2,
      lineTotalCents: 840,
    },
    {
      id: 'i2',
      productId: 'p2',
      name: 'Butter Croissant',
      sku: 'BAK-CRO',
      unitPriceCents: 300,
      quantity: 1,
      lineTotalCents: 300,
    },
  ],
  payments: [
    {
      id: 'pay',
      transactionId: 'preview',
      method: 'stellar',
      amountCents: 1140,
      tenderedCents: null,
      changeCents: null,
      status: 'completed',
      stellarTxHash: '9f2c4e1a7b3d5f6a8c0e2b4d6f8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2e71a',
      createdAt: new Date().toISOString(),
    },
  ],
};

const TOGGLES: {
  key: keyof Pick<ReceiptOptions, 'showCashier' | 'showCustomer' | 'showTxHash'>;
  label: string;
}[] = [
  { key: 'showCashier', label: 'Cashier name' },
  { key: 'showCustomer', label: 'Customer name' },
  { key: 'showTxHash', label: 'Stellar transaction hash' },
];

/** Edits this till's receipt layout with a live preview. */
export default function ReceiptSettings() {
  const receipt = useReceiptStore();
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="max-w-xl space-y-4">
        <Textarea
          label="Header"
          rows={2}
          maxLength={MAX_HEADER}
          placeholder={'12 Admiralty Way, Lekki\n+234 803 555 0101'}
          hint="Address, phone or tax number, under the store name."
          value={receipt.header}
          onChange={(e) => receipt.update({ header: e.target.value })}
        />
        <Textarea
          label="Footer"
          rows={2}
          maxLength={MAX_FOOTER}
          hint="Returns policy, wifi password, or a thank-you."
          value={receipt.footer}
          onChange={(e) => receipt.update({ footer: e.target.value })}
        />
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-ink-2">Print on receipts</legend>
          {TOGGLES.map((t) => (
            <label key={t.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-ink-line text-ink"
                checked={receipt[t.key]}
                onChange={(e) => receipt.update({ [t.key]: e.target.checked })}
              />
              {t.label}
            </label>
          ))}
        </fieldset>
        <Button variant="ghost" size="sm" onClick={receipt.reset}>
          Restore defaults
        </Button>
      </div>
      <div aria-label="Receipt preview">
        <p className="eyebrow mb-2">Preview</p>
        <ReceiptView sale={SAMPLE} />
      </div>
    </div>
  );
}
