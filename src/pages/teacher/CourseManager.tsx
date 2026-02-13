import { Link } from 'react-router-dom';
import {
  Plus, Edit3, Eye, Users, Star, MoreVertical,
  BookOpen, Trash2,
} from 'lucide-react';
import { courses, courseStats, formatPrice } from '@/data/mock';

export default function CourseManager() {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Mis Cursos</h1>
          <p className="text-ink-light mt-1">Gestioná y editá tus cursos publicados.</p>
        </div>
        <button className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
          <Plus className="w-4 h-4" />
          Nuevo Curso
        </button>
      </div>

      <div className="space-y-4">
        {courses.map(course => {
          const stat = courseStats.find(s => s.courseId === course.id);
          return (
            <div
              key={course.id}
              className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden card-accent"
            >
              <div className="flex flex-col md:flex-row gap-4 p-5">
                {/* Image */}
                <div className="w-full md:w-48 aspect-video md:aspect-[4/3] rounded-lg overflow-hidden shrink-0">
                  <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gold uppercase tracking-wider">{course.category}</span>
                        {course.discountPrice && (
                          <span className="text-[10px] font-bold text-error bg-error-light px-2 py-0.5 rounded-full">
                            {course.discountLabel}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-bold text-ink">{course.title}</h3>
                    </div>
                    <button className="p-2 rounded-lg text-ink-light hover:bg-cream-dark transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-ink-light mt-1 line-clamp-1">{course.summary}</p>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-ink-light">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.modules.length} módulos
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course.studentCount} estudiantes
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                      {course.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {stat?.views.toLocaleString() ?? '—'} vistas
                    </span>
                    <span className="font-semibold text-chocolate">
                      {formatPrice(course.discountPrice ?? course.price)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <button className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                      <Edit3 className="w-3 h-3" />
                      Editar
                    </button>
                    <Link
                      to={`/cursos/${course.slug}`}
                      className="inline-flex items-center gap-1.5 btn-secondary btn-sm rounded-lg"
                    >
                      <Eye className="w-3 h-3" />
                      Vista previa
                    </Link>
                    <button className="inline-flex items-center gap-1.5 btn-danger btn-sm rounded-lg">
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
