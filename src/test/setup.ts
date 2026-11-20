import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useReceiptStore } from '@/stores/receiptStore';
import { useThemeStore } from '@/stores/themeStore';
import { resetProductCounter } from './utils';

/**
 * Newer Node versions ship an experimental global `localStorage` that is
 * undefined unless started with --localstorage-file, and it shadows jsdom's.
 * Install a small in-memory Storage so tests behave the same on every Node.
 */
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
}

if (typeof globalThis.localStorage?.clear !== 'function') {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
}

afterEach(() => {
  // DOM cleanup
  cleanup();

  // Web storage — clear both so persisted-store middleware never carries state
  // from one test into the next.
  localStorage.clear();
  sessionStorage.clear();

  // Global stubs (fetch, timers, …) — unstub here so individual tests never
  // need to remember to clean up after themselves.
  vi.unstubAllGlobals();

  // Zustand stores — reset to their blank initial state so no test can
  // observe state mutated by a previous test, regardless of run order.
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    challenge: null,
  });
  useCartStore.getState().clear();
  useThemeStore.setState({ theme: 'light', followSystem: true });
  useReceiptStore.getState().reset();

  // Deterministic IDs — reset the makeProduct counter so each test file
  // starts from p-1 and product IDs never depend on file execution order.
  resetProductCounter();
});
