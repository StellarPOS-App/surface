import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { en, type Messages } from './en';
import { es } from './es';
import { fr } from './fr';

export const LANGUAGES = {
  en: { label: 'English', messages: en as Messages },
  fr: { label: 'Français', messages: fr },
  es: { label: 'Español', messages: es },
} as const;
export type Language = keyof typeof LANGUAGES;

/** The browser's preferred language if we have it, else English. */
export function detectLanguage(preferred: readonly string[] = navigator.languages ?? []): Language {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (base in LANGUAGES) return base as Language;
  }
  return 'en';
}

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      setLanguage: (language) => {
        document.documentElement.lang = language;
        set({ language });
      },
    }),
    {
      name: 'stellarpos.language',
      onRehydrateStorage: () => (state) => {
        document.documentElement.lang = state?.language ?? 'en';
      },
    },
  ),
);

type Leaf = string | { [k: string]: string };

function lookup(messages: Messages, key: string): Leaf | undefined {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) => (node as Record<string, unknown> | undefined)?.[part],
      messages,
    ) as Leaf | undefined;
}

/**
 * Translates a dotted key ("cart.items") for a language, filling {name}
 * placeholders. Plural entries pick a form with Intl.PluralRules using
 * `count`. Falls back to English, then to the key itself.
 */
export function translate(
  language: Language,
  key: string,
  values: Record<string, string | number> = {},
): string {
  let entry = lookup(LANGUAGES[language].messages, key) ?? lookup(en as Messages, key);
  if (entry === undefined) return key;
  if (typeof entry !== 'string') {
    const form = new Intl.PluralRules(language).select(Number(values.count ?? 0));
    entry = entry[form] ?? entry.other;
  }
  return entry.replace(/\{(\w+)\}/g, (_, name: string) =>
    values[name] === undefined ? `{${name}}` : String(values[name]),
  );
}

/** React hook: `const t = useT(); t('pos.search')`. */
export function useT() {
  const language = useLanguageStore((s) => s.language);
  // Stable per language, so it is safe in effect and callback dependencies.
  return useCallback(
    (key: string, values?: Record<string, string | number>) => translate(language, key, values),
    [language],
  );
}
