// Language state shared by non-React modules (services/api.ts, utils/format.ts).
// React components should use useLanguage() from context/LanguageContext instead.

export type AppLanguage = 'es' | 'en';

export const LANG_STORAGE_KEY = 'lang';

let currentLang: AppLanguage = 'es';

export function getCurrentLang(): AppLanguage {
  return currentLang;
}

/** Internal — keep in sync via LanguageContext.setLanguage / i18n init. */
export function setCurrentLang(lang: AppLanguage): void {
  currentLang = lang;
}

/** Intl locale for the active language (dates/numbers/currency). */
export function currentLocale(): string {
  return currentLang === 'en' ? 'en-US' : 'es-AR';
}

/**
 * First-load detection chain: explicit device choice (localStorage) →
 * browser language → Spanish. The account preference (user.language) is
 * applied after login by LanguageContext when no device choice exists.
 */
export function detectInitialLang(): AppLanguage {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored === 'es' || stored === 'en') return stored;
  } catch {
    /* storage unavailable (privacy mode) — fall through */
  }
  const browser = (typeof navigator !== 'undefined' && navigator.language) || '';
  return browser.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export type AppCurrency = 'ARS' | 'USD';

export const CURRENCY_STORAGE_KEY = 'currency';

let currentCurrency: AppCurrency = 'ARS';

export function getCurrentCurrency(): AppCurrency {
  return currentCurrency;
}

/** Internal — keep in sync via LanguageContext.setCurrency / i18n init. */
export function setCurrentCurrency(currency: AppCurrency): void {
  currentCurrency = currency;
}

/**
 * Initial display currency: explicit device choice (localStorage) → derived from
 * language (English → USD, Spanish → ARS). Currency is a display + checkout-lane
 * choice, independent of the API payload (which always carries both prices).
 */
export function detectInitialCurrency(lang: AppLanguage): AppCurrency {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored === 'ARS' || stored === 'USD') return stored;
  } catch {
    /* storage unavailable (privacy mode) — fall through */
  }
  return lang === 'en' ? 'USD' : 'ARS';
}

/** Keep the document language honest for a11y/SEO tooling. */
export function applyDocumentLang(lang: AppLanguage): void {
  document.documentElement.lang = lang === 'en' ? 'en' : 'es-AR';
}
