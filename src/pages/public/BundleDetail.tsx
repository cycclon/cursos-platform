import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Award, ArrowRight, Package, CheckCircle2, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { bundlesService } from '@/services/bundles';
import { coursesService } from '@/services/courses';
import { enrollmentsService } from '@/services/enrollments';
import { paymentsService } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/utils/format';
import CourseCard from '@/components/course/CourseCard';
import type { Bundle, Course } from '@/types';

function getBundleCourses(bundle: Bundle, courses: Course[]): Course[] {
  return bundle.courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];
}

export default function BundleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
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

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsService.getEnrollments,
    enabled: isAuthenticated,
  });

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Iniciá sesión para inscribirte.');
      navigate('/ingresar');
      return;
    }

    // If some courses are already enrolled and user hasn't confirmed yet, show confirmation
    if (someEnrolled && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    // Free bundle → direct enrollment
    if (bundle!.price === 0) {
      setEnrolling(true);
      try {
        const toEnroll = bundleCourses.filter(c => !enrolledCourseIds.has(c.id));
        await Promise.all(toEnroll.map(c =>
          enrollmentsService.createEnrollment(c.id).catch(() => {}),
        ));
        queryClient.invalidateQueries({ queryKey: ['enrollments'] });
        toast.success(`¡Inscripción exitosa! Se agregaron ${toEnroll.length} curso${toEnroll.length === 1 ? '' : 's'}.`);
        setShowConfirm(false);
      } catch {
        toast.error('Error al procesar la inscripción.');
      } finally {
        setEnrolling(false);
      }
      return;
    }

    // Paid bundle → Mercado Pago
    setEnrolling(true);
    try {
      const { initPoint } = await paymentsService.createPreference({ bundleId: bundle!.id });
      window.location.href = initPoint;
    } catch {
      toast.error('Error al iniciar el pago. Intentá de nuevo.');
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
        <h1 className="font-display text-2xl text-ink">Combo no encontrado</h1>
        <Link to="/combos" className="text-chocolate mt-4 inline-block">Volver a combos</Link>
      </div>
    );
  }

  const bundleCourses = getBundleCourses(bundle, courses);
  const totalModules = bundleCourses.reduce((sum, c) => sum + (c.modules?.length ?? 0), 0);
  const savings = bundle.originalPrice - bundle.price;

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
              <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Combo Especial</span>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-4 text-balance">
                {bundle.title}
              </h1>
              <p className="text-ink-light leading-relaxed mb-6">{bundle.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-light">
                <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{bundleCourses.length} cursos</span>
                <span className="flex items-center gap-1.5"><Package className="w-4 h-4" />{totalModules} módulos</span>
                <span className="flex items-center gap-1.5"><Award className="w-4 h-4 text-gold" />Con certificados</span>
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
              {bundle.discountLabel && (
                <span className="inline-block bg-success-light text-success text-xs font-bold px-2.5 py-1 rounded-full mb-4">
                  {bundle.discountLabel}
                </span>
              )}
              <div className="mb-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-bold text-chocolate">{formatPrice(bundle.price)}</span>
                  <span className="text-lg text-ink-light line-through">{formatPrice(bundle.originalPrice)}</span>
                </div>
                <p className="text-success font-semibold text-sm mt-1">Ahorrás {formatPrice(savings)}</p>
              </div>

              {allEnrolled ? (
                <div className="flex items-center gap-2 justify-center py-3 px-4 rounded-xl bg-success-light border border-success/20">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span className="text-sm font-semibold text-success">Ya estás inscripto/a en todos los cursos de este combo</span>
                </div>
              ) : showConfirm ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-gold/10 border border-gold/20">
                    <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <div className="text-xs text-ink-light">
                      <p className="font-semibold text-ink mb-1">
                        Ya estás inscripto/a en {enrolledInBundle.length === 1 ? '1 curso' : `${enrolledInBundle.length} cursos`} de este combo:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {enrolledInBundle.map(c => (
                          <li key={c.id}>{c.title}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-ink">
                        Se {notEnrolledCount === 1 ? 'agregará 1 curso nuevo' : `agregarán ${notEnrolledCount} cursos nuevos`} a tu panel.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="btn-primary btn-lg btn-full rounded-xl disabled:opacity-60"
                  >
                    {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar inscripción'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="btn-ghost btn-md btn-full rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  {someEnrolled && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-gold/10 border border-gold/20 mb-3">
                      <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                      <p className="text-xs text-ink-light">
                        Ya estás inscripto/a en {enrolledInBundle.length} de {bundleCourses.length} cursos de este combo.
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="btn-primary btn-lg btn-full rounded-xl disabled:opacity-60"
                  >
                    {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Inscribirme ahora'}
                  </button>
                </>
              )}

              <div className="mt-4 flex items-start gap-2 text-xs text-ink-light">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>Acceso a todos los cursos del combo una vez acreditado el pago.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Included Courses */}
        <div className="mb-12">
          <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">Cursos incluidos</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children mt-6">
            {bundleCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm max-w-3xl">
          <h3 className="font-display text-lg font-bold text-ink mb-4 gold-underline">Qué incluye este combo</h3>
          <ul className="space-y-3">
            {[
              `Acceso a ${bundleCourses.length} cursos completos`,
              'Material descargable de todos los cursos',
              `${totalModules} módulos de contenido`,
              'Certificados de finalización',
              `Ahorro de ${formatPrice(savings)} sobre el precio individual`,
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
            Volver a combos
          </Link>
        </div>
      </div>
    </div>
  );
}
