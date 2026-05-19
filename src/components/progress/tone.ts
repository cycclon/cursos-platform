/** Color ramp shared by every progress surface so a "70%" looks the same everywhere. */
export function toneFor(pct: number) {
  if (pct >= 100) return { bar: 'from-success to-success', track: 'bg-success/15', text: 'text-success' };
  if (pct >= 67) return { bar: 'from-chocolate to-chocolate-light', track: 'bg-chocolate-100/50', text: 'text-chocolate' };
  if (pct >= 34) return { bar: 'from-gold to-gold-light', track: 'bg-gold/15', text: 'text-gold-dark' };
  return { bar: 'from-gold-light to-gold-light', track: 'bg-chocolate-100/40', text: 'text-ink-light' };
}
