import en from './en.json';
import es from './es.json';

export const defaultLocale = 'en';
export const locales: Record<string, typeof en> = { en, es };
