import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, GraduationCap, Award, Activity,
  ChevronRight, ChevronLeft, LayoutGrid, ListChecks, Search,
  CheckCircle2, ArrowUpRight, BadgeCheck,
} from 'lucide-react';
import { progressService } from '@/services/progress';
import { useAuth } from '@/context/AuthContext';
import { ProgressBar, ProgressRing, StatCard, Avatar, EmptyState } from '@/components/progress/visuals';
import { toneFor } from '@/components/progress/tone';
import type { CourseProgressRow } from '@/types';

/* ── Skeletons ───────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div>
      <div className="h-8 w-52 bg-parchment rounded animate-pulse" />
      <div className="h-4 w-72 bg-parchment rounded animate-pulse mt-2" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 bg-parchment rounded-xl border border-chocolate-100/20 animate-pulse" />
        ))}
      </div>
      <div className="h-72 bg-parchment rounded-xl border border-chocolate-100/20 animate-pulse mt-8" />
    </div>
  );
}

/* ── Course → modules / students drill ───────────────────────────── */

function CourseDrill({ course, onBack }: { course: CourseProgressRow; onBack: () => void }) {
  const { role } = useAuth();
  const studentBase = role === 'superuser' ? '/superusuario' : '/admin';
  const [tab, setTab] = useState<'modules' | 'students'>('modules');
  const [q, setQ] = useState('');

  const { data: modulesData, isLoading: loadingModules } = useQuery({
    queryKey: ['progress', 'course-modules', course.courseId],
    queryFn: () => progressService.getCourseModules(course.courseId),
    enabled: tab === 'modules',
  });

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['progress', 'course-students', course.courseId],
    queryFn: () => progressService.getCourseStudents(course.courseId),
    enabled: tab === 'students',
  });

  const students = (studentsData?.students ?? []).filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="animate-fade-in-up">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-5">
        <button onClick={onBack} className="text-chocolate hover:text-chocolate-dark font-medium transition-colors">
          Progreso
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-ink-light/60" />
        <span className="text-ink font-semibold truncate max-w-[55vw]">{course.title}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-xs text-ink-light hover:text-chocolate mb-2 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Volver a todos los cursos
          </button>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">{course.title}</h1>
          <p className="text-ink-light mt-1 text-sm">
            {course.enrolledCount} {course.enrolledCount === 1 ? 'estudiante inscripto' : 'estudiantes inscriptos'} ·{' '}
            {course.completedCount} {course.completedCount === 1 ? 'completó' : 'completaron'} el curso
          </p>
        </div>
        <div className="flex items-center gap-3 bg-parchment border border-chocolate-100/20 rounded-xl px-4 py-3 shadow-warm">
          <ProgressRing value={course.averageProgress} size={86} />
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 rounded-lg bg-chocolate-50 border border-chocolate-100/30 mb-6">
        {([
          { key: 'modules', label: 'Por módulo', icon: LayoutGrid },
          { key: 'students', label: 'Por estudiante', icon: ListChecks },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === key ? 'bg-parchment text-chocolate shadow-warm' : 'text-ink-light hover:text-chocolate'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Modules */}
      {tab === 'modules' && (
        loadingModules ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-20 bg-parchment rounded-xl border border-chocolate-100/20 animate-pulse" />
            ))}
          </div>
        ) : !modulesData || modulesData.modules.length === 0 ? (
          <EmptyState text="Este curso todavía no tiene módulos cargados." />
        ) : (
          <div className="space-y-3 stagger-children">
            {modulesData.modules.map((m) => (
              <div key={m.moduleId} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-chocolate-50 text-chocolate font-display font-bold flex items-center justify-center shrink-0">
                    {m.number}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-ink truncate">{m.title}</h3>
                    <p className="text-xs text-ink-light mt-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      {m.completedCount} de {m.enrolledCount} completaron
                    </p>
                  </div>
                  <span className={`font-display text-lg font-bold tabular-nums ${toneFor(m.averageProgress).text}`}>
                    {m.averageProgress}%
                  </span>
                </div>
                <ProgressBar value={m.averageProgress} className="mt-3" />
              </div>
            ))}
          </div>
        )
      )}

      {/* Students */}
      {tab === 'students' && (
        loadingStudents ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 bg-parchment rounded-xl border border-chocolate-100/20 animate-pulse" />
            ))}
          </div>
        ) : !studentsData || studentsData.students.length === 0 ? (
          <EmptyState text="Todavía no hay estudiantes inscriptos en este curso." />
        ) : (
          <>
            <div className="relative mb-4 max-w-sm">
              <Search className="w-4 h-4 text-ink-light absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o email…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-parchment border border-chocolate-100/30 text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/40 transition-shadow"
              />
            </div>
            <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden divide-y divide-chocolate-100/20">
              {students.map((s) => (
                <Link
                  key={s.studentId}
                  to={`${studentBase}/estudiantes/${s.studentId}`}
                  className="flex items-center gap-4 p-4 hover:bg-chocolate-50/50 transition-colors group"
                >
                  <Avatar name={s.name} src={s.avatar} />
                  <div className="min-w-0 w-44 sm:w-56">
                    <p className="text-sm font-semibold text-ink truncate group-hover:text-chocolate transition-colors">{s.name}</p>
                    <p className="text-xs text-ink-light truncate">{s.email}</p>
                  </div>
                  <div className="flex-1 min-w-[80px] hidden sm:block">
                    <div className="flex justify-between text-[11px] text-ink-light mb-1">
                      <span>{s.completedModules}/{s.totalModules} módulos</span>
                      <span className={toneFor(s.progress).text}>{s.progress}%</span>
                    </div>
                    <ProgressBar value={s.progress} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.certificateId && (
                      <span title="Certificado emitido" className="text-success"><BadgeCheck className="w-4 h-4" /></span>
                    )}
                    {s.testPassed === true && (
                      <span className="hidden md:inline text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-light text-success">
                        Examen ✓
                      </span>
                    )}
                    <span className="sm:hidden font-display text-sm font-bold text-chocolate tabular-nums">{s.progress}%</span>
                    <ArrowUpRight className="w-4 h-4 text-ink-light/50 group-hover:text-chocolate transition-colors" />
                  </div>
                </Link>
              ))}
              {students.length === 0 && (
                <p className="p-6 text-sm text-ink-light text-center">Sin resultados para «{q}».</p>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────── */

export default function ProgressTracking() {
  const [selected, setSelected] = useState<CourseProgressRow | null>(null);

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['progress', 'overview'],
    queryFn: progressService.getOverview,
  });

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['progress', 'courses'],
    queryFn: progressService.getCourses,
  });

  if (loadingOverview || loadingCourses) return <Skeleton />;

  if (selected) {
    return <CourseDrill course={selected} onBack={() => setSelected(null)} />;
  }

  const ranked = [...courses].sort((a, b) => b.averageProgress - a.averageProgress);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Progreso de estudiantes</h1>
        <p className="text-ink-light mt-1">
          Seguí el avance global y profundizá curso por curso, módulo a módulo, hasta cada estudiante.
        </p>
      </div>

      {/* Headline: ring + KPIs */}
      <div className="grid lg:grid-cols-[auto_1fr] gap-6 mb-10">
        <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm flex items-center justify-center">
          <ProgressRing value={overview?.averageProgress ?? 0} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={GraduationCap} label="Estudiantes activos" value={String(overview?.totalStudents ?? 0)} accent="text-chocolate bg-chocolate-50" />
          <StatCard icon={BookOpen} label="Cursos" value={String(overview?.totalCourses ?? 0)} accent="text-gold-dark bg-gold/10" />
          <StatCard icon={Users} label="Inscripciones" value={String(overview?.totalEnrollments ?? 0)} accent="text-chocolate bg-chocolate-50" />
          <StatCard icon={Award} label="Cursos completados" value={String(overview?.completedEnrollments ?? 0)} accent="text-success bg-success-light" />
          <StatCard icon={Activity} label="Tasa de finalización" value={`${overview?.completionRate ?? 0}%`} accent="text-gold-dark bg-gold/10" />
        </div>
      </div>

      {/* Courses breakdown */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-display text-lg font-bold text-ink">Promedio por curso</h2>
        <span className="text-xs text-ink-light">— tocá un curso para ver módulos y estudiantes</span>
      </div>

      {ranked.length === 0 ? (
        <EmptyState text="Todavía no hay cursos con estudiantes inscriptos." />
      ) : (
        <div className="space-y-3 stagger-children">
          {ranked.map((c) => (
            <button
              key={c.courseId}
              onClick={() => setSelected(c)}
              className="w-full text-left bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm hover:shadow-warm-lg hover:border-chocolate-light/40 transition-all group"
            >
              <div className="flex items-center gap-4">
                {c.imageUrl ? (
                  <img src={c.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-chocolate-100/30" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-chocolate-50 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-chocolate" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-ink truncate group-hover:text-chocolate transition-colors">{c.title}</h3>
                  <p className="text-xs text-ink-light mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.enrolledCount}</span>
                    <span className="inline-flex items-center gap-1"><LayoutGrid className="w-3.5 h-3.5" />{c.moduleCount} módulos</span>
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-success" />{c.completedCount} completaron</span>
                  </p>
                </div>
                <div className="text-right shrink-0 w-16">
                  <span className={`font-display text-xl font-bold tabular-nums ${toneFor(c.averageProgress).text}`}>
                    {c.averageProgress}%
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-ink-light/40 group-hover:text-chocolate group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
              <ProgressBar value={c.averageProgress} className="mt-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
