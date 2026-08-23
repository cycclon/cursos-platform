import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, X, Check, Loader2 } from 'lucide-react';
import { promoCodesService, type PromoItemRef } from '@/services/promoCodes';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { localizePromoError } from '@/i18n/errors';
import { formatPrice } from '@/utils/format';
import type { PromoQuote } from '@/types';

interface Props {
  /** Exactly one id — the item this code would apply to. */
  item: PromoItemRef;
  /** Lifted so the parent can send the code to checkout and branch on `free`. */
  quote: PromoQuote | null;
  onQuote: (quote: PromoQuote | null) => void;
  /** A code from `?codigo=` or a previous page, applied once on mount. */
  initialCode?: string;
}

/**
 * "¿Tenés un código?" disclosure for the price cards.
 *
 * The quote it renders is advisory: every checkout route re-resolves the code
 * and recomputes the discount server-side, so this can only ever be wrong in
 * the direction of showing the student a price they won't be charged.
 */
export default function PromoCodeField({ item, quote, onQuote, initialCode }: Props) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { currency } = useLanguage();

  const [open, setOpen] = useState(!!initialCode);
  const [code, setCode] = useState(initialCode ?? '');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoApplied = useRef(false);

  const apply = async (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value) return;
    if (!isAuthenticated) {
      setError(t('promo.signInToApply'));
      return;
    }
    setChecking(true);
    setError(null);
    try {
      onQuote(await promoCodesService.validate({ ...item, code: value, currency }));
    } catch (err) {
      onQuote(null);
      setError(localizePromoError(err, t));
    } finally {
      setChecking(false);
    }
  };

  // Auto-apply a code that arrived in the URL, once the student is signed in.
  useEffect(() => {
    if (!initialCode || autoApplied.current || !isAuthenticated) return;
    autoApplied.current = true;
    setOpen(true);
    void apply(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode, isAuthenticated]);

  // A currency switch changes the price the quote was made against.
  useEffect(() => {
    if (quote && quote.currency !== currency) onQuote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency]);

  const clear = () => {
    onQuote(null);
    setCode('');
    setError(null);
  };

  if (quote) {
    return (
      <div className="rounded-xl border border-success/40 bg-success-light/50 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="w-4 h-4 text-success shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">
                <span className="font-mono tracking-wide">{quote.code}</span>
                <span className="text-ink-light font-body font-normal">
                  {' · '}
                  {t('promo.discountOff', { percent: quote.discountPercent })}
                </span>
              </p>
              <p className="text-xs text-success">
                {quote.free
                  ? t('promo.freeWithCode')
                  : t('promo.youSave', { amount: formatPrice(quote.discountAmount, quote.currency) })}
              </p>
            </div>
          </div>
          <button
            onClick={clear}
            className="shrink-0 p-1.5 rounded-lg text-ink-light hover:text-error hover:bg-error-light transition-colors"
            aria-label={t('promo.remove')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-primary transition-colors"
      >
        <Tag className="w-3.5 h-3.5" />
        {t('promo.haveCode')}
      </button>
    );
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') void apply(code); }}
          placeholder={t('promo.placeholder')}
          aria-label={t('promo.haveCode')}
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-border bg-surface-raised text-sm font-mono tracking-wider text-ink placeholder:font-body placeholder:tracking-normal placeholder:text-ink-light/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
        />
        <button
          onClick={() => void apply(code)}
          disabled={checking || !code.trim()}
          className="shrink-0 inline-flex items-center gap-1.5 btn-secondary btn-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {checking ? t('promo.applying') : t('promo.apply')}
        </button>
      </div>
      {error && <p className="text-xs text-error mt-1.5">{error}</p>}
    </div>
  );
}
