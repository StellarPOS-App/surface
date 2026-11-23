import { describe, it, expect } from 'vitest';
import { defaultLocale, locales } from '../locales';

/** Recursively collect every dot-path leaf key from an object. */
function collectKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    collectKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

const defaultKeys = new Set(collectKeys(locales[defaultLocale]));
const otherLocales = Object.keys(locales).filter((l) => l !== defaultLocale);

describe('i18n translation completeness', () => {
  it.each(otherLocales)('%s contains all keys from the default locale (%s)', (locale) => {
    const localeKeys = new Set(collectKeys(locales[locale]));
    const missing = [...defaultKeys].filter((k) => !localeKeys.has(k));
    expect(missing, `Missing keys in "${locale}": ${missing.join(', ')}`).toHaveLength(0);
  });

  it.each(otherLocales)('%s has no extra keys absent from the default locale', (locale) => {
    const localeKeys = new Set(collectKeys(locales[locale]));
    const extra = [...localeKeys].filter((k) => !defaultKeys.has(k));
    expect(extra, `Extra keys in "${locale}" not in default: ${extra.join(', ')}`).toHaveLength(0);
  });
});
