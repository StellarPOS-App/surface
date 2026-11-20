import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  /** True until the user picks a theme; until then the OS setting wins. */
  followSystem: boolean;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
}

const darkQuery = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

export const systemTheme = (): Theme => (darkQuery()?.matches ? 'dark' : 'light');

const apply = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#1B1916' : '#F5F0E6');
};

/**
 * Starts from the OS preference, and remembers an explicit choice across
 * reloads. Applied to <html data-theme> as soon as storage is read.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: systemTheme(),
      followSystem: true,
      setTheme: (theme) => {
        apply(theme);
        set({ theme, followSystem: false });
      },
      toggle: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
    }),
    {
      name: 'stellarpos.theme',
      onRehydrateStorage: () => (state) => apply(state?.theme ?? systemTheme()),
    },
  ),
);

// Track OS changes (e.g. automatic dark mode at sunset) until the user chooses.
darkQuery()?.addEventListener?.('change', () => {
  const { followSystem } = useThemeStore.getState();
  if (!followSystem) return;
  const theme = systemTheme();
  apply(theme);
  useThemeStore.setState({ theme });
});
