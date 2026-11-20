import type { CatalogProduct } from '@/types';
import { highlight, normalize, searchProducts } from './search';

const p = (name: string, sku: string, category = 'Coffee'): CatalogProduct => ({
  id: sku,
  name,
  sku,
  category,
  priceCents: 100,
  stock: 5,
  lowStock: false,
});

const CATALOG = [
  p('Flat White', 'COF-FLW'),
  p('White Chocolate Mocha', 'COF-WCM'),
  p('Café Latté', 'COF-LAT'),
  p('Butter Croissant', 'BAK-CRO', 'Bakery'),
  p('Banana Bread', 'BAK-BAN', 'Bakery'),
];

const names = (q: string) => searchProducts(CATALOG, q).map((x) => x.name);

describe('search', () => {
  it('normalizes case, accents and spacing', () => {
    expect(normalize('  Café   LATTÉ ')).toBe('cafe latte');
  });

  it('matches words in any order', () => {
    expect(names('white flat')).toEqual(['Flat White']);
  });

  it('ignores accents both ways', () => {
    expect(names('cafe latte')).toEqual(['Café Latté']);
    expect(names('café')).toEqual(['Café Latté']);
  });

  it('ranks a name prefix above a match inside a word', () => {
    expect(names('white')).toEqual(['White Chocolate Mocha', 'Flat White']);
  });

  it('puts an exact SKU first, so scanners hit one product', () => {
    expect(names('bak-cro')).toEqual(['Butter Croissant']);
  });

  it('finds products by category', () => {
    expect(names('bakery')).toEqual(['Banana Bread', 'Butter Croissant']);
  });

  it('returns everything for an empty query and nothing for a miss', () => {
    expect(names('  ')).toHaveLength(CATALOG.length);
    expect(names('pizza')).toEqual([]);
  });

  it('highlights matches on the original text', () => {
    expect(highlight('Café Latté', 'latte')).toEqual([
      { text: 'Café ', match: false },
      { text: 'Latté', match: true },
    ]);
    expect(highlight('Flat White', 'wh fl')).toEqual([
      { text: 'Fl', match: true },
      { text: 'at ', match: false },
      { text: 'Wh', match: true },
      { text: 'ite', match: false },
    ]);
  });
});
