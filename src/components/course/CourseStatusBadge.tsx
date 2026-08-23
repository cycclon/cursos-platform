import { useTranslation } from 'react-i18next';

// Maps each course availability state to its dot/text tone. Labels are localized
// via the shared `common.availability.*` keys (ES/EN). 'En progreso' is a legacy
// value no longer offered in the course form but still handled for old data.
const STATUS_TONE: Record<string, string> = {
  Disponible: 'text-success',
  'Próximamente': 'text-highlight',
  'En progreso': 'text-primary',
  Cerrado: 'text-ink-light',
};

interface Props {
  availability: string;
  className?: string;
}

/**
 * "Case-file" status stamp for a course: a mono, colour-coded chip signalling
 * whether enrollment is open (Disponible), pending (Próximamente) or shut
 * (Cerrado). Meant as a top-left overlay on catalog thumbnails.
 */
export default function CourseStatusBadge({ availability, className = '' }: Props) {
  const { t } = useTranslation();
  const tone = STATUS_TONE[availability] ?? 'text-ink-light';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-surface-raised/85 backdrop-blur-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.2em] shadow-warm ${tone} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {t(`common.availability.${availability}`, availability)}
    </span>
  );
}
