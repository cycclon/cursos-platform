import { currentLocale, type AppCurrency } from '@/i18n/lang';

// Digits follow the active UI language (es-AR / en-US); the currency is explicit.
// ARS (Mercado Pago lane) shows whole pesos; USD (Lemon Squeezy lane) shows cents
// only when present. Callers on public surfaces pass the selected currency; admin
// surfaces omit it and get ARS.
export function formatPrice(price: number, currency: AppCurrency = 'ARS'): string {
  return new Intl.NumberFormat(currentLocale(), {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
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
