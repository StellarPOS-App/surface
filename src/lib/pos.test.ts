import { categoryColor, quickTenders, setCategoryOrder } from './pos';

describe('pos helpers', () => {
  it('offers exact change first, then round notes above the balance', () => {
    expect(quickTenders(1250)).toEqual([1250, 1300, 1500, 2000]);
    expect(quickTenders(2000)).toEqual([2000, 5000, 10000]);
  });

  it('gives each category a stable color', () => {
    expect(categoryColor('Coffee')).toBe(categoryColor('Coffee'));
    expect(categoryColor('Coffee')).toMatch(/^#[0-9A-F]{6}$/i);
  });

  it('keeps known categories distinct', () => {
    const cats = ['Bakery', 'Beverages', 'Coffee', 'Retail', 'Snacks', 'Tea'];
    setCategoryOrder(cats);
    expect(new Set(cats.map(categoryColor)).size).toBe(cats.length);
    setCategoryOrder([]);
  });
});
