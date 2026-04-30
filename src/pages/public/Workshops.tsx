import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Video, MapPin, Users, Clock } from 'lucide-react';
import { workshopsService } from '@/services/workshops';
import { formatPrice } from '@/utils/format';
import { workshopCapacityStatus } from '@/utils/capacity';
import { CapacityBadge } from '@/components/ui/CapacityBadge';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(d);
}

export default function Workshops() {
  const { data: workshops = [], isLoading } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => workshopsService.getWorkshops(),
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-hero-gradient diagonal-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span className="text-xs font-semibold text-gold uppercase tracking-[0.2em]">Talleres en Vivo</span>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-3">
            Nuestros Talleres
          </h1>
          <p className="text-ink-light max-w-xl">
            Encuentros sincrónicos online o presenciales para profundizar la práctica.
            Algunos requieren completar cursos previos para acceder.
          </p>
        </div>
      </section>

      {/* Grid */}
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
        ) : workshops.length === 0 ? (
          <div className="text-center py-16 bg-parchment rounded-xl border border-chocolate-100/20">
            <CalendarDays className="w-12 h-12 text-ink-light/30 mx-auto mb-4" />
            <p className="text-ink-light text-lg">Aún no hay talleres publicados.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
            {workshops.map(workshop => {
              const seatsLeft =
                workshop.capacity != null ? Math.max(workshop.capacity - workshop.registeredCount, 0) : null;
              const capacityStatus = workshopCapacityStatus(workshop);
              const isSoldOut = capacityStatus.kind === 'sold_out';
              const effectivePrice = workshop.discountPrice ?? workshop.price;
              return (
                <Link
                  key={workshop.id}
                  to={`/talleres/${workshop.slug}`}
                  className={`group block bg-parchment rounded-xl overflow-hidden card-accent shadow-warm ${
                    isSoldOut ? 'opacity-80' : ''
                  }`}
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-chocolate-50">
                    {workshop.imageUrl && (
                      <img
                        src={workshop.imageUrl}
                        alt={workshop.title}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          isSoldOut ? 'grayscale' : ''
                        }`}
                      />
                    )}
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-chocolate text-cream text-xs font-bold px-2.5 py-1 rounded-full uppercase">
                      {workshop.modality === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                      {workshop.modality}
                    </span>
                    {workshop.discountLabel && !isSoldOut && capacityStatus.kind !== 'low' && (
                      <span className="absolute top-3 left-3 bg-error text-cream text-xs font-bold px-2.5 py-1 rounded-full">
                        {workshop.discountLabel}
                      </span>
                    )}
                    <CapacityBadge
                      status={capacityStatus}
                      variant="overlay"
                      className="absolute top-3 left-3"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <span className="text-xs font-semibold text-gold uppercase tracking-wider">{workshop.category}</span>
                    <h3 className="font-display text-lg font-bold text-ink mt-1.5 mb-2 group-hover:text-chocolate transition-colors">
                      {workshop.title}
                    </h3>
                    <p className="text-sm text-ink-light line-clamp-2 mb-4">{workshop.summary}</p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-ink-light mb-4">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {formatDate(workshop.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {workshop.durationMinutes} min
                      </span>
                      {seatsLeft != null && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {seatsLeft > 0 ? `${seatsLeft} cupos` : 'Cupo agotado'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-chocolate-100/30">
                      <div>
                        {workshop.discountPrice && workshop.discountPrice < workshop.price && (
                          <span className="text-xs text-ink-light line-through">{formatPrice(workshop.price)}</span>
                        )}
                        <span className="block text-lg font-bold text-chocolate">{formatPrice(effectivePrice)}</span>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-medium text-ink-light group-hover:text-chocolate transition-colors">
                        Ver taller
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
