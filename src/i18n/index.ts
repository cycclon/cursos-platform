import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { es } from './es';
import { en } from './en';
import { applyDocumentLang, detectInitialLang, setCurrentLang } from './lang';

const initialLang = detectInitialLang();
setCurrentLang(initialLang);
applyDocumentLang(initialLang);

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: initialLang,
  fallbackLng: 'es',
  supportedLngs: ['es', 'en'],
  interpolation: {
    escapeValue: false, // React already escapes rendered strings
  },
});

export default i18n;
