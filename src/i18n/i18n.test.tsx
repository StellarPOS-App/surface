import { screen } from '@testing-library/react';
import { useCartStore } from '@/stores/cartStore';
import ReceiptCart from '@/components/pos/ReceiptCart';
import { makeProduct, mockFetch, renderWithProviders } from '@/test/utils';
import { en } from './en';
import { detectLanguage, LANGUAGES, translate, useLanguageStore } from './index';

/** Flattens nested messages into sorted dotted keys. */
function keys(node: object, prefix = ''): string[] {
  return Object.entries(node)
    .flatMap(([k, v]) => (typeof v === 'string' ? [prefix + k] : keys(v, `${prefix}${k}.`)))
    .sort();
}

describe('dictionaries', () => {
  it.each(Object.keys(LANGUAGES))('%s has exactly the English keys', (lang) => {
    expect(keys(LANGUAGES[lang as keyof typeof LANGUAGES].messages)).toEqual(keys(en));
  });

  it.each(Object.keys(LANGUAGES))('%s keeps every {placeholder} from English', (lang) => {
    const target = LANGUAGES[lang as keyof typeof LANGUAGES].messages;
    for (const key of keys(en)) {
      const pick = (m: object) =>
        key.split('.').reduce<unknown>((n, p) => (n as Record<string, unknown>)[p], m) as string;
      const holes = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();
      expect({ key, holes: holes(pick(target)) }).toEqual({ key, holes: holes(pick(en)) });
    }
  });
});

describe('translate', () => {
  it('fills placeholders and picks plural forms', () => {
    expect(translate('en', 'cart.items', { count: 1 })).toBe('1 item');
    expect(translate('en', 'cart.items', { count: 3 })).toBe('3 items');
    expect(translate('fr', 'cart.items', { count: 1 })).toBe('1 article');
    expect(translate('fr', 'cart.items', { count: 0 })).toBe('0 article'); // French treats 0 as singular
    expect(translate('es', 'checkout.saleComplete', { reference: 'S-000001' })).toBe(
      'Venta S-000001 completada',
    );
  });

  it('falls back to the key for unknown strings and leaves missing values visible', () => {
    expect(translate('fr', 'nope.missing')).toBe('nope.missing');
    expect(translate('en', 'pos.add')).toBe('Add {name}');
  });

  it('detects the browser language, defaulting to English', () => {
    expect(detectLanguage(['fr-CA', 'en'])).toBe('fr');
    expect(detectLanguage(['de-DE', 'es-MX'])).toBe('es');
    expect(detectLanguage(['yo-NG'])).toBe('en');
  });
});

describe('translated register', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    useLanguageStore.getState().setLanguage('en');
    useCartStore.getState().clear();
  });

  it('renders the order panel in French', async () => {
    mockFetch({
      'GET /api/v1/store': {
        body: { success: true, data: { name: 'Kofi', currency: 'EUR', taxRateBps: 0 } },
      },
    });
    useLanguageStore.getState().setLanguage('fr');
    useCartStore.getState().add(makeProduct({ name: 'Croissant', priceCents: 300 }), 2);
    renderWithProviders(<ReceiptCart onCharge={vi.fn()} />);
    expect(screen.getByText('Commande en cours')).toBeInTheDocument();
    expect(screen.getByText('2 articles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /espèces/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Un Croissant de plus' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('fr');
  });
});
