import { useParams, Link } from 'react-router-dom';
import {
  Clock, Users, BookOpen, Award, ShieldCheck, Lock, Play,
  FileText, ChevronDown, ChevronUp, ArrowRight, CheckCircle2, Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { coursesService } from '@/services/courses';
import { enrollmentsService } from '@/services/enrollments';
import { paymentsService } from '@/services/payments';
import CourseImage from '@/components/ui/CourseImage';
import { reviewsService } from '@/services/reviews';
import { formatPrice } from '@/utils/format';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import StarRating from '@/components/ui/StarRating';

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user, role, isAuthenticated } = useAuth();
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
      toast.error('Iniciá sesión para inscribirte');
      return;
    }

    const effectivePrice = course!.discountPrice ?? course!.price;

    // Free course → direct enrollment
    if (effectivePrice === 0) {
      setEnrolling(true);
      try {
        await enrollmentsService.createEnrollment(course!.id);
        queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        toast.success('¡Inscripción exitosa! Ya podés acceder al curso.');
      } catch (err: unknown) {
        const error = err as { status?: number };
        if (error.status === 409) {
          queryClient.invalidateQueries({ queryKey: ['enrollments'] });
          toast.success('Ya estás inscrito en este curso.');
        } else {
          toast.error('Error al procesar la inscripción');
        }
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // Paid course → Mercado Pago
    setEnrolling(true);
    try {
      const { initPoint } = await paymentsService.createPreference({ courseId: course!.id });
      window.location.href = initPoint;
    } catch {
      toast.error('Error al iniciar el pago. Intentá de nuevo.');
      setEnrolling(false);
    }
  };

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', course?.id],
    queryFn: () => reviewsService.getCourseReviews(course!.id),
    enabled: !!course?.id,
  });

  const [expandedModule, setExpandedModule] = useState<string | null>(null);

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
        <h1 className="font-display text-2xl text-ink">Curso no encontrado</h1>
        <Link to="/cursos" className="text-chocolate mt-4 inline-block">Volver al catálogo</Link>
      </div>
    );
  }

  // Set initial expanded module after data loads
  if (expandedModule === null && (course.modules?.length ?? 0) > 0) {
    // Use a ref-like approach or just let it be null on first render
  }

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
              <p className="text-ink-light leading-relaxed mb-6">{course.summary}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-light mb-6">
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{course.duration}</span>
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{course.modules?.length ?? 0} módulos</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />{course.studentCount} estudiantes</span>
                {course.hasCertificate && <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gold" />Con certificado</span>}
              </div>

              <div className="flex items-center gap-3">
                <StarRating rating={course.rating} showValue />
                <span className="text-sm text-ink-light">({course.reviewCount} opiniones)</span>
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
                {course.discountPrice ? (
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl font-bold text-chocolate">{formatPrice(course.discountPrice)}</span>
                    <span className="text-lg text-ink-light line-through">{formatPrice(course.price)}</span>
                    <span className="text-xs font-bold text-error bg-error-light px-2 py-0.5 rounded-full">{course.discountLabel}</span>
                  </div>
                ) : (
                  <span className="font-display text-3xl font-bold text-chocolate">{formatPrice(course.price)}</span>
                )}
              </div>

              {role === 'student' && isEnrolled ? (
                <Link
                  to={`/aprender/${course.id}`}
                  className="block text-center btn-primary btn-lg btn-full rounded-xl"
                >
                  Ir al curso
                </Link>
              ) : role === 'teacher' && course.teacherId === user?.id ? (
                <Link
                  to={`/admin/cursos`}
                  className="block text-center btn-secondary btn-lg btn-full rounded-xl"
                >
                  Editar curso
                </Link>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary btn-lg btn-full rounded-xl disabled:opacity-60"
                >
                  {enrolling ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Inscribirme ahora'}
                </button>
              )}

              {course.moneyBackGuarantee && (
                <div className="mt-4 flex items-start gap-2 text-xs text-ink-light">
                  <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <span>{course.moneyBackGuarantee}</span>
                </div>
              )}

              <p className="text-xs text-ink-light mt-3 text-center">
                {course.availability}
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
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">Descripción</h2>
              <div
                className="prose prose-sm max-w-none text-ink-light leading-relaxed mt-6"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </div>

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">Requisitos previos</h2>
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
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">Contenido del curso</h2>
              <p className="text-sm text-ink-light mb-6 mt-6">
                {course.modules?.length ?? 0} módulos · {course.duration} de contenido
              </p>
              <div className="space-y-3">
                {course.modules.map(mod => {
                  const isOpen = expandedModule === mod.id;
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
                              {mod.materials.length} material{mod.materials.length !== 1 ? 'es' : ''}
                              {mod.isFree && <span className="text-success font-semibold ml-2">Gratis</span>}
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
                <h3 className="font-display text-lg font-bold text-ink mb-3">Examen de certificación</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-chocolate">{course.testConfig.totalQuestions}</p>
                    <p className="text-xs text-ink-light">Preguntas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-chocolate">{course.testConfig.timeLimit} min</p>
                    <p className="text-xs text-ink-light">Tiempo límite</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-chocolate">{course.testConfig.maxRetries}</p>
                    <p className="text-xs text-ink-light">Intentos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-chocolate">{course.testConfig.passingScore}%</p>
                    <p className="text-xs text-ink-light">Para aprobar</p>
                  </div>
                </div>
              </div>
            )}

            {/* Reviews */}
            <div>
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">Opiniones</h2>
              <div className="space-y-4 mt-6">
                {reviews.map(review => (
                  <div key={review.id} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-chocolate-100 flex items-center justify-center text-sm font-bold text-chocolate">
                          {review.studentName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink">{review.studentName}</p>
                          <p className="text-xs text-ink-light">{new Date(review.date).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                    </div>

                    {/* Category ratings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                      {Object.entries(review.categories).map(([key, val]) => (
                        <div key={key} className="flex items-center justify-between text-xs bg-cream-dark/50 rounded-lg px-2.5 py-1.5">
                          <span className="text-ink-light capitalize">{key === 'valorPrecio' ? 'Valor/Precio' : key}</span>
                          <span className="font-semibold text-ink">{val}/5</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-ink-light leading-relaxed">{review.comment}</p>

                    {review.teacherReply && (
                      <div className="mt-3 ml-4 pl-4 border-l-2 border-gold/30">
                        <p className="text-xs font-semibold text-chocolate mb-1">Respuesta de la Dra. Vidal</p>
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
                <h3 className="font-display text-lg font-bold text-ink mb-4">Contenidos</h3>
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
                  Volver al catálogo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
