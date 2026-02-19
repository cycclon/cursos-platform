import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Clock, Award, ArrowRight, Play } from 'lucide-react';
import { enrollmentsService } from '@/services/enrollments';
import { certificatesService } from '@/services/certificates';
import { coursesService } from '@/services/courses';
import { useAuth } from '@/context/AuthContext';
import CourseImage from '@/components/ui/CourseImage';

export default function StudentDashboard() {
  const { user } = useAuth();

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

  const isLoading = loadingEnrollments || loadingCertificates || loadingCourses;

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: BookOpen, label: 'Cursos activos', value: enrollments.length, color: 'text-chocolate bg-chocolate-50' },
          { icon: Clock, label: 'En progreso', value: enrollments.filter(e => e.progress < 100).length, color: 'text-gold bg-gold/10' },
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
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

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
