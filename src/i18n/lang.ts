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

/** Keep the document language honest for a11y/SEO tooling. */
export function applyDocumentLang(lang: AppLanguage): void {
  document.documentElement.lang = lang === 'en' ? 'en' : 'es-AR';
}
