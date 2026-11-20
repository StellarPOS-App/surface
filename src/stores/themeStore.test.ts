import { useThemeStore } from './themeStore';

describe('theme', () => {
  afterEach(() => useThemeStore.setState({ theme: 'light', followSystem: true }));

  it('applies the theme to <html> and persists an explicit choice', () => {
    useThemeStore.getState().setTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(useThemeStore.getState().followSystem).toBe(false);
    expect(JSON.parse(localStorage.getItem('stellarpos.theme')!).state.theme).toBe('dark');
  });

  it('toggles between day and night shift', () => {
    useThemeStore.getState().setTheme('light');
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('dark');
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().theme).toBe('light');
  });
});
