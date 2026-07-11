import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { authService } from '@/services/auth';
import {
  applyDocumentLang,
  CURRENCY_STORAGE_KEY,
  getCurrentCurrency,
  LANG_STORAGE_KEY,
  setCurrentCurrency,
  setCurrentLang,
  type AppCurrency,
  type AppLanguage,
} from '@/i18n/lang';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  currency: AppCurrency;
  setCurrency: (currency: AppCurrency) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const language: AppLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'es';
  const [currency, setCurrencyState] = useState<AppCurrency>(() => getCurrentCurrency());

  const applyLanguage = useCallback(
    (lang: AppLanguage) => {
      setCurrentLang(lang);
      applyDocumentLang(lang);
      void i18n.changeLanguage(lang);
      // Content endpoints answer per-language (?lang=), so every cached
      // payload is stale after a switch. A blanket invalidation is the
      // simplest correct move at this app's scale.
      void queryClient.invalidateQueries();
    },
    [i18n, queryClient],
  );

  const setLanguage = useCallback(
    (lang: AppLanguage) => {
      if (lang === language) return;
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang);
      } catch {
        /* storage unavailable — the choice still applies for this session */
      }
      applyLanguage(lang);
      if (isAuthenticated) {
        // Persist across devices; non-blocking (failure just means the
        // account pref lags behind this device's choice).
        authService
          .updateMe({ language: lang })
          .then((updated) => queryClient.setQueryData(['auth', 'me'], updated))
          .catch(() => undefined);
      }
    },
    [applyLanguage, isAuthenticated, language, queryClient],
  );

  const setCurrency = useCallback(
    (next: AppCurrency) => {
      if (next === currency) return;
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, next);
      } catch {
        /* storage unavailable — the choice still applies for this session */
      }
      setCurrentCurrency(next);
      setCurrencyState(next);
    },
    [currency],
  );

  // Until the visitor explicitly picks a currency, follow the language default
  // (English → USD, Spanish → ARS). An explicit choice (stored) sticks.
  useEffect(() => {
    let hasChoice = false;
    try {
      const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
      hasChoice = stored === 'ARS' || stored === 'USD';
    } catch {
      /* ignore */
    }
    if (hasChoice) return;
    const next: AppCurrency = language === 'en' ? 'USD' : 'ARS';
    if (next !== currency) {
      setCurrentCurrency(next);
      setCurrencyState(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // Account preference: when the user logs in on a device without an explicit
  // local choice, follow their stored language.
  useEffect(() => {
    if (!user?.language) return;
    let hasLocalChoice = false;
    try {
      const stored = localStorage.getItem(LANG_STORAGE_KEY);
      hasLocalChoice = stored === 'es' || stored === 'en';
    } catch {
      /* ignore */
    }
    if (!hasLocalChoice && user.language !== language) {
      applyLanguage(user.language);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currency, setCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
