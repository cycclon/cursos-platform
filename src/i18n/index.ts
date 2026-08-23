import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { es } from './es';
import { en } from './en';
import {
  applyDocumentLang,
  detectInitialCurrency,
  detectInitialLang,
  setCurrentCurrency,
  setCurrentLang,
} from './lang';

const initialLang = detectInitialLang();
setCurrentLang(initialLang);
setCurrentCurrency(detectInitialCurrency(initialLang));
applyDocumentLang(initialLang);

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'es',
  supportedLngs: ['es', 'en'],
  returnObjects: true, // pages read list/card content as arrays via `tList`
  interpolation: {
    escapeValue: false, // React already escapes rendered strings
  },
});

export default i18n;

import type { TFunction } from 'i18next';

/**
 * Safely read an array of list/card items from the catalog. Falls back to `[]`
 * if the key is missing or i18next returns a non-array for any reason (e.g. a
 * stale bundle where the key doesn't exist yet), so a public page can never
 * hard-crash on `.map` over a translation lookup.
 */
export function tList<T = string>(t: TFunction, key: string): T[] {
  const value = t(key, { returnObjects: true });
  return Array.isArray(value) ? (value as T[]) : [];
}
