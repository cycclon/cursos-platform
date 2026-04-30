import type { Workshop } from '@/types';

export type CapacityStatus =
  | { kind: 'unlimited' }
  | { kind: 'available'; seatsLeft: number }
  | { kind: 'low'; seatsLeft: number }
  | { kind: 'sold_out' };

const LOW_SEATS_THRESHOLD = 5;

export function workshopCapacityStatus(workshop: Pick<Workshop, 'capacity' | 'registeredCount'>): CapacityStatus {
  if (workshop.capacity == null) return { kind: 'unlimited' };
  const seatsLeft = Math.max(workshop.capacity - workshop.registeredCount, 0);
  if (seatsLeft === 0) return { kind: 'sold_out' };
  if (seatsLeft <= LOW_SEATS_THRESHOLD) return { kind: 'low', seatsLeft };
  return { kind: 'available', seatsLeft };
}

/**
 * Aggregate capacity status across the workshops contained in a combo.
 * - sold_out if any contained workshop is sold out
 * - low if any contained workshop has low seats (and none are sold out)
 * - otherwise the most-constrained available count, or unlimited
 */
export function bundleCapacityStatus(workshops: Pick<Workshop, 'capacity' | 'registeredCount'>[]): CapacityStatus {
  if (workshops.length === 0) return { kind: 'unlimited' };
  const statuses = workshops.map(workshopCapacityStatus);
  if (statuses.some((s) => s.kind === 'sold_out')) return { kind: 'sold_out' };
  const lows = statuses.filter((s): s is Extract<CapacityStatus, { kind: 'low' }> => s.kind === 'low');
  if (lows.length > 0) {
    const min = Math.min(...lows.map((l) => l.seatsLeft));
    return { kind: 'low', seatsLeft: min };
  }
  const limited = statuses.filter((s): s is Extract<CapacityStatus, { kind: 'available' }> => s.kind === 'available');
  if (limited.length === 0) return { kind: 'unlimited' };
  return { kind: 'available', seatsLeft: Math.min(...limited.map((l) => l.seatsLeft)) };
}
