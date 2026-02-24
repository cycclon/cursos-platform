import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, Users, Award, Star, Package } from 'lucide-react';
import { coursesService } from '@/services/courses';
import { teacherService } from '@/services/teacher';
import { testimonialsService } from '@/services/testimonials';
import { bundlesService } from '@/services/bundles';
import { formatPrice } from '@/utils/format';
import CourseCard from '@/components/course/CourseCard';
import type { Bundle, Course } from '@/types';

function getBundleCourses(bundle: Bundle, courses: Course[]): Course[] {
  return bundle.courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];
}

export default function Landing() {
  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: teacher } = useQuery({
    queryKey: ['teacher'],
    queryFn: teacherService.getTeacher,
  });

  const { data: testimonials = [] } = useQuery({
    queryKey: ['testimonials'],
    queryFn: testimonialsService.getTestimonials,
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['bundles'],
    queryFn: bundlesService.getBundles,
  });

  const featured = courses.filter(c => c.featured);
  const totalStudents = teacher?.totalStudents ?? 0;
  const featuredBundles = bundles.filter(b => b.featured);

  const coursesWithReviews = courses.filter(c => c.reviewCount > 0);
  const avgRating = coursesWithReviews.length > 0
    ? coursesWithReviews.reduce((sum, c) => sum + c.rating * c.reviewCount, 0)
      / coursesWithReviews.reduce((sum, c) => sum + c.reviewCount, 0)
    : 0;
  const avgRatingDisplay = avgRating > 0 ? avgRating.toFixed(1) : '—';

  const statsBarItems = [
    { icon: BookOpen, value: `${courses.length}`, label: 'Cursos disponibles' },
    ...(teacher?.showStudentCount ? [{ icon: Users, value: `+${totalStudents}`, label: 'Estudiantes' }] : []),
    { icon: Award, value: '100%', label: 'Contenido original' },
    ...(avgRating > 0 ? [{ icon: Star, value: avgRatingDisplay, label: 'Valoración promedio' }] : []),
  ];

  return (
    <div>
      {/* ── Hero ──────────────────────────────────────── */}
      <section className="bg-hero-gradient diagonal-accent relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <span className="inline-block text-xs font-semibold text-gold uppercase tracking-[0.2em] mb-4">
                Formación Jurídica de Excelencia
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-ink leading-[1.1] text-balance mb-6">
                Dominá el Derecho con quien lo{' '}
                <span className="text-chocolate italic">ejerce y enseña</span>
              </h1>
              <p className="text-lg text-ink-light leading-relaxed max-w-lg mb-8">
                Cursos dictados por la Dra. Gisela Flamini, Jueza de Cámara y docente universitaria con más de 20 años de experiencia.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/cursos"
                  className="inline-flex items-center gap-2 btn-primary btn-lg rounded-xl"
                >
                  Ver Cursos
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/sobre-mi"
                  className="inline-flex items-center gap-2 btn-secondary btn-lg rounded-xl"
                >
                  Conocé a la Dra. Flamini
                </Link>
              </div>
            </div>
            {teacher && (
              <div className="hidden md:block relative">
                <div className="relative rounded-2xl overflow-hidden shadow-warm-lg">
                  <img
                    src={teacher.photoUrl}
                    alt={teacher.name}
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <p className="font-display text-xl font-bold text-cream">{teacher.name}</p>
                    <p className="text-sm text-cream-dark/80">{teacher.title}</p>
                  </div>
                </div>
                {/* Floating stat card — only when ratings exist */}
                {avgRating > 0 && (
                  <div className="absolute -left-8 bottom-20 bg-parchment rounded-xl shadow-warm-lg p-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                        <Star className="w-5 h-5 text-gold fill-gold" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-ink">{avgRatingDisplay}</p>
                        <p className="text-xs text-ink-light">Valoración promedio</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────── */}
      <section className="bg-chocolate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className={`grid grid-cols-2 ${statsBarItems.length === 4 ? 'md:grid-cols-4' : statsBarItems.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 text-center`}>
            {statsBarItems.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-cream">
                  <Icon className="w-6 h-6 mx-auto mb-2 text-gold-light" />
                  <p className="font-display text-2xl md:text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-cream-dark/70 mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ──────────────────────────── */}
      {featured.length > 0 && (
        <section className="bg-section-alt">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Formación destacada</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
                Cursos Destacados
              </h2>
              <p className="text-ink-light max-w-xl mx-auto">
                Selección de cursos diseñados para potenciar tu práctica profesional con conocimiento actualizado y aplicable.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
              {featured.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/cursos"
                className="inline-flex items-center gap-2 text-chocolate font-semibold hover:text-chocolate-dark transition-colors"
              >
                Ver todos los cursos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Combos ─────────────────────────────────────── */}
      {featuredBundles.length > 0 && (
        <section className="bg-warm-gradient">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Ahorrá combinando</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
                Combos Especiales
              </h2>
              <p className="text-ink-light max-w-xl mx-auto">
                Combiná cursos y accedé a descuentos exclusivos diseñados para potenciar tu formación profesional.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 stagger-children">
              {featuredBundles.map(bundle => {
                const bundleCourses = getBundleCourses(bundle, courses);
                const savings = bundle.originalPrice - bundle.price;
                return (
                  <Link
                    key={bundle.id}
                    to={`/combos/${bundle.slug}`}
                    className="group flex flex-col sm:flex-row bg-parchment rounded-xl overflow-hidden shadow-warm border border-chocolate-100/20 card-accent"
                  >
                    <div className="sm:w-48 shrink-0 aspect-[16/10] sm:aspect-auto overflow-hidden bg-chocolate-50">
                      {bundle.imageUrl && (
                        <img
                          src={bundle.imageUrl}
                          alt={bundle.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}
                    </div>
                    <div className="p-5 flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-gold" />
                          <span className="text-xs font-semibold text-gold uppercase tracking-wider">{bundleCourses.length} cursos</span>
                          <span className="bg-error text-cream text-xs font-bold px-2 py-0.5 rounded-full ml-auto">{bundle.discountLabel}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-ink group-hover:text-chocolate transition-colors mb-1">
                          {bundle.title}
                        </h3>
                        <p className="text-sm text-ink-light line-clamp-2">{bundle.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-chocolate-100/30">
                        <div>
                          <span className="text-xs text-ink-light line-through">{formatPrice(bundle.originalPrice)}</span>
                          <span className="block text-lg font-bold text-chocolate">{formatPrice(bundle.price)}</span>
                        </div>
                        <span className="text-xs text-success font-semibold">Ahorrás {formatPrice(savings)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <Link
                to="/combos"
                className="inline-flex items-center gap-2 text-chocolate font-semibold hover:text-chocolate-dark transition-colors"
              >
                Ver todos los combos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ──────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="diagonal-accent diagonal-accent-left">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
            <div className="text-center mb-12">
              <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Testimonios</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2">
                Lo que dicen nuestros alumnos
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6 stagger-children">
              {testimonials.map(t => (
                <div key={t.id} className="bg-parchment rounded-xl p-6 shadow-warm border border-chocolate-100/20">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                    ))}
                  </div>
                  <p className="font-display text-base italic text-ink leading-relaxed mb-4">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="pt-4 border-t border-chocolate-100/20">
                    <p className="text-sm font-semibold text-ink">{t.name}</p>
                    <p className="text-xs text-ink-light">{t.courseTitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="bg-chocolate">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-cream mb-4">
            Comenzá tu formación hoy
          </h2>
          <p className="text-cream-dark/70 mb-8 max-w-lg mx-auto">
            Invertí en tu carrera profesional con cursos dictados por una experta reconocida en el ámbito jurídico argentino.
          </p>
          <Link
            to="/cursos"
            className="inline-flex items-center gap-2 btn-primary-inverted btn-xl rounded-xl"
          >
            Explorar Cursos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
