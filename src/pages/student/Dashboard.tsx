import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Clock, Award, ArrowRight, Play, MessageSquare,
  CalendarDays, Video, MapPin, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { enrollmentsService } from '@/services/enrollments';
import { certificatesService } from '@/services/certificates';
import { coursesService } from '@/services/courses';
import { reviewsService } from '@/services/reviews';
import { workshopsService } from '@/services/workshops';
import { workshopRegistrationsService } from '@/services/workshopRegistrations';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import CourseImage from '@/components/ui/CourseImage';
import type { Workshop } from '@/types';

export default function StudentDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsService.getEnrollments,
  });

  const { data: certificates = [], isLoading: loadingCertificates } = useQuery({
    queryKey: ['certificates'],
    queryFn: certificatesService.getCertificates,
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: reviewedCourseIds = [] } = useQuery({
    queryKey: ['my-reviewed-courses'],
    queryFn: reviewsService.getMyReviewedCourses,
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['workshop-registrations'],
    queryFn: workshopRegistrationsService.getMyRegistrations,
  });

  const { data: allWorkshops = [] } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => workshopsService.getWorkshops(),
  });

  const isLoading = loadingEnrollments || loadingCertificates || loadingCourses;

  const now = new Date();
  type RegWithWorkshop = (typeof registrations)[number] & { workshop: Workshop | null };
  const regsWithWorkshop: RegWithWorkshop[] = registrations.map(r => {
    const workshop = typeof r.workshopId === 'string'
      ? allWorkshops.find(w => w.id === r.workshopId) ?? null
      : (r.workshopId as Workshop) ?? null;
    return { ...r, workshop };
  });
  const upcomingWorkshops = regsWithWorkshop.filter(r =>
    r.workshop && r.attendanceStatus === 'registered' && new Date(r.workshop.scheduledAt) >= now,
  );
  const pastWorkshops = regsWithWorkshop.filter(r =>
    r.workshop && (r.attendanceStatus !== 'registered' || new Date(r.workshop.scheduledAt) < now),
  );

  const handleCancelWorkshop = async (registrationId: string) => {
    if (!window.confirm('¿Cancelar tu inscripción a este taller?')) return;
    try {
      await workshopRegistrationsService.cancel(registrationId);
      queryClient.invalidateQueries({ queryKey: ['workshop-registrations'] });
      toast.success('Inscripción cancelada.');
    } catch {
      toast.error('No se pudo cancelar la inscripción.');
    }
  };

  const getCourse = (id: string) => courses.find(c => c.id === id);

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 bg-parchment rounded animate-pulse w-64" />
          <div className="h-4 bg-parchment rounded animate-pulse w-80 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 h-20 animate-pulse" />
          ))}
        </div>
        <div className="h-6 bg-parchment rounded animate-pulse w-32 mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 h-36 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
          Hola, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-ink-light mt-1">Acá podés ver tus cursos, progreso y certificados.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { icon: BookOpen, label: 'Cursos activos', value: enrollments.length, color: 'text-chocolate bg-chocolate-50' },
          { icon: Clock, label: 'En progreso', value: enrollments.filter(e => e.progress < 100).length, color: 'text-gold bg-gold/10' },
          { icon: CalendarDays, label: 'Talleres próximos', value: upcomingWorkshops.length, color: 'text-chocolate bg-chocolate-50' },
          { icon: Award, label: 'Certificados', value: certificates.length, color: 'text-success bg-success-light' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{stat.value}</p>
                <p className="text-xs text-ink-light">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enrolled courses */}
      <h2 className="font-display text-xl font-bold text-ink mb-4 gold-underline">Mis Cursos</h2>
      <div className="mt-6 space-y-4">
        {enrollments.map(enrollment => {
          const course = getCourse(enrollment.courseId);
          if (!course) return null;
          return (
            <div
              key={enrollment.id}
              className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm card-accent"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-40 aspect-video rounded-lg overflow-hidden shrink-0">
                  <CourseImage src={course.imageUrl} alt={course.title} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-gold uppercase tracking-wider">{course.category}</span>
                      <h3 className="font-display text-lg font-bold text-ink mt-0.5">{course.title}</h3>
                    </div>
                    {enrollment.progress === 100 && (
                      <span className="shrink-0 text-xs font-bold text-success bg-success-light px-2.5 py-1 rounded-full">
                        Completado
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-ink-light mb-1.5">
                      <span>Progreso</span>
                      <span className="font-semibold">{enrollment.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-chocolate-100/30">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${enrollment.progress}%`,
                          background: enrollment.progress === 100
                            ? 'var(--color-success)'
                            : 'linear-gradient(90deg, var(--color-chocolate), var(--color-gold))',
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <Link
                      to={`/aprender/${course.id}`}
                      className="inline-flex items-center gap-1.5 btn-primary btn-sm rounded-lg"
                    >
                      <Play className="w-3.5 h-3.5" />
                      {enrollment.progress === 100 ? 'Repasar' : 'Continuar'}
                    </Link>
                    {enrollment.testPassed && enrollment.certificateId && (
                      <Link
                        to={`/certificado/${enrollment.certificateId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-gold font-medium hover:text-chocolate transition-colors"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Ver certificado
                      </Link>
                    )}
                    {enrollment.progress === 100 && course.hasTest && !enrollment.testPassed && (
                      <Link
                        to={`/examen/${course.id}`}
                        className="inline-flex items-center gap-1.5 text-sm text-chocolate font-medium hover:text-chocolate-dark transition-colors"
                      >
                        Rendir examen
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    {enrollment.progress === 100 && !reviewedCourseIds.includes(course.id) && (
                      <Link
                        to={`/cursos/${course.slug}#opiniones`}
                        className="inline-flex items-center gap-1.5 text-sm text-gold font-medium hover:text-chocolate transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Dejar opinión
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Workshops */}
      {(upcomingWorkshops.length > 0 || pastWorkshops.length > 0) && (
        <>
          <h2 className="font-display text-xl font-bold text-ink mb-4 gold-underline mt-10">Mis Talleres</h2>
          {upcomingWorkshops.length > 0 && (
            <div className="space-y-4 mt-6">
              {upcomingWorkshops.map(reg => reg.workshop && (
                <UpcomingWorkshopCard
                  key={reg.id}
                  registrationId={reg.id}
                  workshop={reg.workshop}
                  onCancel={() => handleCancelWorkshop(reg.id)}
                />
              ))}
            </div>
          )}
          {pastWorkshops.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-ink-light mb-3">Anteriores</h3>
              <div className="space-y-3">
                {pastWorkshops.map(reg => reg.workshop && (
                  <div
                    key={reg.id}
                    className="bg-parchment rounded-xl p-4 border border-chocolate-100/20 flex items-center gap-4"
                  >
                    <CalendarDays className="w-5 h-5 text-ink-light/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{reg.workshop.title}</p>
                      <p className="text-xs text-ink-light">
                        {new Date(reg.workshop.scheduledAt).toLocaleDateString('es-AR', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      reg.attendanceStatus === 'attended'
                        ? 'text-success bg-success/10'
                        : reg.attendanceStatus === 'cancelled'
                          ? 'text-error bg-error-light'
                          : 'text-ink-light bg-cream-dark'
                    }`}>
                      {reg.attendanceStatus}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Certificates */}
      {certificates.length > 0 && (
        <>
          <h2 className="font-display text-xl font-bold text-ink mb-4 gold-underline mt-10">Certificados</h2>
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {certificates.map(cert => (
              <Link
                key={cert.id}
                to={`/certificado/${cert.id}`}
                className="bg-parchment rounded-xl p-5 border border-gold/20 shadow-warm hover:shadow-warm-lg transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-ink group-hover:text-chocolate transition-colors">{cert.courseTitle}</h3>
                    <p className="text-xs text-ink-light mt-0.5">
                      Emitido el {new Date(cert.issuedAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      {cert.score && ` · Nota: ${cert.score}%`}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Browse more courses */}
      <div className="mt-12 bg-chocolate-50 rounded-xl p-6 border border-chocolate-100/30 text-center">
        <p className="font-display text-lg font-semibold text-ink mb-2">¿Querés seguir aprendiendo?</p>
        <p className="text-sm text-ink-light mb-4">Explorá nuestro catálogo completo de cursos.</p>
        <Link
          to="/cursos"
          className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
        >
          Ver catálogo
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function UpcomingWorkshopCard({
  registrationId,
  workshop,
  onCancel,
}: {
  registrationId: string;
  workshop: Workshop;
  onCancel: () => void;
}) {
  const { data: access } = useQuery({
    queryKey: ['workshop-access', workshop.id],
    queryFn: () => workshopRegistrationsService.getAccess(workshop.id),
  });

  const scheduledDate = new Date(workshop.scheduledAt);
  const diffMs = scheduledDate.getTime() - Date.now();
  const endTime = scheduledDate.getTime() + workshop.durationMinutes * 60_000;
  let countdown = '';
  if (Date.now() >= scheduledDate.getTime() && Date.now() <= endTime) {
    countdown = 'En curso';
  } else if (diffMs > 0) {
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) countdown = 'Hoy';
    else if (days === 1) countdown = 'Mañana';
    else countdown = `En ${days} días`;
  }

  return (
    <div className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm card-accent">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-32 aspect-video md:aspect-square rounded-lg overflow-hidden bg-chocolate-50 shrink-0">
          {workshop.imageUrl && (
            <img src={workshop.imageUrl} alt={workshop.title} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-gold uppercase tracking-wider flex items-center gap-1">
              {workshop.modality === 'online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
              Taller {workshop.modality}
            </span>
            {countdown && (
              <span className="text-[10px] font-bold text-chocolate bg-chocolate-50 px-2 py-0.5 rounded-full uppercase">
                {countdown}
              </span>
            )}
          </div>
          <h3 className="font-display text-base font-bold text-ink">{workshop.title}</h3>
          <p className="text-xs text-ink-light mt-1 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(scheduledDate)}
          </p>

          {access?.eligible ? (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {workshop.modality === 'online' && access.meetingUrl ? (
                <a
                  href={access.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 btn-primary btn-sm rounded-lg"
                >
                  <Video className="w-3.5 h-3.5" />
                  Ir a la sala
                </a>
              ) : (
                <details className="text-xs">
                  <summary className="inline-flex items-center gap-1.5 btn-secondary btn-sm rounded-lg cursor-pointer list-none">
                    <MapPin className="w-3.5 h-3.5" />
                    Ver dirección
                  </summary>
                  <p className="mt-2 p-3 bg-cream/60 rounded-lg text-sm text-ink whitespace-pre-line">
                    {access.location}
                  </p>
                </details>
              )}
              <button
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg"
              >
                Cancelar inscripción
              </button>
              <span className="sr-only">{registrationId}</span>
            </div>
          ) : access ? (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-gold/10 border border-gold/20">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div className="text-xs text-ink-light flex-1 min-w-0">
                <p className="font-semibold text-ink mb-1">Necesitás completar antes:</p>
                <ul className="space-y-0.5">
                  {access.missing.map(m => (
                    <li key={m.id} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-ink-light/40" />
                      <Link to={`/aprender/${m.id}`} className="underline hover:text-chocolate">
                        {m.title}
                      </Link>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onCancel}
                  className="mt-3 underline text-ink-light hover:text-error"
                >
                  Cancelar inscripción
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
