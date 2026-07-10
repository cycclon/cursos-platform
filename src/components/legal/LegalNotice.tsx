import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

/**
 * Governing-language notice for the legal pages (Terms / Privacy / Refund).
 * The legally binding text is the Spanish original; machine-translating
 * contractual terms without legal review would create real exposure, so
 * English readers get this notice instead until the customer provides an
 * officially reviewed translation.
 */
export default function LegalNotice() {
  const { language } = useLanguage();
  const { t } = useTranslation();

  if (language !== 'en') return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 -mb-4">
      <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/10 border border-gold/30">
        <Languages className="w-5 h-5 text-chocolate shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-ink">{t('legal.noticeTitle')}</p>
          <p className="text-xs text-ink-light mt-1 leading-relaxed">{t('legal.noticeBody')}</p>
        </div>
      </div>
    </div>
  );
}
