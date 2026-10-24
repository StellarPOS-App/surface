import { normalize, searchProducts } from '@/lib/search';
import type { CatalogProduct, PaymentMethod } from '@/types';

/**
 * Turns a spoken phrase into a register action. Pure and synchronous so it
 * can be tested without a microphone. Understands English, French and
 * Spanish verbs and number words, matching products with the same ranked
 * search the register uses.
 */
export type VoiceCommand =
  | { kind: 'add'; product: CatalogProduct; quantity: number }
  | { kind: 'remove'; product: CatalogProduct }
  | { kind: 'charge'; method: PaymentMethod }
  | { kind: 'clear' }
  | { kind: 'search'; query: string }
  | { kind: 'unknown'; text: string; reason: 'no-product' | 'not-understood' };

const NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  dozen: 12,
  un: 1,
  une: 1,
  deux: 2,
  trois: 3,
  quatre: 4,
  cinq: 5,
  sept: 7,
  huit: 8,
  neuf: 9,
  dix: 10,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
};

const ADD = ['add', 'plus', 'ajoute', 'ajouter', 'anade', 'agrega', 'agregar'];
const REMOVE = ['remove', 'delete', 'retire', 'retirer', 'supprime', 'quita', 'quitar', 'elimina'];
const CLEAR = [
  'clear order',
  'clear the order',
  'cancel order',
  'start over',
  'vider la commande',
  'vaciar pedido',
  'borrar pedido',
];
const SEARCH = ['search', 'search for', 'find', 'cherche', 'chercher', 'busca', 'buscar'];
const CHARGE = [
  'charge',
  'pay',
  'pay with',
  'pay by',
  'encaisser',
  'payer',
  'cobrar',
  'pagar',
  'pagar con',
];
const METHODS: Record<string, PaymentMethod> = {
  cash: 'cash',
  especes: 'cash',
  efectivo: 'cash',
  card: 'card',
  carte: 'card',
  tarjeta: 'card',
  stellar: 'stellar',
  crypto: 'stellar',
  qr: 'stellar',
};
// Filler words dropped before matching a product name.
const FILLER = new Set([
  'the',
  'of',
  'please',
  'le',
  'la',
  'les',
  'de',
  'des',
  'du',
  'el',
  'los',
  'las',
  'por',
  'favor',
  'and',
]);

const startsWithAny = (text: string, phrases: string[]) =>
  phrases.sort((a, b) => b.length - a.length).find((p) => text === p || text.startsWith(`${p} `));

/** Plural-insensitive stem: "whites" -> "white", "croissants" -> "croissant". */
const singular = (w: string) =>
  w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w;

function findProduct(words: string[], catalog: CatalogProduct[]): CatalogProduct | null {
  const query = words
    .filter((w) => !FILLER.has(w))
    .map(singular)
    .join(' ');
  if (!query) return null;
  return searchProducts(catalog, query)[0] ?? null;
}

export function parseVoiceCommand(spoken: string, catalog: CatalogProduct[]): VoiceCommand {
  const text = normalize(spoken).replace(/[.,!?]/g, '');
  if (!text) return { kind: 'unknown', text: spoken, reason: 'not-understood' };

  if (startsWithAny(text, CLEAR)) return { kind: 'clear' };

  const charge = startsWithAny(text, CHARGE);
  if (charge) {
    const rest = text.slice(charge.length).trim().split(' ');
    const method = rest.map((w) => METHODS[w]).find(Boolean);
    return method
      ? { kind: 'charge', method }
      : { kind: 'unknown', text: spoken, reason: 'not-understood' };
  }

  const search = startsWithAny(text, SEARCH);
  if (search) {
    const query = text.slice(search.length).trim();
    return query
      ? { kind: 'search', query }
      : { kind: 'unknown', text: spoken, reason: 'not-understood' };
  }

  const remove = startsWithAny(text, REMOVE);
  if (remove) {
    const product = findProduct(text.slice(remove.length).trim().split(' '), catalog);
    return product
      ? { kind: 'remove', product }
      : { kind: 'unknown', text: spoken, reason: 'no-product' };
  }

  // "add two flat whites", "two flat whites", "flat white" all add.
  const add = startsWithAny(text, ADD);
  const words = (add ? text.slice(add.length) : text).trim().split(' ').filter(Boolean);
  let quantity = 1;
  if (words.length && (/^\d+$/.test(words[0]) || words[0] in NUMBERS)) {
    quantity = /^\d+$/.test(words[0]) ? Number(words[0]) : NUMBERS[words[0]];
    words.shift();
  }
  quantity = Math.min(Math.max(quantity, 1), 99);
  const product = findProduct(words, catalog);
  return product
    ? { kind: 'add', product, quantity }
    : { kind: 'unknown', text: spoken, reason: 'no-product' };
}
