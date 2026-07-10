import type { TFunction } from 'i18next';
import type { Course, Workshop } from '@/types';

export type UnavailableItem = {
  kind: 'course' | 'workshop';
  id: string;
  title: string;
  status: string;
};

export type BundleAvailability =
  | { kind: 'available' }
  | { kind: 'unavailable'; items: UnavailableItem[] };

export function bundleAvailability(courses: Course[], workshops: Workshop[] = []): BundleAvailability {
  const items: UnavailableItem[] = [
    ...courses
      .filter((c) => c.availability !== 'Disponible')
      .map<UnavailableItem>((c) => ({ kind: 'course', id: c.id, title: c.title, status: c.availability })),
    ...workshops
      .filter((w) => w.availability !== 'Disponible')
      .map<UnavailableItem>((w) => ({ kind: 'workshop', id: w.id, title: w.title, status: w.availability })),
  ];
  if (items.length === 0) return { kind: 'available' };
  return { kind: 'unavailable', items };
}

export function bundleAvailabilityReason(status: BundleAvailability, t: TFunction): string | null {
  if (status.kind === 'available') return null;
  if (status.items.length === 1) {
    const item = status.items[0];
    return t('bundleAvailability.unavailableSingle', {
      kind: t(`bundleAvailability.${item.kind}`),
      title: item.title,
    });
  }
  return t('bundleAvailability.unavailableMany');
}
