import type { UserRole } from '@/types';

/** Where /canjear parks a code while the visitor goes off to sign in. */
export const PENDING_PROMO_KEY = 'nj-promo-pending';
/** A code the student applied, carried across to a product page. */
export const ACTIVE_PROMO_KEY = 'nj-promo';

/** Consumes the parked code, if any. Reading it clears it. */
export function takePendingPromo(): string | null {
  const code = sessionStorage.getItem(PENDING_PROMO_KEY);
  if (code) sessionStorage.removeItem(PENDING_PROMO_KEY);
  return code;
}

/**
 * Where a freshly signed-in user belongs.
 *
 * Single source of truth, shared by Login and Register. It has to be one
 * function: when both those pages rendered their own `<Navigate>` *and*
 * PromoReturn navigated, the two raced — PromoReturn's effect ran first and
 * the page's `<Navigate>` then overwrote `/canjear/CODE` with `/mi-panel`,
 * dropping people out of the redemption flow they had just started.
 */
export function postLoginDestination(role: UserRole, search?: string): string {
  const next = search ? new URLSearchParams(search).get('next') : null;
  // Only ever an in-app path — never an absolute or protocol-relative URL,
  // which would turn the login page into an open redirect.
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;

  const pending = takePendingPromo();
  if (pending) return `/canjear/${encodeURIComponent(pending)}`;

  return role === 'teacher' ? '/admin/panel'
    : role === 'superuser' ? '/superusuario'
    : '/mi-panel';
}
