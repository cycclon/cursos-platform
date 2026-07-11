import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BookOpen, Award, ArrowRight, Package, CheckCircle2, ShieldCheck, AlertTriangle, CalendarClock, Loader2 } from 'lucide-react';
import { bundlesService } from '@/services/bundles';
import { coursesService } from '@/services/courses';
import { workshopsService } from '@/services/workshops';
import { workshopRegistrationsService } from '@/services/workshopRegistrations';
import { enrollmentsService } from '@/services/enrollments';
import { paymentsService } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice, formatDateTime } from '@/utils/format';
import { bundlePriceView } from '@/utils/pricing';
import { bundleCapacityStatus } from '@/utils/capacity';
import { bundleAvailability, bundleAvailabilityReason } from '@/utils/bundleAvailability';
import { CapacityBadge } from '@/components/ui/CapacityBadge';
import { AvailabilityBadge } from '@/components/ui/AvailabilityBadge';
import CourseCard from '@/components/course/CourseCard';
import type { Bundle, Course, Workshop } from '@/types';
import { CalendarDays, Video, MapPin } from 'lucide-react';

function getBundleCourses(bundle: Bundle, courses: Course[]): Course[] {
  return bundle.courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];
}

function getBundleWorkshops(bundle: Bundle, workshops: Workshop[]): Workshop[] {
  return (bundle.workshopIds ?? []).map(id => workshops.find(w => w.id === id)).filter(Boolean) as Workshop[];
}

function formatWorkshopDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatDateTime(d);
}

