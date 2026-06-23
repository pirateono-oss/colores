import type { Locale, TranslationDict } from './types';
import { en } from './i18n/en';
import { es } from './i18n/es';
import { pt } from './i18n/pt';

export const defaultLocale: Locale = 'es';
export const locales: Locale[] = ['en', 'es', 'pt'];
export const supportedLocales: string[] = ['en', 'es', 'pt'];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  pt: 'Português'
};

const dictionaries: Record<Locale, TranslationDict> = { en, es, pt };

export function getDictionary(locale: Locale): TranslationDict {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}

export function isValidLocale(locale: string): locale is Locale {
  return supportedLocales.includes(locale);
}
