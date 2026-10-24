import { Search } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import CheckoutModal from '@/components/pos/CheckoutModal';
import ProductTag from '@/components/pos/ProductTag';
import { categoryColor } from '@/lib/pos';
import { searchProducts } from '@/lib/search';
import MobileOrderBar from '@/components/pos/MobileOrderBar';
import ReceiptCart from '@/components/pos/ReceiptCart';
import EmptyState from '@/components/ui/EmptyState';
import Kbd from '@/components/ui/Kbd';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Button from '@/components/ui/Button';
import { useCatalog, useCategories } from '@/hooks/queries';
import { useHotkey } from '@/hooks/useHotkey';
import { useT } from '@/i18n';
import { useCartStore } from '@/stores/cartStore';
import type { PaymentMethod } from '@/types';
import { cn } from '@/utils/helpers';

export default function POSTerminal() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<PaymentMethod | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const t = useT();
  // The whole catalog is loaded once and searched locally: instant, works
  // in any word order, ignores accents, and matches categories too.
  const { data: catalog, isLoading, isError, error } = useCatalog();
  const { data: categories } = useCategories();
  const { lines, add } = useCartStore();

  const inCart = useMemo(() => new Map(lines.map((l) => [l.product.id, l.quantity])), [lines]);
  const products = useMemo(
    () =>
      searchProducts(
        (catalog ?? []).filter((p) => !category || p.category === category),
        search,
      ),
    [catalog, category, search],
  );

  useHotkey('/', (e) => {
    e.preventDefault();
    searchRef.current?.focus();
  });
  useHotkey('Escape', () => setSearch(''), { allowInInputs: true, enabled: !checkout });

  const addProduct = (id: string) => {
    const product = products.find((p) => p.id === id);
    if (product && !add(product))
      toast.error(t('pos.onlyInStock', { count: product.stock, name: product.name }));
  };

  return (
    <div className="mx-auto grid max-w-[1500px] gap-6 lg:h-[calc(100vh-8.5rem)] lg:grid-cols-[1fr_400px] supports-[height:100dvh]:lg:h-[calc(100dvh-8.5rem)]">
      <section className="flex min-h-0 min-w-0 flex-col" aria-label="Products">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <span className="sr-only">{t('pos.search')}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                // Enter adds the only match: fast for barcode scanners that type the SKU.
                if (e.key === 'Enter' && products.length === 1) {
                  addProduct(products[0].id);
                  setSearch('');
                }
              }}
              placeholder={t('pos.search')}
              className="h-12 w-full rounded-lg border-ink-line bg-paper-card pl-10 pr-12 text-base shadow-sm focus:border-lumen focus:ring-lumen"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <Kbd>/</Kbd>
            </span>
          </label>
        </div>

        <div
          className="scroll-thin -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1"
          role="toolbar"
          aria-label={t('pos.categories')}
        >
          {[null, ...(categories ?? [])].map((c) => (
            <button
              key={c ?? 'all'}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                category === c
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink-line bg-paper-card text-ink-2 hover:border-ink',
              )}
            >
              {c && (
                <span className="h-2 w-2 rounded-full" style={{ background: categoryColor(c) }} />
              )}
              {c ?? t('pos.everything')}
            </button>
          ))}
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto pb-28 lg:pb-6">
          {isLoading && !catalog && (
            <div className="grid place-items-center py-24">
              <LoadingSpinner size="lg" />
            </div>
          )}
          {isError && <EmptyState title={t('pos.loadFailed')}>{error.message}</EmptyState>}
          {!isLoading && !isError && products.length === 0 && (
            <EmptyState
              title={search ? t('pos.noMatch', { query: search.trim() }) : t('pos.noProducts')}
              action={
                search || category ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setCategory(null);
                    }}
                  >
                    {t('pos.clearSearch')}
                  </Button>
                ) : undefined
              }
            >
              {search ? t('pos.noMatchHint') : t('pos.noProductsHint')}
            </EmptyState>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {products.map((p) => (
              <ProductTag
                key={p.id}
                product={p}
                inCart={inCart.get(p.id) ?? 0}
                onAdd={() => addProduct(p.id)}
                query={search}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="hidden lg:block lg:min-h-0">
        <ReceiptCart onCharge={setCheckout} />
      </div>
      <MobileOrderBar onCharge={setCheckout} />

      <CheckoutModal
        open={checkout !== null}
        initialMethod={checkout ?? 'cash'}
        onClose={() => setCheckout(null)}
      />
    </div>
  );
}
