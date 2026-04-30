import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/utils/format';
import { workshopCapacityStatus } from '@/utils/capacity';
import { CapacityBadge } from '@/components/ui/CapacityBadge';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'full', timeStyle: 'short' }).format(d);
}

export default function WorkshopDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);

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
      toast.error('Iniciá sesión para inscribirte.');
      navigate('/ingresar');
      return;
    }
    if (!workshop) return;

    setBusy(true);
    try {
      if (workshop.price === 0) {
        await workshopRegistrationsService.register(workshop.id);
        queryClient.invalidateQueries({ queryKey: ['workshop-registrations'] });
        toast.success('¡Inscripción confirmada!');
        return;
      }
      const { initPoint } = await paymentsService.createPreference({ workshopId: workshop.id });
      window.location.href = initPoint;
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.message === 'cupo_agotado') {
        toast.error('Lo sentimos, el cupo ya está agotado.');
      } else if (error.status === 503 && error.message === 'mercadopago_not_connected') {
        toast.error('La docente está actualizando su forma de cobro. Volvé a intentar en unos minutos.');
      } else if (error.message === 'already_registered') {
        toast.error('Ya estás inscripto/a en este taller.');
      } else {
        toast.error('Error al iniciar la inscripción. Intentá de nuevo.');
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
        <h1 className="font-display text-2xl text-ink">Taller no encontrado</h1>
        <Link to="/talleres" className="text-chocolate mt-4 inline-block">Volver a talleres</Link>
      </div>
    );
  }

  const effectivePrice = workshop.discountPrice ?? workshop.price;
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
                Taller {workshop.modality === 'online' ? 'Online' : 'Presencial'}
              </span>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mt-2 mb-4 text-balance">
                {workshop.title}
              </h1>
              <p className="text-ink-light leading-relaxed mb-6">{workshop.description}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-ink-light">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{formatDate(workshop.scheduledAt)}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{workshop.durationMinutes} min</span>
                {seatsLeft != null && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    {seatsLeft > 0 ? `${seatsLeft} cupos disponibles` : 'Cupo agotado'}
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
                  <span className="font-display text-3xl font-bold text-chocolate">{formatPrice(effectivePrice)}</span>
                  {workshop.discountPrice && workshop.discountPrice < workshop.price && (
                    <span className="text-lg text-ink-light line-through">{formatPrice(workshop.price)}</span>
                  )}
                </div>
              </div>

              {myRegistration ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center py-3 px-4 rounded-xl bg-success-light border border-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span className="text-sm font-semibold text-success">Ya estás inscripto/a</span>
                  </div>

                  {access ? (
                    access.eligible ? (
                      <div className="rounded-xl border border-chocolate-100/30 p-4 bg-cream/40">
                        <p className="text-xs font-semibold text-ink mb-2 flex items-center gap-1.5">
                          {workshop.modality === 'online' ? <Video className="w-4 h-4 text-chocolate" /> : <MapPin className="w-4 h-4 text-chocolate" />}
                          {workshop.modality === 'online' ? 'Enlace de la sala' : 'Dirección'}
                        </p>
                        {workshop.modality === 'online' && access.meetingUrl ? (
                          <a
                            href={access.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-chocolate hover:underline break-all"
                          >
                            Abrir sala
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
                          <p className="font-semibold text-ink mb-1">Acceso pendiente</p>
                          <p className="mb-2">
                            Para ingresar al taller, necesitás completar primero estos cursos:
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
                    disabled={busy || soldOut}
                    className="btn-primary btn-lg btn-full rounded-xl disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : soldOut ? 'Cupo agotado' : 'Inscribirme ahora'}
                  </button>
                  {prereqCourses.length > 0 && (
                    <p className="mt-3 text-xs text-ink-light">
                      Vas a poder inscribirte ahora. El acceso al taller se habilitará cuando completes los cursos correlativos.
                    </p>
                  )}
                </>
              )}

              <div className="mt-4 flex items-start gap-2 text-xs text-ink-light">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span>Tu inscripción se confirma automáticamente al acreditarse el pago.</span>
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
              <h2 className="font-display text-2xl font-bold text-ink mb-2 gold-underline">Cursos correlativos requeridos</h2>
              <p className="text-sm text-ink-light mb-4">
                Para acceder al taller en vivo, deberás completar estos cursos previamente.
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
                        {completed ? 'Completado' : 'Pendiente'}
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
              <h2 className="font-display text-2xl font-bold text-ink mb-4 gold-underline">Otros prerrequisitos</h2>
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
            <h3 className="font-display text-base font-bold text-ink mb-3">Detalles del encuentro</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <CalendarDays className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                <span className="text-ink-light">{formatDate(workshop.scheduledAt)}</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                <span className="text-ink-light">{workshop.durationMinutes} minutos</span>
              </li>
              <li className="flex items-start gap-2">
                {workshop.modality === 'online' ? (
                  <Video className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                ) : (
                  <MapPin className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                )}
                <span className="text-ink-light">
                  {workshop.modality === 'online' ? 'Encuentro online (sala virtual)' : 'Encuentro presencial'}
                </span>
              </li>
              {workshop.capacity != null && (
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 text-chocolate shrink-0 mt-0.5" />
                  <span className="text-ink-light">{workshop.capacity} lugares en total</span>
                </li>
              )}
            </ul>
          </div>

          <Link
            to="/talleres"
            className="inline-flex items-center gap-1 text-sm text-chocolate font-medium hover:text-chocolate-dark transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Volver a talleres
          </Link>
        </aside>
      </div>
    </div>
  );
}
