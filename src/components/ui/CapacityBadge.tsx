import { Flame, Lock } from 'lucide-react';
import type { CapacityStatus } from '@/utils/capacity';

type Variant = 'overlay' | 'inline';

interface Props {
  status: CapacityStatus;
  variant?: Variant;
  className?: string;
}

/**
 * Renders an urgency/sold-out badge for a workshop or combo.
 * - `overlay` is positioned absolutely on top of a card image.
 * - `inline` is a flex pill suitable for meta rows or detail headers.
 */
export function CapacityBadge({ status, variant = 'overlay', className = '' }: Props) {
  if (status.kind === 'unlimited' || status.kind === 'available') return null;

  const overlayBase =
    'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase shadow-warm backdrop-blur-sm';
  const inlineBase = 'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full';

  if (status.kind === 'sold_out') {
    const styles = variant === 'overlay'
      ? `${overlayBase} bg-ink/85 text-cream`
      : `${inlineBase} bg-ink/10 text-ink`;
    return (
      <span className={`${styles} ${className}`}>
        <Lock className="w-3 h-3" />
        Agotado
      </span>
    );
  }

  // low
  const styles = variant === 'overlay'
    ? `${overlayBase} bg-error text-cream`
    : `${inlineBase} bg-error/10 text-error`;
  const label = status.seatsLeft === 1
    ? '¡Último cupo!'
    : `¡Últimos ${status.seatsLeft} cupos!`;
  return (
    <span className={`${styles} ${className}`}>
      <Flame className="w-3 h-3" />
      {label}
    </span>
  );
}
