import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Printer, Loader2 } from 'lucide-react';
import { promoCodesService } from '@/services/promoCodes';
import { coursesService } from '@/services/courses';
import { bundlesService } from '@/services/bundles';
import { workshopsService } from '@/services/workshops';
import { useAuth } from '@/context/AuthContext';

/**
 * The QR must stay high-contrast ink-on-white regardless of the active theme
 * or the print surface — a magenta code on ivory is unreliable to scan. Same
 * reasoning as the `.signature-mark` print pin in index.css.
 */
const QR_INK = '#231B3D';

function formatLongDate(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function GiftCard() {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuth();
  const basePath = role === 'superuser' ? '/superusuario' : '/admin';

  // Reuses the manager's cached list rather than adding a by-id endpoint.
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: promoCodesService.list,
  });
  const promo = codes.find((c) => c.id === id);

  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: coursesService.getCourses });
  const { data: bundles = [] } = useQuery({ queryKey: ['bundles'], queryFn: bundlesService.getBundles });
  const { data: workshops = [] } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => workshopsService.getWorkshops(),
  });

  const [recipient, setRecipient] = useState<string | null>(null);
  const name = recipient ?? promo?.label ?? '';

  /** What the card says the code unlocks. */
  const subject = useMemo(() => {
    if (!promo) return '';
    if (promo.scope === 'all') return 'Cualquier curso del catálogo';
    const titles = [
      ...courses.filter((c) => promo.courseIds.includes(c.id)).map((c) => c.title),
      ...bundles.filter((b) => promo.bundleIds.includes(b.id)).map((b) => b.title),
      ...workshops.filter((w) => promo.workshopIds.includes(w.id)).map((w) => w.title),
    ];
    if (titles.length === 0) return 'Acceso a la academia';
    if (titles.length === 1) return titles[0];
    return `${titles[0]} y ${titles.length - 1} más`;
  }, [promo, courses, bundles, workshops]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!promo) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-ink-light">Ese código no existe.</p>
        <Link to={`${basePath}/codigos`} className="btn-primary btn-md rounded-xl">
          Volver a códigos
        </Link>
      </div>
    );
  }

  const redeemUrl = `${window.location.origin}/canjear/${promo.code}`;
  const expiry = formatLongDate(promo.expiresAt);
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-surface print-giftcard">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Controls — never printed */}
        <div className="no-print mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
            <Link
              to={`${basePath}/codigos`}
              className="inline-flex items-center gap-2 text-sm text-ink-light hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a códigos
            </Link>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Guardar PDF
            </button>
          </div>
          <div className="bg-surface-raised rounded-xl border border-primary-100/20 shadow-warm p-4">
            <label className="block text-sm font-medium text-ink mb-1.5">¿Para quién es la tarjeta?</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Dra. Pérez"
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all"
            />
            <p className="text-[11px] text-ink-light/70 mt-1.5">
              Se imprime en la tarjeta. Dejalo vacío si preferís entregarla sin nombre.
            </p>
          </div>
        </div>

        {/* The card */}
        <div className="relative bg-surface-raised border border-primary/25 rounded-2xl overflow-hidden shadow-warm-lg print-giftcard-card">
          <span className="corner-bracket corner-bracket-tl" />
          <span className="corner-bracket corner-bracket-tr" />
          <span className="corner-bracket corner-bracket-bl" />
          <span className="corner-bracket corner-bracket-br" />

          <div className="p-8 sm:p-12">
            {/* Masthead */}
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.28em] text-ink-light mb-10">
              <span>NJ · Edición {year}</span>
              <span>Expediente de Cortesía</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-10 sm:gap-12">
              {/* Left: the offer */}
              <div className="flex-1 min-w-0 flex gap-5">
                {/* The shield mark carries its own dark ground (the source is a
                    JPEG with no transparency), so it reads as a tile in both
                    themes and on the printed white card — same treatment the
                    certificate gives it. */}
                <img
                  src="/logo.png"
                  alt="Academia de Litigación"
                  className="h-14 w-auto shrink-0 self-start object-contain rounded-lg"
                />

                {/* Architectural column */}
                <div className="giftcard-rule w-0.5 shrink-0 bg-primary self-stretch" aria-hidden="true" />

                <div className="min-w-0">
                  <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[0.95] text-ink">
                    Acceso de{' '}
                    <em
                      className="giftcard-accent text-primary not-italic sm:italic"
                      style={{ fontVariationSettings: '"SOFT" 100, "opsz" 144' }}
                    >
                      cortesía
                    </em>
                  </h1>

                  <p className="font-display text-lg text-ink-light mt-5 leading-snug">{subject}</p>

                  {name.trim() && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink mt-6">
                      Para: {name.trim()}
                    </p>
                  )}

                  <p className="text-sm text-ink-light mt-6 max-w-sm leading-relaxed">
                    Escaneá el código, ingresá con tu cuenta y el acceso queda activado al instante.
                  </p>
                </div>
              </div>

              {/* Right: the scan block */}
              <div className="shrink-0 sm:text-right">
                <div className="inline-block relative p-3 bg-white rounded-lg">
                  <QRCodeSVG
                    value={redeemUrl}
                    size={148}
                    level="M"
                    marginSize={0}
                    fgColor={QR_INK}
                    bgColor="#FFFFFF"
                    title={`Canjear el código ${promo.code}`}
                  />
                </div>
                <p className="font-mono text-lg font-bold tracking-[0.16em] text-ink mt-3">{promo.code}</p>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-light mt-1.5">
                  {promo.discountPercent >= 100 ? 'Sin cargo' : `${promo.discountPercent}% de descuento`}
                </p>
              </div>
            </div>

            {/* Docket footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-10 pt-4 border-t border-primary/20 font-mono text-[10px] uppercase tracking-[0.22em] text-ink-light">
              <span>academiadelitigacion.com.ar</span>
              <span>{expiry ? `Vence ${expiry}` : 'Sin vencimiento'}</span>
            </div>
          </div>
        </div>

        <p className="no-print text-xs text-ink-light/70 text-center mt-6">
          Al imprimir, elegí <strong className="text-ink-light">A5 horizontal</strong> o “Guardar como PDF”.
        </p>
      </div>
    </div>
  );
}
