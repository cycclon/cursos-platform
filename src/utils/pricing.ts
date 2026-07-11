import type { AppCurrency } from '@/i18n/lang';

export interface PriceView {
  /** Currency actually shown — may fall back to ARS when no USD price exists. */
  currency: AppCurrency;
  /** Price to display / charge. */
  amount: number;
  /** Strikethrough "before" price, if the item is discounted. */
  compareAt?: number;
  /** Whether this item has a USD price (gates international checkout). */
  usdAvailable: boolean;
}

/**
 * Decide which price to show for the selected currency. USD is used only when the
 * item actually has a USD price; otherwise we fall back to showing ARS, and the
 * caller can disable international checkout via `usdAvailable`.
 */
export function resolvePriceView(
  selected: AppCurrency,
  ars: { amount: number; compareAt?: number },
  usd: { amount?: number; compareAt?: number },
): PriceView {
  const usdAvailable = usd.amount != null && usd.amount > 0;
  if (selected === 'USD' && usdAvailable) {
    return { currency: 'USD', amount: usd.amount as number, compareAt: usd.compareAt, usdAvailable };
  }
  return { currency: 'ARS', amount: ars.amount, compareAt: ars.compareAt, usdAvailable };
}

// Courses and workshops share a price shape: a base price with an optional
// discount, each mirrored in USD. The discounted price is what we charge; the
// base price becomes the strikethrough.
export function itemPriceView(
  selected: AppCurrency,
  item: { price: number; discountPrice?: number; priceUsd?: number; discountPriceUsd?: number },
): PriceView {
  return resolvePriceView(
    selected,
    {
      amount: item.discountPrice ?? item.price,
      compareAt: item.discountPrice != null ? item.price : undefined,
    },
    {
      amount: item.discountPriceUsd ?? item.priceUsd,
      compareAt: item.discountPriceUsd != null ? item.priceUsd : undefined,
    },
  );
}

// Bundles charge `price` and show `originalPrice` (the summed list price) struck
// through; USD mirrors this with priceUsd / originalPriceUsd.
export function bundlePriceView(
  selected: AppCurrency,
  bundle: { price: number; originalPrice: number; priceUsd?: number; originalPriceUsd?: number },
): PriceView {
  return resolvePriceView(
    selected,
    {
      amount: bundle.price,
      compareAt: bundle.originalPrice > bundle.price ? bundle.originalPrice : undefined,
    },
    {
      amount: bundle.priceUsd,
      compareAt:
        bundle.originalPriceUsd != null &&
        bundle.priceUsd != null &&
        bundle.originalPriceUsd > bundle.priceUsd
          ? bundle.originalPriceUsd
          : undefined,
    },
  );
}
