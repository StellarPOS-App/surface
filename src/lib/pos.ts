import type { PaymentMethod } from '@/types';

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  stellar: 'Stellar',
};

// Category stripes make the product grid scannable by color.
const STRIPES = [
  '#2F6B3B',
  '#B4532A',
  '#3B3FB6',
  '#A16207',
  '#7A2E5E',
  '#1F6F78',
  '#5B6B2F',
  '#8A2F2F',
  '#6D4C9F',
  '#4B5563',
];
let order: string[] = [];

/** Records the store's category list so each category gets its own color. */
export function setCategoryOrder(categories: string[]): void {
  order = categories;
}

/**
 * Colors by position in the category list, which keeps the first ten
 * categories distinct. Unknown categories fall back to a stable hash.
 */
export function categoryColor(category: string): string {
  const index = order.indexOf(category);
  if (index >= 0) return STRIPES[index % STRIPES.length];
  let h = 0;
  for (const ch of category) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return STRIPES[h % STRIPES.length];
}

/** Quick-tender amounts: exact, then the next round notes above the balance. */
export function quickTenders(balanceCents: number): number[] {
  const steps = [100, 500, 1000, 2000, 5000, 10000];
  const out = new Set<number>([balanceCents]);
  for (const step of steps) {
    const rounded = Math.ceil(balanceCents / step) * step;
    if (rounded > balanceCents) out.add(rounded);
    if (out.size >= 4) break;
  }
  return [...out].sort((a, b) => a - b);
}
