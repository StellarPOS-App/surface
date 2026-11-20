import { makeProduct } from '@/test/utils';
import { computeTotals, useCartStore } from './cartStore';

const reset = () => useCartStore.getState().clear();

describe('cart', () => {
  beforeEach(reset);

  it('adds, merges and removes lines', () => {
    const coffee = makeProduct({ priceCents: 400 });
    const { add, setQuantity } = useCartStore.getState();
    add(coffee);
    add(coffee, 2);
    expect(useCartStore.getState().lines).toEqual([{ product: coffee, quantity: 3 }]);
    setQuantity(coffee.id, 0);
    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it('never exceeds available stock', () => {
    const scarce = makeProduct({ stock: 2 });
    const { add, setQuantity } = useCartStore.getState();
    expect(add(scarce, 2)).toBe(true);
    expect(add(scarce)).toBe(false);
    setQuantity(scarce.id, 10);
    expect(useCartStore.getState().lines[0].quantity).toBe(2);
  });

  it('computes totals like the backend: discount first, then tax', () => {
    const a = makeProduct({ priceCents: 420 });
    const b = makeProduct({ priceCents: 300 });
    const lines = [
      { product: a, quantity: 2 },
      { product: b, quantity: 1 },
    ];
    expect(computeTotals(lines, 140, 750)).toEqual({
      itemCount: 3,
      subtotalCents: 1140,
      discountCents: 140,
      taxCents: 75,
      totalCents: 1075,
    });
  });

  it('caps the discount at the subtotal', () => {
    const lines = [{ product: makeProduct({ priceCents: 100 }), quantity: 1 }];
    expect(computeTotals(lines, 500, 0).totalCents).toBe(0);
  });
});

describe('cart persistence', () => {
  it('saves the order in progress so a reload keeps it', () => {
    useCartStore.getState().clear();
    useCartStore.getState().add(makeProduct({ name: 'Persisted Latte' }), 2);
    useCartStore.getState().setDiscount(50);
    const saved = JSON.parse(localStorage.getItem('stellarpos.cart')!).state;
    expect(saved.lines[0]).toMatchObject({ quantity: 2, product: { name: 'Persisted Latte' } });
    expect(saved.discountCents).toBe(50);
    expect(saved).not.toHaveProperty('add');
  });
});
