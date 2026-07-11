import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock, Users, BookOpen } from 'lucide-react';
import type { Course } from '@/types';
import { formatPrice } from '@/utils/format';
import { itemPriceView } from '@/utils/pricing';
import { useLanguage } from '@/context/LanguageContext';
import StarRating from '@/components/ui/StarRating';
import CourseImage from '@/components/ui/CourseImage';

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const { t } = useTranslation();
  const { currency } = useLanguage();
  const pv = itemPriceView(currency, course);
  return (
    <Link
      to={`/cursos/${course.slug}`}
      className="group block bg-parchment rounded-xl overflow-hidden card-accent shadow-warm"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <CourseImage
          src={course.imageUrl}
          alt={course.title}
          className="transition-transform duration-500 group-hover:scale-105"
        />
        {course.discountLabel && (
          <span className="absolute top-3 right-3 bg-error text-cream text-xs font-bold px-2.5 py-1 rounded-full">
            {course.discountLabel}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-5">
        <span className="text-xs font-semibold text-gold uppercase tracking-wider">{course.category}</span>
        <h3 className="font-display text-lg font-bold text-ink mt-1.5 mb-2 group-hover:text-chocolate transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-ink-light line-clamp-2 mb-4">{course.summary}</p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-ink-light mb-4">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {course.duration}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {course.modules?.length ?? 0} {t('courseCard.modules')}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {course.studentCount}
          </span>
        </div>

        {/* Rating + Price */}
        <div className="flex items-center justify-between pt-3 border-t border-chocolate-100/30">
          <StarRating rating={course.rating} size="sm" showValue />
          <div className="text-right">
            {pv.compareAt != null ? (
              <>
                <span className="text-xs text-ink-light line-through">{formatPrice(pv.compareAt, pv.currency)}</span>
                <span className="block text-lg font-bold text-chocolate">{formatPrice(pv.amount, pv.currency)}</span>
              </>
            ) : (
              <span className="text-lg font-bold text-chocolate">{formatPrice(pv.amount, pv.currency)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
