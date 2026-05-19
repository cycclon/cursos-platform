import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronRight, ChevronLeft, ChevronDown, Mail, CalendarDays,
  BookOpen, Award, CheckCircle2, Circle, BadgeCheck, GraduationCap,
} from 'lucide-react';
import { progressService } from '@/services/progress';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/api';
import {
  ProgressBar, ProgressRing, StatCard, Avatar, EmptyState,
} from '@/components/progress/visuals';
import { toneFor } from '@/components/progress/tone';
import ReminderActions from '@/components/reminders/ReminderActions';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const ROLE_LABEL: Record<string, string> = {
  student: 'Estudiante',
  teacher: 'Docente',
  superuser: 'Administrador',
  visitor: 'Visitante',
};

export default function StudentDetail() {
  const { studentId = '' } = useParams();
  const { role } = useAuth();
  const base = role === 'superuser' ? '/superusuario' : '/admin';
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useQuery({
    queryKey: ['progress', 'student', studentId],
    queryFn: () => progressService.getStudent(studentId),
    retry: (count, err) => !(err instanceof ApiError && err.status === 404) && count < 2,
  });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (isLoading) {
    return (
      <div>
        <div className="h-4 w-40 bg-parchment rounded animate-pulse" />
        <div className="h-32 bg-parchment rounded-xl border border-chocolate-100/20 animate-pulse mt-6" />
        <div className="grid grid-cols-3 gap-4 mt-6">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-28 bg-parchment rounded-xl border border-chocolate-100/20 animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-parchment rounded-xl border border-chocolate-100/20 animate-pulse mt-6" />
      </div>
    );
  }

  if (error || !data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="animate-fade-in-up">
        <Link to={`${base}/progreso`} className="inline-flex items-center gap-1.5 text-sm text-chocolate hover:text-chocolate-dark mb-6">
          <ChevronLeft className="w-4 h-4" /> Volver al progreso
        </Link>
        <EmptyState text={notFound ? 'No encontramos a este estudiante.' : 'No pudimos cargar la información del estudiante.'} />
      </div>
    );
  }

  const { student, enrollments, summary } = data;

  return (
    <div className="animate-fade-in-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-5">
        <Link to={`${base}/progreso`} className="text-chocolate hover:text-chocolate-dark font-medium transition-colors">
          Progreso
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-ink-light/60" />
        <span className="text-ink font-semibold truncate max-w-[55vw]">{student.name}</span>
      </nav>

      {/* Profile header */}
      <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <Avatar name={student.name} src={student.avatar} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-2xl font-bold text-ink truncate">{student.name}</h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-chocolate-50 text-chocolate">
                {ROLE_LABEL[student.role] ?? student.role}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-ink-light">
              <a href={`mailto:${student.email}`} className="inline-flex items-center gap-1.5 hover:text-chocolate transition-colors">
                <Mail className="w-4 h-4" /> {student.email}
              </a>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" /> Miembro desde {formatDate(student.createdAt)}
              </span>
            </div>
          </div>
          <div className="sm:border-l sm:border-chocolate-100/30 sm:pl-6 flex justify-center">
            <ProgressRing value={summary.averageProgress} size={104} caption="Promedio" />
          </div>
        </div>

        <ReminderActions
          studentId={student.id}
          studentName={student.name}
          canUse={role === 'teacher'}
        />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Cursos inscriptos" value={String(summary.courseCount)} accent="text-chocolate bg-chocolate-50" />
        <StatCard icon={Award} label="Cursos completados" value={String(summary.completedCourses)} accent="text-success bg-success-light" />
        <StatCard icon={GraduationCap} label="Progreso promedio" value={`${summary.averageProgress}%`} accent="text-gold-dark bg-gold/10" />
      </div>

      <h2 className="font-display text-lg font-bold text-ink mb-4">Cursos y avance</h2>

      {enrollments.length === 0 ? (
        <EmptyState text="Este estudiante todavía no está inscripto en ningún curso." />
      ) : (
        <div className="space-y-3 stagger-children">
          {enrollments.map((e) => {
            const isOpen = expanded.has(e.courseId);
            return (
              <div key={e.courseId} className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden">
                <button
                  onClick={() => toggle(e.courseId)}
                  className="w-full text-left p-5 hover:bg-chocolate-50/40 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {e.courseImageUrl ? (
                      <img src={e.courseImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-chocolate-100/30" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-chocolate-50 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-chocolate" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-ink truncate">{e.courseTitle}</h3>
                      <p className="text-xs text-ink-light mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        <span>{e.completedModulesCount}/{e.totalModules} módulos</span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" /> Desde {formatDate(e.enrolledAt)}
                        </span>
                        {e.certificateId && (
                          <span className="inline-flex items-center gap-1 text-success">
                            <BadgeCheck className="w-3.5 h-3.5" /> Certificado
                          </span>
                        )}
                        {e.testPassed === true && (
                          <span className="text-success">Examen aprobado{typeof e.testScore === 'number' ? ` (${e.testScore}%)` : ''}</span>
                        )}
                        {e.testPassed === false && <span className="text-error">Examen no aprobado</span>}
                      </p>
                    </div>
                    <span className={`font-display text-xl font-bold tabular-nums shrink-0 ${toneFor(e.progress).text}`}>
                      {e.progress}%
                    </span>
                    <ChevronDown className={`w-5 h-5 text-ink-light/50 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <ProgressBar value={e.progress} className="mt-3" />
                </button>

                {isOpen && (
                  <div className="border-t border-chocolate-100/20 px-5 py-4 bg-cream/40">
                    {e.modules.length === 0 ? (
                      <p className="text-xs text-ink-light text-center py-2">Este curso no tiene módulos cargados.</p>
                    ) : (
                      <ul className="space-y-3">
                        {e.modules.map((m) => (
                          <li key={m.moduleId} className="flex items-center gap-3">
                            {m.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-ink-light/30 shrink-0" />
                            )}
                            <span className="w-6 text-xs font-display font-bold text-ink-light shrink-0">{m.number}</span>
                            <span className="text-sm text-ink truncate flex-1 min-w-0">{m.title}</span>
                            <div className="w-28 sm:w-40 shrink-0">
                              <ProgressBar value={m.progress} />
                            </div>
                            <span className={`text-xs font-semibold tabular-nums w-9 text-right shrink-0 ${toneFor(m.progress).text}`}>
                              {m.progress}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
