import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { takePendingPromo } from '@/utils/promoSession';

/**
 * Returns a visitor to their redemption after signing in.
 *
 * Someone scans a gift card, lands on /canjear/CODE, isn't signed in, and gets
 * sent off to sign in — which redirects by role, not back to where they came
 * from. Login and Register handle that themselves via `postLoginDestination`;
 * this covers the one path they can't see, the Google OAuth round-trip, which
 * leaves the SPA entirely and lands back on `/?login=success`.
 *
 * Deliberately sessionStorage rather than a `?next=` param: carrying a return
 * path through OAuth would need state plumbed through the backend, whereas this
 * survives the round-trip unchanged.
 */
export default function PromoReturn() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    const code = takePendingPromo();
    if (!code) return;
    navigate(`/canjear/${encodeURIComponent(code)}`, { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  return null;
}
