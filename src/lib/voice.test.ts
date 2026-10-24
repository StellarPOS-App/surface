import type { CatalogProduct } from '@/types';
import { parseVoiceCommand } from './voice';

const p = (name: string, sku: string): CatalogProduct => ({
  id: sku,
  name,
  sku,
  category: 'Coffee',
  priceCents: 100,
  stock: 10,
  lowStock: false,
});
const CATALOG = [
  p('Flat White', 'COF-FLW'),
  p('Butter Croissant', 'BAK-CRO'),
  p('Café Latté', 'COF-LAT'),
  p('Espresso', 'COF-ESP'),
];
const parse = (s: string) => parseVoiceCommand(s, CATALOG);

describe('parseVoiceCommand', () => {
  it.each([
    ['add two flat whites', 'Flat White', 2],
    ['Add a croissant', 'Butter Croissant', 1],
    ['three espressos please', 'Espresso', 3],
    ['flat white', 'Flat White', 1],
    ['add 4 cafe latte', 'Café Latté', 4],
    ['ajoute deux croissants', 'Butter Croissant', 2],
    ['agrega tres espresso', 'Espresso', 3],
  ])('%s -> add %s x%i', (said, name, qty) => {
    expect(parse(said)).toMatchObject({ kind: 'add', product: { name }, quantity: qty });
  });

  it('removes items', () => {
    expect(parse('remove the croissant')).toMatchObject({
      kind: 'remove',
      product: { name: 'Butter Croissant' },
    });
    expect(parse('quita espresso')).toMatchObject({
      kind: 'remove',
      product: { name: 'Espresso' },
    });
  });

  it('charges with a method in any language', () => {
    expect(parse('charge cash')).toEqual({ kind: 'charge', method: 'cash' });
    expect(parse('pay with card')).toEqual({ kind: 'charge', method: 'card' });
    expect(parse('pay by stellar')).toEqual({ kind: 'charge', method: 'stellar' });
    expect(parse('encaisser espèces')).toEqual({ kind: 'charge', method: 'cash' });
    expect(parse('cobrar tarjeta')).toEqual({ kind: 'charge', method: 'card' });
  });

  it('clears and searches', () => {
    expect(parse('Clear the order.')).toEqual({ kind: 'clear' });
    expect(parse('vider la commande')).toEqual({ kind: 'clear' });
    expect(parse('search for latte')).toEqual({ kind: 'search', query: 'latte' });
  });

  it('reports what it could not do', () => {
    expect(parse('add two pizzas')).toMatchObject({ kind: 'unknown', reason: 'no-product' });
    expect(parse('charge')).toMatchObject({ kind: 'unknown', reason: 'not-understood' });
    expect(parse('   ')).toMatchObject({ kind: 'unknown', reason: 'not-understood' });
  });

  it('caps silly quantities', () => {
    expect(parse('add 500 espresso')).toMatchObject({ kind: 'add', quantity: 99 });
  });
});
