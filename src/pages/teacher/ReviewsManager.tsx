import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send } from 'lucide-react';
import { reviewsService } from '@/services/reviews';
import { useToast } from '@/context/ToastContext';
import StarRating from '@/components/ui/StarRating';
import type { Review } from '@/types';

const categoryLabels: Record<string, string> = {
  contenido: 'Contenido',
  claridad: 'Claridad',
  material: 'Material',
  valorPrecio: 'Valor/Precio',
};

export default function ReviewsManager() {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['teacher-reviews'],
    queryFn: reviewsService.getTeacherReviews,
  });

  const courseTitles = Array.from(new Set(reviews.map(r => r.courseTitle).filter(Boolean))).sort();
  const filteredReviews = courseFilter
    ? reviews.filter(r => r.courseTitle === courseFilter)
    : reviews;
  const unrepliedCount = reviews.filter(r => !r.teacherReply).length;
  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleReply = async () => {
    if (!replyingTo || !replyText.trim()) return;

    setSubmitting(true);
    try {
      await reviewsService.replyToReview(replyingTo, replyText);
      queryClient.invalidateQueries({ queryKey: ['teacher-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Respuesta enviada.');
      setReplyingTo(null);
      setReplyText('');
    } catch {
      toast.error('Error al enviar la respuesta.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 bg-parchment rounded animate-pulse w-52" />
          <div className="h-4 bg-parchment rounded animate-pulse w-80 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 h-20 animate-pulse" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 h-44 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Opiniones</h1>
        <p className="text-ink-light mt-1">Comentarios y valoraciones de tus estudiantes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
          <p className="text-xs text-ink-light mb-1">Total de opiniones</p>
          <p className="text-2xl font-bold text-ink">{reviews.length}</p>
        </div>
        <div className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
          <p className="text-xs text-ink-light mb-1">Valoración promedio</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-ink">{averageRating.toFixed(1)}</p>
            <StarRating rating={averageRating} size="sm" />
          </div>
        </div>
        <div className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
          <p className="text-xs text-ink-light mb-1">Sin responder</p>
          <p className={`text-2xl font-bold ${unrepliedCount > 0 ? 'text-gold' : 'text-success'}`}>
            {unrepliedCount}
          </p>
        </div>
      </div>

      {/* Filter */}
      {courseTitles.length > 1 && (
        <div className="mb-6">
          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 rounded-lg border border-chocolate-100/30 bg-parchment text-sm text-ink focus:outline-none focus:ring-2 focus:ring-chocolate/20"
          >
            <option value="">Todos los cursos</option>
            {courseTitles.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Content */}
      {filteredReviews.length === 0 ? (
        <div className="bg-parchment rounded-xl p-12 border border-chocolate-100/20 text-center">
          <MessageSquare className="w-12 h-12 text-chocolate-100 mx-auto mb-4" />
          <p className="text-ink-light">Aún no hay opiniones de tus alumnos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review: Review) => (
            <div
              key={review.id}
              className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm"
            >
              {/* Student info + course badge */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-chocolate-100 flex items-center justify-center text-sm font-bold text-chocolate shrink-0">
                    {review.studentName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{review.studentName}</p>
                    <p className="text-xs text-ink-light">
                      {new Date(review.date).toLocaleDateString('es-AR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {review.courseTitle && (
                  <span className="text-[10px] font-semibold text-chocolate bg-chocolate-50 px-2.5 py-1 rounded-full shrink-0">
                    {review.courseTitle}
                  </span>
                )}
              </div>

              {/* Rating + categories */}
              <div className="flex items-center gap-4 mb-3">
                <StarRating rating={review.rating} size="sm" showValue />
                <div className="flex flex-wrap gap-2">
                  {Object.entries(review.categories).map(([key, val]) => (
                    <span key={key} className="text-xs bg-cream-dark/50 rounded-lg px-2.5 py-1 text-ink-light">
                      {categoryLabels[key] || key}: <span className="font-semibold text-ink">{val}/5</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <p className="text-sm text-ink-light leading-relaxed mb-4">{review.comment}</p>

              {/* Teacher reply or reply form */}
              {review.teacherReply ? (
                <div className="ml-4 pl-4 border-l-2 border-gold/30">
                  <p className="text-xs font-semibold text-chocolate mb-1">Tu respuesta</p>
                  <p className="text-sm text-ink-light">{review.teacherReply}</p>
                </div>
              ) : replyingTo === review.id ? (
                <div className="mt-2 ml-4 pl-4 border-l-2 border-chocolate/20">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Escribí tu respuesta..."
                    rows={3}
                    disabled={submitting}
                    className="w-full px-3 py-2 rounded-lg border border-chocolate-100/30 bg-cream text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-chocolate/20 resize-none disabled:opacity-50"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={handleReply}
                      disabled={submitting || !replyText.trim()}
                      className="inline-flex items-center gap-1.5 btn-primary btn-sm rounded-lg disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submitting ? 'Enviando...' : 'Enviar'}
                    </button>
                    <button
                      onClick={() => { setReplyingTo(null); setReplyText(''); }}
                      disabled={submitting}
                      className="btn-ghost btn-sm rounded-lg"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setReplyingTo(review.id)}
                  className="text-xs text-chocolate font-medium hover:text-chocolate-dark transition-colors"
                >
                  Responder
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
