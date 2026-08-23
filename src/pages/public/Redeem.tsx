import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ticket, AlertCircle, Loader2, ArrowRight, Gift } from 'lucide-react';
import { promoCodesService } from '@/services/promoCodes';
import { enrollmentsService } from '@/services/enrollments';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { localizePromoError } from '@/i18n/errors';
import { formatDate } from '@/utils/format';
import { ACTIVE_PROMO_KEY, PENDING_PROMO_KEY } from '@/utils/promoSession';

/** Product-page path for each kind of scoped item. */
const PATH_FOR: Record<string, string> = {
  course: '/cursos',
  bundle: '/combos',
  workshop: '/talleres',
};

export default function Redeem() {
  const { code = '' } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { currency } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activating, setActivating] = useState(false);

  const { data: info, isLoading } = useQuery({
    queryKey: ['promo-public', code],
    queryFn: () => promoCodesService.publicInfo(code),
    enabled: !!code,
    retry: false,
  });

  // Used to tell a student who already owns the course to just go and take it,
  // rather than offering an "Activar" button the server would (correctly) refuse.
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsService.getEnrollments,
    enabled: isAuthenticated,
  });

  /**
   * Two independent ways back here after signing in, because each one has a
   * hole the other covers: `?next=` survives a lost sessionStorage but is
   * dropped by the Google OAuth round-trip (it leaves the SPA entirely), while
   * sessionStorage survives that round-trip but not a change of browser context.
   */
  const returnPath = `/canjear/${encodeURIComponent(code.toUpperCase())}`;

  /**
   * Park the code as soon as a signed-out visitor lands here, not on the CTA
   * click: the header has its own "Ingresar" link, and someone who taps that
   * instead would otherwise lose the return path entirely.
   */
  useEffect(() => {
    if (!isAuthenticated && info?.valid) {
      sessionStorage.setItem(PENDING_PROMO_KEY, code.toUpperCase());
    }
  }, [isAuthenticated, info, code]);

  const handleActivate = async (item: { type: string; id: string }) => {
    setActivating(true);
    try {
      const ref =
        item.type === 'course' ? { courseId: item.id }
        : item.type === 'bundle' ? { bundleId: item.id }
        : { workshopId: item.id };
      const result = await promoCodesService.redeem({ ...ref, code: code.toUpperCase(), currency });

      // Enrolling changes what /courses returns (module videos are stripped for
      // viewers without access), so both caches have to go — see CourseDetail.
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });

      toast.success(t('promo.activated'));
      navigate(result.type === 'course' ? `/aprender/${result.itemId}` : '/mi-panel');
    } catch (err) {
      toast.error(localizePromoError(err, t));
      setActivating(false);
    }
  };

  /* ── Loading ──────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="h-4 w-32 bg-surface-raised rounded animate-pulse" />
        <div className="h-12 w-3/4 bg-surface-raised rounded animate-pulse mt-4" />
        <div className="h-24 bg-surface-raised rounded-xl animate-pulse mt-8" />
      </div>
    );
  }

  /* ── Invalid ──────────────────────────────────────── */
  if (!info || !info.valid) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-10 h-10 text-error/60 mx-auto mb-5" />
        <h1 className="font-display text-2xl font-bold text-ink">{t('promo.invalidTitle')}</h1>
        <p className="text-ink-light mt-2">
          {localizePromoError(info?.reason ?? 'promo_not_found', t)}
        </p>
        <p className="font-mono text-xs tracking-[0.2em] text-ink-light/60 mt-4">{code.toUpperCase()}</p>
        <Link to="/cursos" className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl mt-8">
          {t('promo.browseCourses')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const expiry = info.expiresAt ? formatDate(info.expiresAt) : null;
  const singleItem = info.items.length === 1 ? info.items[0] : null;
  // The server refuses to redeem something the student already has (it would
  // burn a use for nothing), so send them to the course instead of offering a
  // button that can only fail.
  const ownedItem =
    singleItem?.type === 'course' && enrollments.some((e) => e.courseId === singleItem.id)
      ? singleItem
      : null;
  const oneClick = info.free && !!singleItem && !ownedItem;

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 sm:py-20">
      <span className="section-eyebrow">01 — {t('promo.redeemEyebrow')}</span>

      <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.05] text-ink mt-5">
        {t('promo.redeemTitle')}
      </h1>

      {/* The code itself, framed like a case-file tag */}
      <div className="relative inline-block mt-8 px-6 py-4 border border-primary/30 rounded-xl bg-surface-raised">
        <span className="corner-bracket corner-bracket-tl" />
        <span className="corner-bracket corner-bracket-br" />
        <p className="font-mono text-2xl font-bold tracking-[0.18em] text-ink">{info.code}</p>
      </div>

      <p className="text-lg text-ink-light mt-6 leading-relaxed">
        {info.free
          ? t('promo.unlocksFull')
          : t('promo.unlocksDiscount', { percent: info.discountPercent })}
      </p>

      {/* What it applies to */}
      <div className="mt-6">
        {info.scope === 'all' ? (
          <p className="text-sm text-ink-light">{t('promo.appliesToAll')}</p>
        ) : (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-light/70 mb-2">
              {t('promo.appliesToThese')}
            </p>
            <ul className="space-y-1">
              {info.items.map((item) => (
                <li key={`${item.type}:${item.id}`} className="flex items-center gap-2 text-sm text-ink">
                  <Ticket className="w-3.5 h-3.5 text-primary shrink-0" />
                  {item.title}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {expiry && (
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-light/60 mt-6">
          {t('promo.expiresOn', { date: expiry })}
        </p>
      )}

      {/* Action */}
      <div className="mt-10 pt-8 border-t border-primary-100/20">
        {ownedItem ? (
          <>
            <p className="text-ink-light mb-4">{t('promo.alreadyOwned')}</p>
            <Link
              to={`/aprender/${ownedItem.id}`}
              className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
            >
              {t('promo.goToCourse')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : !isAuthenticated ? (
          <>
            <p className="text-ink-light mb-4">{t('promo.signInToRedeem')}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/ingresar?next=${encodeURIComponent(returnPath)}`}
                className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
              >
                {t('promo.signIn')}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={`/registrarse?next=${encodeURIComponent(returnPath)}`}
                className="inline-flex items-center gap-2 btn-ghost btn-md rounded-xl"
              >
                {t('promo.createAccount')}
              </Link>
            </div>
            {/* Belt and braces: the return trip can still be lost if the sign-in
                happens in a different browser context (an in-app browser handing
                off to the system one, for instance), and a student stranded on
                their dashboard has no idea what to do next. */}
            <p className="text-xs text-ink-light/70 mt-4">{t('promo.rescanHint')}</p>
          </>
        ) : oneClick ? (
          <button
            onClick={() => handleActivate(singleItem!)}
            disabled={activating}
            className="inline-flex items-center gap-2 btn-primary btn-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {activating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
            {activating ? t('promo.activating') : t('promo.activate')}
          </button>
        ) : (
          <>
            <p className="text-ink-light mb-4">{t('promo.pickAnItem')}</p>
            <div className="flex flex-wrap gap-3">
              {info.scope === 'all' ? (
                <Link
                  to="/cursos"
                  onClick={() => sessionStorage.setItem(ACTIVE_PROMO_KEY, info.code)}
                  className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
                >
                  {t('promo.browseCourses')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                info.items.map((item) => (
                  <Link
                    key={`${item.type}:${item.id}`}
                    to={`${PATH_FOR[item.type]}/${item.slug}?codigo=${encodeURIComponent(info.code)}`}
                    className="inline-flex items-center gap-2 btn-secondary btn-md rounded-xl"
                  >
                    {item.title}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
