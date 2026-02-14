import { useParams, Link } from 'react-router-dom';
import { BookOpen, Award, ArrowRight, Package, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getBundleBySlug, getBundleCourses, formatPrice } from '@/data/mock';
import CourseCard from '@/components/course/CourseCard';

export default function BundleDetail() {
  const { slug } = useParams<{ slug: string }>();
  const bundle = getBundleBySlug(slug ?? '');

  if (!bundle) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Combo no encontrado</h1>
        <Link to="/combos" className="text-chocolate mt-4 inline-block">Volver a combos</Link>
      </div>
    );
  }

  const bundleCourses = getBundleCourses(bundle);
  const totalModules = bundleCourses.reduce((sum, c) => sum + c.modules.length, 0);
  const savings = bundle.originalPrice - bundle.price;

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
              <div className="relative aspect-video rounded-xl overflow-hidden mb-5">
                <img src={bundle.imageUrl} alt={bundle.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-ink/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-cream/90 flex items-center justify-center">
                    <Package className="w-5 h-5 text-chocolate" />
                  </div>
                </div>
              </div>
              <span className="inline-block bg-success-light text-success text-xs font-bold px-2.5 py-1 rounded-full mb-4">
                {bundle.discountLabel}
              </span>
              <div className="mb-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-display text-3xl font-bold text-chocolate">{formatPrice(bundle.price)}</span>
                  <span className="text-lg text-ink-light line-through">{formatPrice(bundle.originalPrice)}</span>
                </div>
                <p className="text-success font-semibold text-sm mt-1">Ahorrás {formatPrice(savings)}</p>
              </div>

              <button className="btn-primary btn-lg btn-full rounded-xl">
                Inscribirme ahora
              </button>

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
