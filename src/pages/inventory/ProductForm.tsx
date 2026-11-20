import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Field';
import Modal from '@/components/ui/Modal';
import { useCategories, useDeleteProduct, useSaveProduct } from '@/hooks/queries';
import type { Product } from '@/types';
import { parseCents } from '@/utils/helpers';

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(120),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-_.]{0,39}$/, 'Letters, digits, - _ . only'),
  category: z.string().trim().min(1, 'Required').max(60),
  price: z.string().refine((v) => parseCents(v) !== null, 'Enter a price like 4.50'),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(100_000),
  description: z.string().max(1000).optional(),
  active: z.boolean(),
});
type Form = z.infer<typeof schema>;

export default function ProductForm({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const save = useSaveProduct();
  const del = useDeleteProduct();
  const { data: categories } = useCategories();
  const editing = Boolean(product);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    values: {
      name: product?.name ?? '',
      sku: product?.sku ?? '',
      category: product?.category ?? '',
      price: product ? (product.priceCents / 100).toFixed(2) : '',
      stock: product?.stock ?? 0,
      lowStockThreshold: product?.lowStockThreshold ?? 5,
      description: product?.description ?? '',
      active: product?.active ?? true,
    },
  });

  const onSubmit = handleSubmit(async ({ price, stock, ...rest }) => {
    try {
      await save.mutateAsync({
        id: product?.id,
        ...rest,
        priceCents: parseCents(price)!,
        // Stock on existing products changes through adjustments, which keep the floor at zero.
        ...(editing ? {} : { stock }),
      });
      toast.success(editing ? 'Product updated' : 'Product added');
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  });

  const remove = async () => {
    if (!product || !window.confirm(`Remove ${product.name}?`)) return;
    try {
      const { outcome } = await del.mutateAsync(product.id);
      toast.success(
        outcome === 'archived'
          ? 'Archived: it appears on past sales, so receipts keep it'
          : 'Product deleted',
      );
      onClose();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      drawer
      eyebrow={editing ? product!.sku : 'New product'}
      title={editing ? product!.name : 'Add a product'}
      footer={
        <>
          {editing && (
            <Button
              variant="ghost"
              className="mr-auto text-signal"
              onClick={remove}
              loading={del.isPending}
            >
              Remove
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" loading={save.isPending}>
            {editing ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
        <Input
          wrapperClassName="sm:col-span-2"
          label="Name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="SKU"
          className="font-mono uppercase"
          error={errors.sku?.message}
          {...register('sku')}
        />
        <Input
          label="Category"
          list="categories"
          error={errors.category?.message}
          {...register('category')}
        />
        <datalist id="categories">
          {categories?.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Input
          label="Price"
          inputMode="decimal"
          className="figures"
          error={errors.price?.message}
          {...register('price')}
        />
        <Input
          label={editing ? 'In stock' : 'Opening stock'}
          type="number"
          min={0}
          disabled={editing}
          hint={
            editing ? 'Use the +/- controls in the table to receive or write off stock.' : undefined
          }
          error={errors.stock?.message}
          {...register('stock')}
        />
        <Input
          label="Low-stock alert at"
          type="number"
          min={0}
          error={errors.lowStockThreshold?.message}
          {...register('lowStockThreshold')}
        />
        <label className="flex items-center gap-3 self-end pb-2 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-ink-line text-ink focus:ring-lumen"
            {...register('active')}
          />
          Available at the register
        </label>
        <Textarea
          wrapperClassName="sm:col-span-2"
          label="Description"
          rows={3}
          {...register('description')}
        />
      </form>
    </Modal>
  );
}
