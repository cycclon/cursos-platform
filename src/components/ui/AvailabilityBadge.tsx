import { CalendarClock } from 'lucide-react';
import type { BundleAvailability } from '@/utils/bundleAvailability';

type Variant = 'overlay' | 'inline';

interface Props {
  status: BundleAvailability;
  variant?: Variant;
  className?: string;
}

/**
 * Status badge for a combo derived from the availability of the courses and
 * workshops it contains. Distinct from CapacityBadge (which signals urgency
 * driven by remaining seats).
 */
export function AvailabilityBadge({ status, variant = 'overlay', className = '' }: Props) {
  if (status.kind === 'available') return null;

  const overlayBase =
    'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase shadow-warm backdrop-blur-sm';
  const inlineBase = 'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full';

  const styles = variant === 'overlay'
    ? `${overlayBase} bg-chocolate/90 text-cream`
    : `${inlineBase} bg-chocolate/10 text-chocolate`;

  return (
    <span className={`${styles} ${className}`}>
      <CalendarClock className="w-3 h-3" />
      No disponible
    </span>
  );
}
