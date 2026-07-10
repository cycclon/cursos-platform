import { currentLocale } from '@/i18n/lang';

// All formatting follows the active UI language (es-AR / en-US). Prices stay
// in ARS regardless of language — Mercado Pago charges in pesos.
export function formatPrice(price: number): string {
  return new Intl.NumberFormat(currentLocale(), {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(
  date: string | number | Date,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  return new Date(date).toLocaleDateString(currentLocale(), options);
}

export function formatDateTime(
  date: string | number | Date,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  },
): string {
  return new Date(date).toLocaleString(currentLocale(), options);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(currentLocale()).format(value);
}
