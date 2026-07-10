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
