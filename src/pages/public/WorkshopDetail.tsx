import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays, Clock, Video, MapPin, Users, ArrowRight, ShieldCheck,
  CheckCircle2, AlertTriangle, Loader2,
} from 'lucide-react';
import { workshopsService } from '@/services/workshops';
import { workshopRegistrationsService } from '@/services/workshopRegistrations';
import { coursesService } from '@/services/courses';
import { enrollmentsService } from '@/services/enrollments';
import { paymentsService } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, formatDateTime } from '@/utils/format';
import { itemPriceView } from '@/utils/pricing';
import { promoPriceView, usePromoCheckout } from '@/hooks/usePromoCheckout';
import { promoCodesService } from '@/services/promoCodes';
import { localizePromoError } from '@/i18n/errors';
import PromoCodeField from '@/components/checkout/PromoCodeField';
import { workshopCapacityStatus } from '@/utils/capacity';
import { CapacityBadge } from '@/components/ui/CapacityBadge';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDateTime(d, { dateStyle: 'full', timeStyle: 'short' });
}

export default function WorkshopDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { currency } = useLanguage();
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const promo = usePromoCheckout();

  const { data: workshop, isLoading: loadingWorkshop } = useQuery({
    queryKey: ['workshops', slug],
    queryFn: () => workshopsService.getWorkshopBySlug(slug!),
    enabled: !!slug,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsService.getEnrollments,
    enabled: isAuthenticated,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['workshop-registrations'],
    queryFn: workshopRegistrationsService.getMyRegistrations,
    enabled: isAuthenticated,
  });

  const myRegistration = workshop
    ? registrations.find(r => {
        const wid = typeof r.workshopId === 'string' ? r.workshopId : r.workshopId?.id;
        return wid === workshop.id && r.attendanceStatus !== 'cancelled';
      })
    : undefined;

  const { data: access } = useQuery({
    queryKey: ['workshop-access', workshop?.id],
    queryFn: () => workshopRegistrationsService.getAccess(workshop!.id),
    enabled: !!workshop && !!myRegistration,
  });

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error(t('workshops.signInToEnroll'));
      navigate('/ingresar');
      return;
    }
    if (!workshop) return;

    setBusy(true);
    try {
      // A code that covers the whole price is redeemed, not paid — neither
      // gateway accepts a zero unit price.
      if (promo.quote?.free) {
        await promoCodesService.redeem({
          workshopId: workshop.id,
          code: promo.quote.code,
          currency: promo.quote.currency,
        });
        queryClient.invalidateQueries({ queryKey: ['workshop-registrations'] });
        toast.success(t('workshops.enrollConfirmed'));
        return;
      }
      if (workshop.price === 0) {
        await workshopRegistrationsService.register(workshop.id);
        queryClient.invalidateQueries({ queryKey: ['workshop-registrations'] });
        toast.success(t('workshops.enrollConfirmed'));
        return;
      }
      if (currency === 'USD' && (workshop.discountPriceUsd ?? workshop.priceUsd)) {
        const { checkoutUrl } = await paymentsService.createLemonCheckout({
          workshopId: workshop.id,
          promoCode: promo.promoCode,
        });
        window.location.href = checkoutUrl;
      } else {
        const { initPoint } = await paymentsService.createPreference({
          workshopId: workshop.id,
          promoCode: promo.promoCode,
        });
        window.location.href = initPoint;
      }
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string; code?: string };
      if (error.code?.startsWith('promo_')) {
        toast.error(localizePromoError(err, t));
      } else if (error.message === 'cupo_agotado') {
        toast.error(t('workshops.soldOutSorry'));
      } else if (error.status === 503 && error.message === 'mercadopago_not_connected') {
        toast.error(t('workshops.paymentUpdating'));
      } else if (error.message === 'already_registered') {
        toast.error(t('workshops.alreadyRegistered'));
      } else {
        toast.error(t('workshops.enrollError'));
      }
    } finally {
      setBusy(false);
    }
  };

  if (loadingWorkshop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 bg-parchment rounded animate-pulse w-1/4" />
            <div className="h-10 bg-parchment rounded animate-pulse w-3/4" />
            <div className="h-4 bg-parchment rounded animate-pulse" />
          </div>
          <div className="h-96 bg-parchment rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">{t('workshops.notFound')}</h1>
        <Link to="/talleres" className="text-chocolate mt-4 inline-block">{t('workshops.backToWorkshops')}</Link>
      </div>
    );
  }

  const pv = itemPriceView(currency, workshop);
  const intlUnavailable = currency === 'USD' && !pv.usdAvailable;
  // An applied code overrides the headline price and struck-through reference.
  const shownPrice = promoPriceView(pv, promo.quote);
  const seatsLeft =
    workshop.capacity != null ? Math.max(workshop.capacity - workshop.registeredCount, 0) : null;
  const capacityStatus = workshopCapacityStatus(workshop);
  const soldOut = capacityStatus.kind === 'sold_out';

  // Resolve prerequisite courses
  const prereqCourses = (workshop.prerequisiteCourseIds ?? [])
    .map(id => courses.find(c => c.id === id))
    .filter(Boolean) as { id: string; title: string; slug: string; hasTest?: boolean }[];

  const enrollmentByCourse = new Map(enrollments.map(e => [e.courseId, e]));
  const courseCompletion = (courseId: string): boolean => {
    const e = enrollmentByCourse.get(courseId);
    if (!e || (e.progress ?? 0) < 100) return false;
    const course = courses.find(c => c.id === courseId);
    if (course?.hasTest) return e.testPassed === true;
    return true;
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">
                {t('workshops.workshopLabel', { modality: t(`common.modality.${workshop.modality}`, workshop.modality) })}
              </span>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-4 text-balance">
                {workshop.title}
              </h1>
              <p className="text-ink-light leading-relaxed mb-6">{workshop.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-light">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{formatDate(workshop.scheduledAt)}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{t('workshops.minutes', { count: workshop.durationMinutes })}</span>
                {seatsLeft != null && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {seatsLeft > 0 ? t('workshops.seatsAvailable', { count: seatsLeft }) : t('workshops.soldOutSeats')}
                  </span>
                )}
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-parchment rounded-2xl shadow-warm-lg p-6 border border-chocolate-100/20 self-start">
              <div className="relative aspect-video rounded-xl overflow-hidden mb-5 bg-chocolate-50">
                {workshop.imageUrl && (
                  <img src={workshop.imageUrl} alt={workshop.title} className="w-full h-full object-cover" />
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {workshop.discountLabel && capacityStatus.kind !== 'low' && !soldOut && (
                  <span className="inline-block bg-success-light text-success text-xs font-bold px-2.5 py-1 rounded-full">
                    {workshop.discountLabel}
                  </span>
                )}
                <CapacityBadge status={capacityStatus} variant="inline" />
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-bold text-primary">
                    {shownPrice.amount === 0 ? t('promo.freeWithCode') : formatPrice(shownPrice.amount, shownPrice.currency)}
                  </span>
                  {shownPrice.compareAt != null && (
                    <span className="text-lg text-ink-light line-through">{formatPrice(shownPrice.compareAt, shownPrice.currency)}</span>
                  )}
                </div>
              </div>

              {!myRegistration && !soldOut && workshop.availability === 'Disponible' && (
                <div className="mb-4">
                  <PromoCodeField
                    item={{ workshopId: workshop.id }}
                    quote={promo.quote}
                    onQuote={promo.setQuote}
                    initialCode={promo.initialCode}
                  />
                </div>
              )}

              {myRegistration ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center py-3 px-4 rounded-xl bg-success-light border border-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span className="text-sm font-semibold text-success">{t('workshops.alreadyRegisteredTitle')}</span>
                  </div>

                  {access ? (
                    access.eligible ? (
                      <div className="rounded-xl border border-chocolate-100/30 p-4 bg-cream/40">
                        <p className="text-xs font-semibold text-ink mb-2 flex items-center gap-1.5">
                          {workshop.modality === 'online' ? <Video className="w-4 h-4 text-chocolate" /> : <MapPin className="w-4 h-4 text-chocolate" />}
                          {workshop.modality === 'online' ? t('workshops.roomLink') : t('workshops.address')}
                        </p>
                        {workshop.modality === 'online' && access.meetingUrl ? (
                          <a
                            href={access.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-chocolate hover:underline break-all"
                          >
                            {t('workshops.openRoom')}
                            <ArrowRight className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <p className="text-sm text-ink whitespace-pre-line">{access.location}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 p-3 rounded-xl bg-gold/10 border border-gold/20">
                        <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                        <div className="text-xs text-ink-light">
                          <p className="font-semibold text-ink mb-1">{t('workshops.accessPending')}</p>
                          <p className="mb-2">
                            {t('workshops.accessPendingHint')}
                          </p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {access.missing.map(m => (
                              <li key={m.id}>
                                <Link to={`/cursos/${m.slug}`} className="underline hover:text-chocolate">
                                  {m.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )
                  ) : null}
                </div>
              ) : (
                <>
                  <button
                    onClick={handleEnroll}
                    disabled={busy || soldOut || intlUnavailable}
                    className="btn-primary btn-lg btn-full rounded-xl disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : soldOut ? t('workshops.soldOutSeats') : t('workshops.enrollNow')}
                  </button>
                  {intlUnavailable && (
                    <p className="mt-3 text-xs text-ink-light">{t('pricing.intlComingSoon')}</p>
                  )}
                  {prereqCourses.length > 0 && (
                    <p className="mt-3 text-xs text-ink-light">
                      {t('workshops.enrollNowPrereqHint')}
                    </p>
                  )}
                </>
              )}

              <div className="mt-4 flex items-start gap-2 text-xs text-ink-light">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>{t('workshops.paymentAutoConfirm')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Prereq courses */}
          {prereqCourses.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-2 gold-underline">{t('workshops.requiredCourses')}</h2>
              <p className="text-sm text-ink-light mb-4">
                {t('workshops.requiredCoursesHint')}
              </p>
              <ul className="space-y-2">
                {prereqCourses.map(c => {
                  const completed = isAuthenticated && courseCompletion(c.id);
                  return (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-chocolate-100/30 bg-parchment"
                    >
                      <CheckCircle2
                        className={`w-5 h-5 shrink-0 ${completed ? 'text-success' : 'text-ink-light/30'}`}
                      />
                      <Link to={`/cursos/${c.slug}`} className="text-sm font-medium text-ink hover:text-chocolate flex-1">
                        {c.title}
                      </Link>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        completed ? 'text-success bg-success/10' : 'text-ink-light bg-cream-dark'
                      }`}>
                        {completed ? t('workshops.completed') : t('workshops.pendingLabel')}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Free-text prereqs */}
          {workshop.prerequisitesText.length > 0 && (
            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">{t('workshops.otherPrereqs')}</h2>
              <ul className="space-y-2">
                {workshop.prerequisitesText.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-light">
                    <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {/* Modality info */}
          <div className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
            <h3 className="font-display text-base font-bold text-ink mb-3">{t('workshops.meetingDetails')}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CalendarDays className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                <span className="text-ink-light">{formatDate(workshop.scheduledAt)}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                <span className="text-ink-light">{t('workshops.minutesLong', { count: workshop.durationMinutes })}</span>
              </li>
              <li className="flex items-start gap-2">
                {workshop.modality === 'online' ? (
                  <Video className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                ) : (
                  <MapPin className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                )}
                <span className="text-ink-light">
                  {workshop.modality === 'online' ? t('workshops.onlineMeeting') : t('workshops.inPersonMeeting')}
                </span>
              </li>
              {workshop.capacity != null && (
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                  <span className="text-ink-light">{t('workshops.totalSeats', { count: workshop.capacity })}</span>
                </li>
              )}
            </ul>
          </div>

          <Link
            to="/talleres"
            className="inline-flex items-center gap-1 text-sm text-chocolate font-medium hover:text-chocolate-dark transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            {t('workshops.backToWorkshops')}
          </Link>
        </aside>
      </div>
    </div>
  );
}
