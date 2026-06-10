import type { BugReportType, BugReportStatus, BugReportContextInput } from '@/types';
import { getRecentLogs } from './consoleCapture';

export const BUG_TYPE_LABEL: Record<BugReportType, string> = {
  bug: 'Error',
  suggestion: 'Sugerencia',
  question: 'Consulta',
};

export const BUG_STATUS_LABEL: Record<BugReportStatus, string> = {
  new: 'Nuevo',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
  wont_fix: 'No se hará',
};

/** Tailwind classes for each status pill (warm theme). */
export const BUG_STATUS_STYLE: Record<BugReportStatus, string> = {
  new: 'bg-error-light text-error border-error/30',
  in_progress: 'bg-gold/15 text-gold-dark border-gold/40',
  resolved: 'bg-success-light text-success border-success/30',
  closed: 'bg-chocolate-50 text-ink-light border-chocolate-100/40',
  wont_fix: 'bg-chocolate-50 text-ink-light border-chocolate-100/40',
};

export const BUG_STATUS_ORDER: BugReportStatus[] = [
  'new',
  'in_progress',
  'resolved',
  'closed',
  'wont_fix',
];

// Friendly Spanish names for routes, matched against the current pathname.
// Ordered: exact matches first, then dynamic patterns.
const STATIC_LABELS: Record<string, string> = {
  '/': 'Inicio',
  '/cursos': 'Catálogo de cursos',
  '/combos': 'Combos',
  '/talleres': 'Talleres',
  '/sobre-mi': 'Sobre mí',
  '/preguntas-frecuentes': 'Preguntas frecuentes',
  '/ingresar': 'Ingresar',
  '/registrarse': 'Registrarse',
  '/verificar-email': 'Verificar email',
  '/terminos-y-condiciones': 'Términos y condiciones',
  '/politica-de-privacidad': 'Política de privacidad',
  '/politica-de-reembolso': 'Política de reembolso',
  '/mi-panel': 'Mi panel',
  '/admin/perfil': 'Mi perfil (docente)',
  '/admin/panel': 'Dashboard docente',
  '/admin/cursos': 'Gestión de cursos',
  '/admin/combos': 'Gestión de combos',
  '/admin/talleres': 'Gestión de talleres',
  '/admin/faq': 'Gestión de FAQ',
  '/admin/opiniones': 'Gestión de opiniones',
  '/admin/estadisticas': 'Estadísticas',
  '/admin/progreso': 'Seguimiento de progreso',
  '/admin/recordatorios': 'Recordatorios',
  '/admin/ventas': 'Detalle de ventas',
  '/superusuario': 'Panel de administración',
  '/superusuario/progreso': 'Seguimiento de progreso',
  '/superusuario/recordatorios': 'Recordatorios',
  '/superusuario/ventas': 'Detalle de ventas',
  '/superusuario/reportes': 'Reportes',
};

const PATTERN_LABELS: [RegExp, string][] = [
  [/^\/cursos\/[^/]+$/, 'Detalle de curso'],
  [/^\/combos\/[^/]+$/, 'Detalle de combo'],
  [/^\/talleres\/[^/]+$/, 'Detalle de taller'],
  [/^\/aprender\/[^/]+$/, 'Reproductor de curso'],
  [/^\/examen\/[^/]+$/, 'Examen del curso'],
  [/^\/certificado\/[^/]+$/, 'Certificado'],
  [/^\/admin\/estudiantes\/[^/]+$/, 'Detalle de estudiante'],
  [/^\/superusuario\/estudiantes\/[^/]+$/, 'Detalle de estudiante'],
];

/** Human-friendly Spanish label for a route path, for page-aware prefill. */
export function describePage(pathname: string): string {
  if (STATIC_LABELS[pathname]) return STATIC_LABELS[pathname];
  for (const [re, label] of PATTERN_LABELS) {
    if (re.test(pathname)) return label;
  }
  return pathname;
}

const clip = (s: string | undefined | null, max: number): string | undefined =>
  s ? s.slice(0, max) : undefined;

/**
 * Capture page + technical context at the moment the report drawer opens.
 * Reads only information already visible/available in the page — the visible
 * <h1>, the URL, browser and viewport — nothing the user can't already see.
 */
export function captureContext(pathname: string): BugReportContextInput {
  const headingEl =
    document.querySelector('main h1') || document.querySelector('h1');
  const heading = headingEl?.textContent?.trim();

  return {
    url: window.location.href.slice(0, 2000),
    path: pathname.slice(0, 500),
    pageLabel: describePage(pathname),
    pageHeading: clip(heading, 400),
    userAgent: clip(navigator.userAgent, 600),
    viewport: `${window.innerWidth}×${window.innerHeight}`,
    screen: `${window.screen.width}×${window.screen.height}`,
    language: clip(navigator.language, 40),
    referrer: clip(document.referrer || undefined, 2000),
    consoleLogs: getRecentLogs(),
  };
}
