import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ACTIVE_PROMO_KEY } from '@/utils/promoSession';
import type { PriceView } from '@/utils/pricing';
import type { PromoQuote } from '@/types';

/**
 * Promo-code state for a product page (course, combo or taller).
 *
 * Picks up a code from `?codigo=` (gift-card QR and influencer links) or from
 * the session (a catalogue-wide code the student accepted on /canjear), holds
 * the quote, and hands the page back the code to send to checkout.
 */
export function usePromoCheckout() {
  const [searchParams] = useSearchParams();
  const [quote, setQuoteState] = useState<PromoQuote | null>(null);

  const [initialCode] = useState<string | undefined>(
    () => searchParams.get('codigo') ?? sessionStorage.getItem(ACTIVE_PROMO_KEY) ?? undefined,
  );

  const setQuote = useCallback((next: PromoQuote | null) => {
    setQuoteState(next);
    // Removing the code should stop it re-applying on the next product page.
    if (!next) sessionStorage.removeItem(ACTIVE_PROMO_KEY);
  }, []);

  return { initialCode, quote, setQuote, promoCode: quote?.code };
}

/**
 * Folds an applied quote into the price a page displays: the discounted amount
 * becomes the headline and the list price becomes the strikethrough.
 *
 * A quote priced in another currency is ignored — the student switched
 * currencies after applying, and PromoCodeField will drop the stale quote.
 */
export function promoPriceView(pv: PriceView, quote: PromoQuote | null): PriceView {
  if (!quote || quote.currency !== pv.currency) return pv;
  return { ...pv, amount: quote.amount, compareAt: quote.listAmount };
}