export default function BundleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { currency } = useLanguage();
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [enrolling, setEnrolling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: bundle, isLoading: loadingBundle } = useQuery({
    queryKey: ['bundles', slug],
    queryFn: () => bundlesService.getBundleBySlug(slug!),
    enabled: !!slug,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: workshops = [] } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => workshopsService.getWorkshops(),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsService.getEnrollments,
    enabled: isAuthenticated,
  });

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error(t('bundles.signInToEnroll'));
      navigate('/ingresar');
      return;
    }

    // If some courses are already enrolled and user hasn't confirmed yet, show confirmation
    if (someEnrolled && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    // Free bundle → direct enrollment + workshop registrations
    if (bundle!.price === 0) {
      setEnrolling(true);
      try {
        const toEnroll = bundleCourses.filter(c => !enrolledCourseIds.has(c.id));
        await Promise.all(toEnroll.map(c =>
          enrollmentsService.createEnrollment(c.id).catch(() => {}),
        ));
        const bundleWorkshops = getBundleWorkshops(bundle!, workshops);
        await Promise.all(bundleWorkshops.map(w =>
          workshopRegistrationsService.register(w.id).catch(() => {}),
        ));
        queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        queryClient.invalidateQueries({ queryKey: ['workshop-registrations'] });
        toast.success(t('bundles.enrollSuccess'));
        setShowConfirm(false);
      } catch {
        toast.error(t('bundles.enrollError'));
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // Paid bundle → USD lane (Lemon Squeezy) or ARS lane (Mercado Pago)
    setEnrolling(true);
    try {
      if (currency === 'USD' && bundle!.priceUsd) {
        const { checkoutUrl } = await paymentsService.createLemonCheckout({ bundleId: bundle!.id });
        window.location.href = checkoutUrl;
      } else {
        const { initPoint } = await paymentsService.createPreference({ bundleId: bundle!.id });
        window.location.href = initPoint;
      }
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 503 && error.message === 'mercadopago_not_connected') {
        toast.error(t('bundles.paymentUpdating'));
      } else if (error.message === 'bundle_course_not_available') {
        toast.error(t('bundles.courseUnavailable'));
      } else {
        toast.error(t('bundles.paymentError'));
      }
      setEnrolling(false);
    }
  };

  if (loadingBundle) {
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

  if (!bundle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">{t('bundles.notFound')}</h1>
        <Link to="/combos" className="text-chocolate mt-4 inline-block">{t('bundles.backToBundles')}</Link>
      </div>
    );
  }

  const bundleCourses = getBundleCourses(bundle, courses);
  const bundleWorkshops = getBundleWorkshops(bundle, workshops);
  const totalModules = bundleCourses.reduce((sum, c) => sum + (c.modules?.length ?? 0), 0);
  const pv = bundlePriceView(currency, bundle);
  const intlUnavailable = currency === 'USD' && !pv.usdAvailable;
  const savings = pv.compareAt != null ? pv.compareAt - pv.amount : 0;
  const capacityStatus = bundleCapacityStatus(bundleWorkshops);
  const isSoldOut = capacityStatus.kind === 'sold_out';
  const availability = bundleAvailability(bundleCourses, bundleWorkshops);
  const isUnavailable = availability.kind === 'unavailable';
  const unavailabilityReason = bundleAvailabilityReason(availability, t);
  const cantBuy = isSoldOut || isUnavailable || intlUnavailable;

  const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));
  const enrolledInBundle = bundleCourses.filter(c => enrolledCourseIds.has(c.id));
  const allEnrolled = bundleCourses.length > 0 && enrolledInBundle.length === bundleCourses.length;
  const someEnrolled = enrolledInBundle.length > 0 && !allEnrolled;
  const notEnrolledCount = bundleCourses.length - enrolledInBundle.length;

  return (
    <div>
      {/* Hero */}
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">{t('bundles.specialBundle')}</span>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-4 text-balance">
                {bundle.title}
              </h1>
              <p className="text-ink-light leading-relaxed mb-6">{bundle.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-light">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{t('bundles.coursesCount', { count: bundleCourses.length })}</span>
                <span className="flex items-center gap-1.5"><Package className="w-4 h-4" />{t('bundles.modulesCount', { count: totalModules })}</span>
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gold" />{t('bundles.withCertificates')}</span>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-parchment rounded-2xl shadow-warm-lg p-6 border border-chocolate-100/20 self-start">
              <div className="relative aspect-video rounded-xl overflow-hidden mb-5 bg-chocolate-50">
                {bundle.imageUrl && (
                  <img src={bundle.imageUrl} alt={bundle.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-ink/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-cream/90 flex items-center justify-center">
                    <Package className="w-5 h-5 text-chocolate" />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {bundle.discountLabel && capacityStatus.kind !== 'low' && !isSoldOut && !isUnavailable && (
                  <span className="inline-block bg-success-light text-success text-xs font-bold px-2.5 py-1 rounded-full">
                    {bundle.discountLabel}
                  </span>
                )}
                <CapacityBadge status={capacityStatus} variant="inline" />
                <AvailabilityBadge status={availability} variant="inline" />
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-bold text-chocolate">{formatPrice(pv.amount, pv.currency)}</span>
                  {pv.compareAt != null && (
                    <span className="text-lg text-ink-light line-through">{formatPrice(pv.compareAt, pv.currency)}</span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-success font-semibold text-sm mt-1">{t('bundles.youSave', { amount: formatPrice(savings, pv.currency) })}</p>
                )}
              </div>

              {allEnrolled ? (
                <div className="flex items-center gap-2 justify-center py-3 px-4 rounded-xl bg-success-light border border-success/20">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span className="text-sm font-semibold text-success">{t('bundles.alreadyEnrolledAll')}</span>
                </div>
              ) : showConfirm ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-gold/10 border border-gold/20">
                    <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div className="text-xs text-ink-light">
                      <p className="font-semibold text-ink mb-1">
                        {t('bundles.enrolledInSomeTitle', { count: enrolledInBundle.length })}
                      </p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {enrolledInBundle.map(c => (
                          <li key={c.id}>{c.title}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-ink">
                        {t('bundles.willAddCourses', { count: notEnrolledCount })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || cantBuy}
                    className="btn-primary btn-lg btn-full rounded-xl disabled:opacity-60"
                  >
                    {enrolling
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isUnavailable
                        ? t('bundles.bundleUnavailable')
                        : isSoldOut
                          ? t('bundles.bundleSoldOut')
                          : t('bundles.confirmEnrollment')}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="btn-ghost btn-md btn-full rounded-xl"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              ) : (
                <>
                  {someEnrolled && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-gold/10 border border-gold/20 mb-3">
                      <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      <p className="text-xs text-ink-light">
                        {t('bundles.enrolledInSomeShort', { enrolled: enrolledInBundle.length, total: bundleCourses.length })}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling || cantBuy}
                    className="btn-primary btn-lg btn-full rounded-xl disabled:opacity-60"
                  >
                    {enrolling
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : isUnavailable
                        ? t('bundles.bundleUnavailable')
                        : isSoldOut
                          ? t('bundles.bundleSoldOut')
                          : t('bundles.enrollNow')}
                  </button>
                  {intlUnavailable && (
                    <p className="mt-3 text-xs text-ink-light">{t('pricing.intlComingSoon')}</p>
                  )}
                  {isUnavailable && unavailabilityReason && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-chocolate/5 border border-chocolate/10">
                      <CalendarClock className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                      <div className="text-xs text-ink-light">
                        <p>{unavailabilityReason}</p>
                        {availability.kind === 'unavailable' && availability.items.length > 1 && (
                          <ul className="list-disc list-inside mt-1 space-y-0.5">
                            {availability.items.map((it) => (
                              <li key={`${it.kind}-${it.id}`}>
                                {it.title} <span className="text-ink-light/80">— {t(`common.availability.${it.status}`, it.status)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}
                  {isSoldOut && (
                    <p className="mt-3 text-xs text-ink-light">
                      {t('bundles.soldOutHint')}
                    </p>
                  )}
                </>
              )}

              <div className="mt-4 flex items-start gap-2 text-xs text-ink-light">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>{t('bundles.accessAfterPayment')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Included Courses */}
        {bundleCourses.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">{t('bundles.coursesIncluded')}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children mt-6">
              {bundleCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {/* Included Workshops */}
        {bundleWorkshops.length > 0 && (
          <div className="mb-12">
            <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">{t('bundles.workshopsIncluded')}</h2>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              {bundleWorkshops.map(workshop => (
                <Link
                  key={workshop.id}
                  to={`/talleres/${workshop.slug}`}
                  className="group flex gap-4 p-4 rounded-xl bg-parchment border border-chocolate-100/20 hover:border-chocolate/30 transition-colors shadow-warm"
                >
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-chocolate-50 shrink-0">
                    {workshop.imageUrl && (
                      <img src={workshop.imageUrl} alt={workshop.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
                      {workshop.modality === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {t('bundles.workshopLabel', { modality: t(`common.modality.${workshop.modality}`, workshop.modality) })}
                    </span>
                    <h3 className="font-display text-base font-bold text-ink mt-1 group-hover:text-chocolate transition-colors line-clamp-2">
                      {workshop.title}
                    </h3>
                    <p className="text-xs text-ink-light mt-1 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {formatWorkshopDate(workshop.scheduledAt)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm max-w-3xl">
          <h3 className="font-display text-lg font-bold text-ink mb-4 gold-underline">{t('bundles.whatIncludes')}</h3>
          <ul className="space-y-3">
            {[
              t('bundles.accessAllCourses', { count: bundleCourses.length }),
              t('bundles.downloadableAll'),
              t('bundles.modulesOfContent', { count: totalModules }),
              t('bundles.completionCertificates'),
              t('bundles.savingsOverIndividual', { amount: formatPrice(savings, pv.currency) }),
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-light">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <Link
            to="/combos"
            className="inline-flex items-center gap-1 text-sm text-chocolate font-medium hover:text-chocolate-dark transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            {t('bundles.backToBundles')}
          </Link>
        </div>
      </div>
    </div>
  );
}
