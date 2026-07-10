import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { authService } from '@/services/auth';
import {
  applyDocumentLang,
  LANG_STORAGE_KEY,
  setCurrentLang,
  type AppLanguage,
} from '@/i18n/lang';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const language: AppLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'es';

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
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
