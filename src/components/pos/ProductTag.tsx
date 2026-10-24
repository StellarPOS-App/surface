import { categoryColor } from '@/lib/pos';
import { useT } from '@/i18n';
import { highlight } from '@/lib/search';
import type { CatalogProduct } from '@/types';
import { cn } from '@/utils/helpers';
import Money from '../ui/Money';

/** A shelf price tag. Tapping it adds one to the order. */
export default function ProductTag({
  product,
  inCart,
  onAdd,
  query = '',
}: {
  product: CatalogProduct;
  inCart: number;
  onAdd: () => void;
  /** Search text to highlight in the name. */
  query?: string;
}) {
  const t = useT();
  const soldOut = product.stock - inCart <= 0;
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={soldOut}
      aria-label={t('pos.add', { name: product.name })}
      className={cn(
        'group relative flex min-h-[112px] flex-col overflow-hidden rounded-lg border border-ink-line bg-paper-card p-3 pl-4 text-left shadow-sm transition',
        'hover:-translate-y-0.5 hover:shadow-slip active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50',
        inCart > 0 && 'ring-2 ring-ink',
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: categoryColor(product.category) }}
        aria-hidden
      />
      <span className="line-clamp-2 font-medium leading-snug">
        {highlight(product.name, query).map((part, i) =>
          part.match ? (
            <mark key={i} className="rounded-sm bg-lumen-soft text-lumen-ink">
              {part.text}
            </mark>
          ) : (
            part.text
          ),
        )}
      </span>
      <span className="mt-auto flex items-end justify-between gap-2 pt-3">
        <Money cents={product.priceCents} className="text-lg font-semibold" />
        <span
          className={cn(
            'font-mono text-[11px]',
            soldOut ? 'text-signal' : product.lowStock ? 'text-amber' : 'text-ink-3',
          )}
        >
          {soldOut ? t('pos.soldOut') : t('pos.left', { count: product.stock - inCart })}
        </span>
      </span>
      {inCart > 0 && (
        <span className="figures absolute right-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs text-paper">
          {inCart}
        </span>
      )}
    </button>
  );
}
