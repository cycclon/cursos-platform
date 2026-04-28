export const AVAILABILITY_OPTIONS = [
  { value: 'Disponible', label: 'Disponible' },
  { value: 'Próximamente', label: 'Próximamente' },
  { value: 'En progreso', label: 'En progreso' },
  { value: 'Cerrado', label: 'Cerrado' },
] as const;

export type AvailabilityValue = (typeof AVAILABILITY_OPTIONS)[number]['value'];
