import { useParams, Link } from 'react-router-dom';
import {
  Clock, Users, BookOpen, Award, ShieldCheck, Lock, Play, Star,
  FileText, ChevronDown, ChevronUp, ArrowRight, CheckCircle2, Loader2, Send, Link2, Layers,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { coursesService } from '@/services/courses';
import { enrollmentsService } from '@/services/enrollments';
import { paymentsService } from '@/services/payments';
import CourseImage from '@/components/ui/CourseImage';
import ModuleVideoPreview from '@/components/ui/ModuleVideoPreview';
import { reviewsService } from '@/services/reviews';
import { formatPrice, formatDate } from '@/utils/format';
import { itemPriceView } from '@/utils/pricing';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import StarRating from '@/components/ui/StarRating';

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user, role, isAuthenticated } = useAuth();
  const { currency } = useLanguage();
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ['courses', slug],
    queryFn: () => coursesService.getCourseBySlug(slug!),
    enabled: !!slug,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsService.getEnrollments,
    enabled: isAuthenticated && role === 'student',
  });

  const isEnrolled = enrollments.some(e => e.courseId === course?.id);
  const [enrolling, setEnrolling] = useState(false);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error(t('courseDetail.signInToEnroll'));
      return;
    }

    if (course!.availability !== 'Disponible') {
      toast.error(t('courseDetail.notAvailable'));
      return;
    }

    const effectivePrice = course!.discountPrice ?? course!.price;

    // Free course → direct enrollment
    if (effectivePrice === 0) {
      setEnrolling(true);
      try {
        await enrollmentsService.createEnrollment(course!.id);
        queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        toast.success(t('courseDetail.enrollSuccess'));
      } catch (err: unknown) {
        const error = err as { status?: number };
        if (error.status === 409) {
          queryClient.invalidateQueries({ queryKey: ['enrollments'] });
          toast.success(t('courseDetail.alreadyEnrolled'));
        } else {
          toast.error(t('courseDetail.enrollError'));
        }
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // Paid course → USD lane (Lemon Squeezy) or ARS lane (Mercado Pago)
    setEnrolling(true);
    try {
      if (currency === 'USD' && (course!.discountPriceUsd ?? course!.priceUsd)) {
        const { checkoutUrl } = await paymentsService.createLemonCheckout({ courseId: course!.id });
        window.location.href = checkoutUrl;
      } else {
        const { initPoint } = await paymentsService.createPreference({ courseId: course!.id });
        window.location.href = initPoint;
      }
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 503 && error.message === 'mercadopago_not_connected') {
        toast.error(t('courseDetail.paymentUpdating'));
      } else {
        toast.error(t('courseDetail.paymentError'));
      }
      setEnrolling(false);
    }
  };

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', course?.id],
    queryFn: () => reviewsService.getCourseReviews(course!.id),
    enabled: !!course?.id,
  });

  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  // Review form state
  const enrollment = enrollments.find(e => e.courseId === course?.id);
  const hasCompleted = enrollment?.progress === 100;
  const hasReviewed = reviews.some(r => r.studentId === user?.id);
  const canReview = isAuthenticated && role === 'student' && hasCompleted && !hasReviewed;

  const [reviewForm, setReviewForm] = useState({
    contenido: 0,
    claridad: 0,
    material: 0,
    valorPrecio: 0,
    comment: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Review category keys are contract field names; only labels are localized.
  const categoryLabels: Record<string, string> = {
    contenido: t('courseDetail.categories.contenido'),
    claridad: t('courseDetail.categories.claridad'),
    material: t('courseDetail.categories.material'),
    valorPrecio: t('courseDetail.categories.valorPrecio'),
  };

  const allCategoriesRated = reviewForm.contenido > 0 && reviewForm.claridad > 0
    && reviewForm.material > 0 && reviewForm.valorPrecio > 0;

  const handleSubmitReview = async () => {
    if (!allCategoriesRated || !reviewForm.comment.trim()) return;

    const { contenido, claridad, material, valorPrecio, comment } = reviewForm;
    const rating = Math.round(((contenido + claridad + material + valorPrecio) / 4) * 10) / 10;

    setSubmittingReview(true);
    try {
      await reviewsService.createReview({
        courseId: course!.id,
        rating,
        categories: { contenido, claridad, material, valorPrecio },
        comment,
      });
      queryClient.invalidateQueries({ queryKey: ['reviews', course!.id] });
      queryClient.invalidateQueries({ queryKey: ['courses', slug] });
      toast.success(t('courseDetail.reviewThanks'));
    } catch (err: unknown) {
      const error = err as { status?: number };
      if (error.status === 409) {
        toast.error(t('courseDetail.alreadyReviewed'));
      } else {
        toast.error(t('courseDetail.reviewError'));
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (isLoading) {
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

  if (!course) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">{t('courseDetail.notFound')}</h1>
        <Link to="/cursos" className="text-chocolate mt-4 inline-block">{t('courseDetail.backToCatalog')}</Link>
      </div>
    );
  }

  // Set initial expanded module after data loads
  if (expandedModule === null && (course.modules?.length ?? 0) > 0) {
    // Use a ref-like approach or just let it be null on first render
  }

  const pv = itemPriceView(currency, course);
  const intlUnavailable = currency === 'USD' && !pv.usdAvailable;

  const fileIcon: Record<string, string> = { pdf: 'PDF', docx: 'DOC', pptx: 'PPT', xlsx: 'XLS' };

  return (
    <div>
      {/* Hero */}
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">{course.category}</span>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-4 text-balance">
                {course.title}
              </h1>
              <p className="text-ink-light leading-relaxed mb-6 whitespace-pre-line">{course.summary}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-light mb-6">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course.duration}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{course.modules?.length ?? 0} {t('courseDetail.modules')}</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{course.studentCount} {t('courseDetail.students')}</span>
                {course.hasCertificate && <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gold" />{t('courseDetail.withCertificate')}</span>}
              </div>

              <div className="flex items-center gap-3">
                <StarRating rating={course.rating} showValue />
                <span className="text-sm text-ink-light">({course.reviewCount} {t('courseDetail.reviewsCount')})</span>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-parchment rounded-2xl shadow-warm-lg p-6 border border-chocolate-100/20 self-start">
              <div className="relative aspect-video rounded-xl overflow-hidden mb-5">
                <CourseImage src={course.imageUrl} alt={course.title} />
                <div className="absolute inset-0 bg-ink/30 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-cream/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-chocolate ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="mb-4">
                {pv.compareAt != null ? (
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl font-bold text-chocolate">{formatPrice(pv.amount, pv.currency)}</span>
                    <span className="text-lg text-ink-light line-through">{formatPrice(pv.compareAt, pv.currency)}</span>
                    {course.discountLabel && (
                      <span className="text-xs font-bold text-error bg-error-light px-2 py-0.5 rounded-full">{course.discountLabel}</span>
                    )}
                  </div>
                ) : (
                  <span className="font-display text-3xl font-bold text-chocolate">{formatPrice(pv.amount, pv.currency)}</span>
                )}
              </div>

              {role === 'student' && isEnrolled ? (
                <Link
                  to={`/aprender/${course.id}`}
                  className="block text-center btn-primary btn-lg btn-full rounded-xl"
                >
                  {t('courseDetail.goToCourse')}
                </Link>
              ) : role === 'teacher' && course.teacherId === user?.id ? (
                <Link
                  to={`/admin/cursos`}
                  className="block text-center btn-secondary btn-lg btn-full rounded-xl"
                >
                  {t('courseDetail.editCourse')}
                </Link>
              ) : course.availability !== 'Disponible' ? (
                <button
                  disabled
                  className="btn-primary btn-lg btn-full rounded-xl opacity-60 cursor-not-allowed"
                >
                  {course.availability === 'Próximamente'
                    ? t('courseDetail.comingSoon')
                    : course.availability === 'Cerrado'
                      ? t('courseDetail.enrollmentsClosed')
                      : t('courseDetail.unavailable')}
                </button>
              ) : intlUnavailable ? (
                <button
                  disabled
                  className="btn-primary btn-lg btn-full rounded-xl opacity-60 cursor-not-allowed"
                >
                  {t('courseDetail.enrollNow')}
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary btn-lg btn-full rounded-xl disabled:opacity-60"
                >
                  {enrolling ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('courseDetail.enrollNow')}
                </button>
              )}

              {intlUnavailable && (
                <p className="mt-3 text-xs text-ink-light text-center">{t('pricing.intlComingSoon')}</p>
              )}

              {course.moneyBackGuarantee && (
                <div className="mt-4 flex items-start gap-2 text-xs text-ink-light">
                  <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{course.moneyBackGuarantee}</span>
                </div>
              )}

              <p className="text-xs text-ink-light mt-3 text-center">
                {t(`common.availability.${course.availability}`, course.availability)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">{t('courseDetail.description')}</h2>
              <div className="prose prose-sm max-w-none text-ink-light leading-relaxed mt-6 whitespace-pre-line">
                {course.description}
              </div>
            </div>

            {/* Correlative courses */}
            {(course.prerequisiteCourseIds?.length ?? 0) > 0 && (
              <CorrelativeCourses prerequisiteCourseIds={course.prerequisiteCourseIds} />
            )}

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">{t('courseDetail.prerequisites')}</h2>
                <ul className="mt-6 space-y-2">
                  {course.prerequisites.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-light">
                      <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Modules */}
            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">{t('courseDetail.courseContent')}</h2>
              <p className="text-sm text-ink-light mb-6 mt-6">
                {t('courseDetail.contentMeta', { count: course.modules?.length ?? 0, duration: course.duration })}
              </p>
              <div className="space-y-3">
                {course.modules.map(mod => {
                  const isOpen = expandedModule === mod.id;
                  const videoCount = (mod.videos?.length ?? 0) > 0 ? mod.videos.length : (mod.videoCount ?? 0);
                  const flashcardCount = (mod.flashcards?.length ?? 0) > 0 ? mod.flashcards!.length : (mod.flashcardCount ?? 0);
                  return (
                    <div
                      key={mod.id}
                      className={`rounded-xl border transition-all ${
                        isOpen ? 'border-chocolate/20 shadow-warm bg-parchment' : 'border-chocolate-100/30 bg-parchment/50'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedModule(isOpen ? null : mod.id)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                            mod.isFree ? 'bg-success-light text-success' : 'bg-chocolate-50 text-chocolate'
                          }`}>
                            {mod.number}
                          </span>
                          <div>
                            <span className="text-sm font-semibold text-ink block">{mod.title}</span>
                            <span className="text-xs text-ink-light">
                              {mod.videoDuration && `${mod.videoDuration} · `}
                              {t('courseDetail.videoCount', { count: videoCount })} · {t('courseDetail.materialCount', { count: mod.materials.length })}
                              {(mod.links ?? []).length > 0 && ` · ${t('courseDetail.linkCount', { count: mod.links!.length })}`}
                              {flashcardCount > 0 && ` · ${t('courseDetail.cardCount', { count: flashcardCount })}`}
                              {mod.isFree && <span className="text-success font-semibold ml-2">{t('courseDetail.free')}</span>}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!mod.isFree && <Lock className="w-3.5 h-3.5 text-ink-light" />}
                          {isOpen ? <ChevronUp className="w-4 h-4 text-chocolate-light" /> : <ChevronDown className="w-4 h-4 text-ink-light" />}
                        </div>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 border-t border-chocolate-100/20 pt-3">
                          <p className="text-sm text-ink-light mb-3">{mod.description}</p>
                          {(mod.videos ?? []).length > 0 && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                              {mod.videos.map(v => (
                                <ModuleVideoPreview key={v.id} video={v} />
                              ))}
                            </div>
                          )}
                          {mod.materials.length > 0 && (
                            <div className="space-y-1.5">
                              {mod.materials.map(mat => (
                                <div key={mat.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-cream-dark/50">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-chocolate-light" />
                                    <span className="text-xs text-ink">{mat.name}</span>
                                    <span className="text-[10px] font-bold text-chocolate bg-chocolate-50 px-1.5 py-0.5 rounded">
                                      {fileIcon[mat.type] || mat.type.toUpperCase()}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-ink-light">{mat.size}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          {(mod.links ?? []).length > 0 && (
                            <div className="space-y-1.5 mt-1.5">
                              {(mod.links ?? []).map((link, li) => {
                                const inner = (
                                  <span className="flex items-center gap-2">
                                    <Link2 className="w-3.5 h-3.5 text-chocolate-light shrink-0" />
                                    <span className={`text-xs ${link.url ? 'text-chocolate' : 'text-ink'}`}>{link.title}</span>
                                  </span>
                                );
                                return link.url ? (
                                  <a
                                    key={link.id ?? li}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={link.description || link.url}
                                    className="block py-1.5 px-3 rounded-lg bg-cream-dark/50 hover:bg-cream-dark transition-colors hover:underline"
                                  >
                                    {inner}
                                  </a>
                                ) : (
                                  <div
                                    key={link.id ?? li}
                                    title={link.description || undefined}
                                    className="py-1.5 px-3 rounded-lg bg-cream-dark/50"
                                  >
                                    {inner}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {flashcardCount > 0 && (
                            <div className="mt-1.5 py-1.5 px-3 rounded-lg bg-cream-dark/50 flex items-center gap-2">
                              <Layers className="w-3.5 h-3.5 text-chocolate-light shrink-0" />
                              <span className="text-xs text-ink">
                                {t('courseDetail.studyCards', { count: flashcardCount })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test info */}
            {course.hasTest && course.testConfig && (
              <div className="bg-chocolate-50 rounded-xl p-6 border border-chocolate-100/30">
                <h3 className="font-display text-lg font-bold text-ink mb-3">{t('courseDetail.examTitle')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-chocolate">{course.questionCount ?? course.testConfig.totalQuestions}</p>
                    <p className="text-xs text-ink-light">{t('courseDetail.questions')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-chocolate">
                      {course.testConfig.timed === false ? t('courseDetail.noTimeLimit') : `${course.testConfig.timeLimit} ${t('courseDetail.minutes')}`}
                    </p>
                    <p className="text-xs text-ink-light">{t('courseDetail.timeLimitLabel')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-chocolate">{course.testConfig.maxRetries}</p>
                    <p className="text-xs text-ink-light">{t('courseDetail.attempts')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-chocolate">{course.testConfig.passingScore}%</p>
                    <p className="text-xs text-ink-light">{t('courseDetail.toPass')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">{t('courseDetail.reviews')}</h2>

              {/* Student review form */}
              {canReview && (
                <div className="mt-6 mb-6 bg-parchment rounded-xl p-6 border-2 border-gold/30 shadow-warm">
                  <div className="flex items-center gap-2 mb-5">
                    <Star className="w-5 h-5 text-gold fill-gold" />
                    <h3 className="font-display text-lg font-bold text-ink">{t('courseDetail.leaveReview')}</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map(key => (
                      <div key={key} className="flex items-center justify-between bg-cream-dark/40 rounded-lg px-4 py-3">
                        <span className="text-sm font-medium text-ink">{categoryLabels[key]}</span>
                        <StarRating
                          rating={reviewForm[key as keyof typeof reviewForm] as number}
                          size="md"
                          interactive
                          onChange={val => setReviewForm(prev => ({ ...prev, [key]: val }))}
                        />
                      </div>
                    ))}
                  </div>

                  <textarea
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    placeholder={t('courseDetail.reviewPlaceholder')}
                    rows={4}
                    disabled={submittingReview}
                    className="w-full px-4 py-3 rounded-lg border border-chocolate-100/30 bg-cream text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/50 resize-none disabled:opacity-50 transition-all"
                  />

                  <div className="flex items-center justify-between mt-4">
                    <p className="text-xs text-ink-light">
                      {allCategoriesRated
                        ? t('courseDetail.overallRating', { value: ((reviewForm.contenido + reviewForm.claridad + reviewForm.material + reviewForm.valorPrecio) / 4).toFixed(1) })
                        : t('courseDetail.rateAllCategories')}
                    </p>
                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview || !allCategoriesRated || !reviewForm.comment.trim()}
                      className="inline-flex items-center gap-2 btn-primary btn-sm rounded-lg disabled:opacity-50 transition-opacity"
                    >
                      {submittingReview ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {submittingReview ? t('courseDetail.sending') : t('courseDetail.submitReview')}
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4 mt-6">
                {reviews.length === 0 && !canReview && (
                  <p className="text-sm text-ink-light py-4">{t('courseDetail.noReviews')}</p>
                )}
                {reviews.map(review => (
                  <div key={review.id} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-chocolate-100 flex items-center justify-center text-sm font-bold text-chocolate">
                          {review.studentName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">{review.studentName}</p>
                          <p className="text-xs text-ink-light">{formatDate(review.date)}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>

                    <p className="text-sm text-ink-light leading-relaxed">{review.comment}</p>

                    {review.teacherReply && (
                      <div className="mt-3 ml-4 pl-4 border-l-2 border-gold/30">
                        <p className="text-xs font-semibold text-chocolate mb-1">{t('courseDetail.teacherReply')}</p>
                        <p className="text-sm text-ink-light">{review.teacherReply}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar TOC */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm">
                <h3 className="font-display text-lg font-bold text-ink mb-4">{t('courseDetail.toc')}</h3>
                <ol className="space-y-2">
                  {course.tableOfContents.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-ink-light">
                      <span className="w-5 h-5 rounded-full bg-chocolate-50 text-chocolate text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-6 text-center">
                <Link
                  to="/cursos"
                  className="inline-flex items-center gap-1 text-sm text-chocolate font-medium hover:text-chocolate-dark transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  {t('courseDetail.backToCatalog')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorrelativeCourses({ prerequisiteCourseIds }: { prerequisiteCourseIds: string[] }) {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });
  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsService.getEnrollments,
    enabled: isAuthenticated,
  });

  const prereqs = prerequisiteCourseIds
    .map(id => courses.find(c => c.id === id))
    .filter(Boolean) as typeof courses;

  if (prereqs.length === 0) return null;

  const enrollmentByCourse = new Map(enrollments.map(e => [e.courseId, e]));
  const isCompleted = (id: string): boolean => {
    const e = enrollmentByCourse.get(id);
    if (!e || (e.progress ?? 0) < 100) return false;
    const c = courses.find(x => x.id === id);
    if (c?.hasTest) return e.testPassed === true;
    return true;
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-bold text-ink mb-2 gold-underline">{t('courseDetail.correlatives')}</h2>
      <p className="text-sm text-ink-light mt-4 mb-4">
        {t('courseDetail.correlativesHint')}
      </p>
      <ul className="space-y-2">
        {prereqs.map(c => {
          const completed = isAuthenticated && isCompleted(c.id);
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
              {isAuthenticated && (
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  completed ? 'text-success bg-success/10' : 'text-ink-light bg-cream-dark'
                }`}>
                  {completed ? t('courseDetail.completed') : t('courseDetail.pendingLabel')}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
