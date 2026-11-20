import type { CatalogProduct } from '@/types';

/** Lowercase, strip accents, collapse whitespace: "Café  Latté" -> "cafe latte". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Scores how well a product matches every word of the query, or returns
 * null if any word is missing. Exact SKU beats a name prefix, which beats a
 * word prefix, which beats a match anywhere; category matches count least.
 */
export function scoreProduct(product: CatalogProduct, words: string[]): number | null {
  const name = normalize(product.name);
  const sku = normalize(product.sku);
  const category = normalize(product.category);
  const nameWords = name.split(' ');
  let score = 0;
  for (const w of words) {
    if (sku === w) score += 100;
    else if (name.startsWith(w)) score += 40;
    else if (nameWords.some((nw) => nw.startsWith(w))) score += 25;
    else if (sku.startsWith(w)) score += 20;
    else if (name.includes(w)) score += 10;
    else if (sku.includes(w)) score += 8;
    else if (category.startsWith(w)) score += 5;
    else return null;
  }
  return score;
}

/** Products matching all query words, best first; the full list when the query is empty. */
export function searchProducts<T extends CatalogProduct>(products: T[], query: string): T[] {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return products;
  return products
    .map((p) => ({ p, score: scoreProduct(p, words) }))
    .filter((r): r is { p: T; score: number } => r.score !== null)
    .sort((a, b) => b.score - a.score || a.p.name.localeCompare(b.p.name))
    .map((r) => r.p);
}

/**
 * Splits `text` into plain and matched segments for highlighting, matching
 * query words accent- and case-insensitively against the original text.
 */
export function highlight(text: string, query: string): { text: string; match: boolean }[] {
  const words = normalize(query).split(' ').filter(Boolean);
  if (!words.length) return [{ text, match: false }];
  // NFD can change length, so map positions through a per-character fold.
  const folded = [...text].map((ch) => normalize(ch) || ch);
  const hits = new Array<boolean>(folded.length).fill(false);
  const flat = folded.join('');
  const offsets: number[] = [];
  folded.forEach((f, i) => {
    for (let k = 0; k < f.length; k++) offsets.push(i);
  });
  for (const w of words) {
    let from = 0;
    for (let at = flat.indexOf(w, from); at !== -1; at = flat.indexOf(w, from)) {
      for (let k = at; k < at + w.length; k++) hits[offsets[k]] = true;
      from = at + w.length;
    }
  }
  const out: { text: string; match: boolean }[] = [];
  [...text].forEach((ch, i) => {
    const last = out[out.length - 1];
    if (last && last.match === hits[i]) last.text += ch;
    else out.push({ text: ch, match: hits[i] });
  });
  return out;
}
