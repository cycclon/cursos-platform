import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ArrowRight, Package } from 'lucide-react';
import { bundlesService } from '@/services/bundles';
import { coursesService } from '@/services/courses';
import { workshopsService } from '@/services/workshops';
import { formatPrice } from '@/utils/format';
import { bundleCapacityStatus } from '@/utils/capacity';
import { bundleAvailability } from '@/utils/bundleAvailability';
import { CapacityBadge } from '@/components/ui/CapacityBadge';
import { AvailabilityBadge } from '@/components/ui/AvailabilityBadge';
import type { Bundle, Course, Workshop } from '@/types';

function getBundleCourses(bundle: Bundle, courses: Course[]): Course[] {
  return bundle.courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean) as Course[];
}

function getBundleWorkshops(bundle: Bundle, workshops: Workshop[]): Workshop[] {
  return bundle.workshopIds.map(id => workshops.find(w => w.id === id)).filter(Boolean) as Workshop[];
}

export default function Bundles() {
  const { data: bundles = [], isLoading: loadingBundles } = useQuery({
    queryKey: ['bundles'],
    queryFn: bundlesService.getBundles,
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: workshops = [], isLoading: loadingWorkshops } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => workshopsService.getWorkshops(),
  });

  const isLoading = loadingBundles || loadingCourses || loadingWorkshops;

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Combos Especiales</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
            Nuestros Combos
          </h1>
          <p className="text-ink-light max-w-xl">
            Aprovechá nuestras combinaciones exclusivas de cursos. Aprendé más ahorrando con packs diseñados para profundizar tu conocimiento.
          </p>
        </div>
      </section>

      {/* Bundles Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-parchment rounded-xl overflow-hidden">
                <div className="aspect-[16/10] bg-chocolate-50 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-chocolate-50 rounded animate-pulse w-1/4" />
                  <div className="h-5 bg-chocolate-50 rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-chocolate-50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {bundles.map((bundle) => {
              const bundleCourses = getBundleCourses(bundle, courses);
              const bundleWorkshops = getBundleWorkshops(bundle, workshops);
              const totalModules = bundleCourses.reduce((sum, c) => sum + (c.modules?.length ?? 0), 0);
              const savings = bundle.originalPrice - bundle.price;
              const capacityStatus = bundleCapacityStatus(bundleWorkshops);
              const availability = bundleAvailability(bundleCourses, bundleWorkshops);
              const isUnavailable = availability.kind === 'unavailable';
              const isSoldOut = capacityStatus.kind === 'sold_out';
              const isDimmed = isSoldOut || isUnavailable;
              const showDiscount =
                !!bundle.discountLabel && !isUnavailable && !isSoldOut && capacityStatus.kind !== 'low';

              return (
                <Link
                  key={bundle.id}
                  to={`/combos/${bundle.slug}`}
                  className={`group block bg-parchment rounded-xl overflow-hidden card-accent shadow-warm ${
                    isDimmed ? 'opacity-80' : ''
                  }`}
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-chocolate-50">
                    {bundle.imageUrl && (
                      <img
                        src={bundle.imageUrl}
                        alt={bundle.title}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          isDimmed ? 'grayscale' : ''
                        }`}
                      />
                    )}
                    {/* Capacity (urgency) — top-left */}
                    <CapacityBadge
                      status={capacityStatus}
                      variant="overlay"
                      className="absolute top-3 left-3"
                    />
                    {/* Availability (status) — top-right; discount yields when unavailable */}
                    {isUnavailable ? (
                      <AvailabilityBadge
                        status={availability}
                        variant="overlay"
                        className="absolute top-3 right-3"
                      />
                    ) : showDiscount ? (
                      <span className="absolute top-3 right-3 bg-error text-cream text-xs font-bold px-2.5 py-1 rounded-full">
                        {bundle.discountLabel}
                      </span>
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <span className="text-xs font-semibold text-gold uppercase tracking-wider">Combo · {bundleCourses.length} cursos</span>
                    <h3 className="font-display text-lg font-bold text-ink mt-1.5 mb-2 group-hover:text-chocolate transition-colors">
                      {bundle.title}
                    </h3>
                    <p className="text-sm text-ink-light line-clamp-2 mb-4">{bundle.description}</p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-xs text-ink-light mb-4">
                      <span className="flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        {bundleCourses.length} cursos
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {totalModules} módulos
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-3 border-t border-chocolate-100/30">
                      <div>
                        <span className="text-xs text-ink-light line-through">{formatPrice(bundle.originalPrice)}</span>
                        <span className="block text-lg font-bold text-chocolate">{formatPrice(bundle.price)}</span>
                        <span className="text-xs text-success font-semibold">Ahorrás {formatPrice(savings)}</span>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-ink-light group-hover:text-chocolate transition-colors">
                        Ver combo
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
