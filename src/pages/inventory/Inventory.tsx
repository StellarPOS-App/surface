import { Minus, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { categoryColor } from '@/lib/pos';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Money from '@/components/ui/Money';
import PageHeader from '@/components/ui/PageHeader';
import { useAdjustStock, useCategories, useProducts } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product } from '@/types';
import { cn } from '@/utils/helpers';
import ProductForm from './ProductForm';

export default function Inventory() {
  const [params, setParams] = useSearchParams();
  const lowStock = params.get('lowStock') === '1';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const { can } = useAuth();
  const manage = can('manager');
  const adjust = useAdjustStock();
  const { data: categories } = useCategories();
  const { data, isLoading, isError, error } = useProducts({
    search: useDebounce(search),
    category: category || undefined,
    lowStock,
    includeInactive: showArchived,
  });
  const products = data?.data ?? [];

  const nudge = (p: Product, delta: number) =>
    adjust.mutate({ id: p.id, delta }, { onError: (err) => toast.error(err.message) });

  return (
    <div className="mx-auto max-w-[1300px]">
      <PageHeader eyebrow="Stock" title="Shelf and storeroom">
        {manage && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
            Add product
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px_auto_auto] sm:items-end">
        <Input
          placeholder="Search name or SKU"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leading={<Search className="h-4 w-4" />}
          aria-label="Search products"
        />
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="rounded border-ink-line text-ink"
            checked={lowStock}
            onChange={(e) => setParams(e.target.checked ? { lowStock: '1' } : {})}
          />
          Low stock only
        </label>
        <label className="flex h-10 items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="rounded border-ink-line text-ink"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Include archived
        </label>
      </div>

      {/* max-h + overflow-y lets the browser skip rendering off-screen rows.
          content-visibility:auto on each <tr> (below) gives CSS-native
          virtual scrolling without a third-party library (#213). */}
      <div className="overflow-x-auto rounded-xl border border-ink-line bg-paper-card">
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <thead className="border-b border-ink-line bg-paper-2/60 text-left">
            <tr className="eyebrow">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-center font-medium">In stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="inventory-scroll-body divide-y divide-ink-line">
            {products.map((p) => (
              <tr
                key={p.id}
                className={cn('inventory-row hover:bg-paper/70', !p.active && 'opacity-55')}
              >
                <td className="px-4 py-3">
                  <button
                    className="text-left disabled:cursor-default"
                    onClick={() => setEditing(p)}
                    disabled={!manage}
                  >
                    <span className="block font-medium hover:underline">{p.name}</span>
                    <span className="font-mono text-xs text-ink-3">{p.sku}</span>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: categoryColor(p.category) }}
                    />
                    {p.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Money cents={p.priceCents} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {manage && (
                      <button
                        className="rounded border border-ink-line p-1 hover:bg-paper-2 disabled:opacity-30"
                        onClick={() => nudge(p, -1)}
                        disabled={p.stock === 0}
                        aria-label={`Write off one ${p.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span
                      className={cn(
                        'figures w-12 text-center text-base',
                        p.lowStock && 'font-semibold text-amber',
                        p.stock === 0 && 'text-signal',
                      )}
                    >
                      {p.stock}
                    </span>
                    {manage && (
                      <button
                        className="rounded border border-ink-line p-1 hover:bg-paper-2"
                        onClick={() => nudge(p, 1)}
                        aria-label={`Receive one ${p.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {!p.active ? (
                    <Badge>archived</Badge>
                  ) : p.stock === 0 ? (
                    <Badge tone="signal">sold out</Badge>
                  ) : p.lowStock ? (
                    <Badge tone="amber">reorder</Badge>
                  ) : (
                    <Badge tone="cash">ok</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && (
          <div className="grid place-items-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        )}
        {isError && <EmptyState title="Could not load stock">{error.message}</EmptyState>}
        {!isLoading && !isError && products.length === 0 && (
          <EmptyState
            title={lowStock ? 'Nothing is running low' : 'No products yet'}
            action={
              manage && !lowStock ? (
                <Button onClick={() => setCreating(true)}>Add the first product</Button>
              ) : undefined
            }
          />
        )}
      </div>
      {data && (
        <p className="mt-3 font-mono text-xs text-ink-3">{data.pagination.total} products</p>
      )}

      <ProductForm
        open={creating || editing !== null}
        product={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
