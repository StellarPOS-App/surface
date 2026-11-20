import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { Product } from '@/types';

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', ...opts }: RenderOptions & { route?: string } = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  return { client, ...render(ui, { wrapper: Wrapper, ...opts }) };
}

let n = 0;
/** Reset the auto-increment counter used by makeProduct. Called by setup.ts afterEach. */
export function resetProductCounter() {
  n = 0;
}
export function makeProduct(overrides: Partial<Product> = {}): Product {
  n++;
  return {
    id: `p-${n}`,
    name: `Product ${n}`,
    sku: `SKU-${n}`,
    description: '',
    category: 'Coffee',
    priceCents: 400,
    stock: 10,
    lowStockThreshold: 3,
    active: true,
    lowStock: false,
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00',
    ...overrides,
  };
}

/** Stubs fetch with a router of `METHOD path` -> JSON body (already enveloped). */
export function mockFetch(routes: Record<string, { status?: number; body: unknown }>) {
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), 'http://localhost');
    const key = `${init?.method ?? 'GET'} ${url.pathname}`;
    const hit = routes[key];
    if (!hit)
      return new Response(JSON.stringify({ success: false, error: `No mock for ${key}` }), {
        status: 404,
      });
    return new Response(JSON.stringify(hit.body), {
      status: hit.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  vi.stubGlobal('fetch', fn);
  return fn;
}
