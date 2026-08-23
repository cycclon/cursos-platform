import type { TFunction } from 'i18next';
import { ApiError } from '@/services/api';

// Error codes the backend attaches to auth responses (additive contract —
// the Spanish `error` message is always present as fallback copy).
const KNOWN_CODES = new Set([
  'INVALID_CREDENTIALS',
  'ACCOUNT_NOT_VERIFIED',
  'EMAIL_TAKEN',
  'EMAIL_TAKEN_GOOGLE',
  'GMAIL_USE_GOOGLE',
  'RATE_LIMITED',
  'VERIFICATION_RESEND_COOLDOWN',
  'VERIFICATION_EMAIL_SEND_FAILED',
]);

// Promo/referral code rejections. These live under their own `promo.errors.*`
// namespace because they are student-facing copy on the price cards and the
// /canjear landing, not auth chrome.
const PROMO_CODES = new Set([
  'promo_not_found',
  'promo_inactive',
  'promo_expired',
  'promo_exhausted',
  'promo_not_applicable',
  'promo_already_used',
  'promo_already_owned',
  'promo_not_free',
  'promo_use_redeem',
]);

/**
 * Localizes a promo-code rejection. Accepts either an ApiError or a bare code
 * string (the /canjear endpoint returns `reason` in a 200 body rather than
 * throwing, so both shapes reach this).
 */
export function localizePromoError(err: unknown, t: TFunction): string {
  const code =
    typeof err === 'string' ? err
    : err instanceof ApiError ? err.code
    : undefined;
  if (code && PROMO_CODES.has(code)) return t(`promo.errors.${code}`);
  if (err instanceof ApiError) return err.message;
  return t('common.error');
}

/**
 * Best-effort localization of an API error: known codes map to dictionary
 * entries; unknown errors fall back to the backend's (Spanish) message, and
 * non-API errors to a generic localized message.
 */
export function localizeApiError(err: unknown, t: TFunction): string {
  if (err instanceof ApiError) {
    if (err.code && KNOWN_CODES.has(err.code)) return t(`errors.${err.code}`);
    return err.message;
  }
  return t('common.error');
}
