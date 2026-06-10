import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Send, Bug, Lightbulb, HelpCircle, ImagePlus, Loader2,
  ChevronDown, ChevronUp, MapPin, Monitor, Trash2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { bugReportsService } from '@/services/bugReports';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/services/api';
import { BUG_TYPE_LABEL } from '@/utils/bugReports';
import type { BugReportContextInput, BugReportType } from '@/types';

const TYPE_OPTIONS: { value: BugReportType; icon: typeof Bug; hint: string }[] = [
  { value: 'bug', icon: Bug, hint: 'Algo no funciona' },
  { value: 'suggestion', icon: Lightbulb, hint: 'Una idea de mejora' },
  { value: 'question', icon: HelpCircle, hint: 'Una duda o consulta' },
];

// High-DPI full-page screenshots routinely exceed 5MB — keep this generous.
// Must stay ≤ the server-side check in backend/src/routes/bugReports.ts.
const MAX_IMAGE_MB = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function BugReportDrawer({
  context,
  onClose,
}: {
  context: BugReportContextInput;
  onClose: () => void;
}) {
  const toast = useToast();

  const [type, setType] = useState<BugReportType>('bug');
  const [message, setMessage] = useState('');
  const [pageLabel, setPageLabel] = useState(context.pageLabel ?? context.path);
  const [website, setWebsite] = useState(''); // honeypot
  const [techOpen, setTechOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Image attachment
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  // Shown inline under the picker: toasts alone proved easy to miss here.
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Esc to close + lock background scroll.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !submitting && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, submitting]);

  // Revoke the object URL when it changes/unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFile = async (file: File) => {
    setUploadError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('Solo se permiten imágenes JPG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setUploadError(`La imagen supera el máximo de ${MAX_IMAGE_MB}MB.`);
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setAttachmentUrl(null);
    setUploadPct(0);
    try {
      const { url } = await bugReportsService.uploadImage(file, (p) => setUploadPct(p));
      setAttachmentUrl(url);
      setUploadPct(null);
    } catch (err) {
      setUploadPct(null);
      setPreviewUrl((cur) => {
        if (cur) URL.revokeObjectURL(cur);
        return null;
      });
      const msg = err instanceof ApiError ? err.message : 'No se pudo subir la imagen.';
      // Keep the HTTP status visible: it tells apart "route missing" (404),
      // "proxy rejected the size" (413) and "storage failed" (502).
      setUploadError(err instanceof ApiError && err.status > 0 ? `${msg} (HTTP ${err.status})` : msg);
    }
  };

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setAttachmentUrl(null);
    setUploadPct(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isUploading = uploadPct !== null;
  const canSubmit = message.trim().length >= 5 && !submitting && !isUploading;
  const consoleLineCount = context.consoleLogs
    ? context.consoleLogs.split('\n').filter(Boolean).length
    : 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await bugReportsService.create({
        type,
        message: message.trim(),
        attachmentUrl: attachmentUrl ?? undefined,
        context: { ...context, pageLabel: pageLabel.trim() || context.pageLabel },
        website,
      });
      toast.success(`¡Gracias! Recibimos tu reporte ${res.ticketId}. Te escribimos a tu email.`);
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo enviar el reporte.');
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-stretch sm:justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Reportar un problema"
    >
      {/* Backdrop — deliberately no blur and barely dimmed: the drawer sits
          beside the page so the user can keep looking at what they're reporting. */}
      <div
        className="absolute inset-0 bg-ink/10 animate-fade-in"
        onMouseDown={() => !submitting && onClose()}
      />

      {/* Panel: bottom sheet on mobile, right drawer on desktop */}
      <div
        className="relative w-full max-h-[90dvh] rounded-t-2xl flex flex-col bg-parchment border border-chocolate-100/30 shadow-warm-lg overflow-hidden animate-slide-in-up
                   sm:w-[440px] sm:max-w-[92vw] sm:max-h-none sm:h-full sm:rounded-t-none sm:rounded-l-2xl sm:border-y-0 sm:border-r-0 sm:animate-slide-in-right"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-chocolate-100/30 bg-cream/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-chocolate text-cream flex items-center justify-center shrink-0 shadow-warm">
              <Bug className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ink leading-tight">Reportar un problema</h2>
              <p className="text-xs text-ink-light truncate">Tu mensaje nos ayuda a mejorar la plataforma.</p>
            </div>
          </div>
          <button
            onClick={() => !submitting && onClose()}
            className="p-1.5 rounded-lg text-ink-light hover:text-chocolate hover:bg-chocolate-50 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto flex-1 space-y-5">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-semibold text-ink-light mb-2">¿Qué querés contarnos?</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const active = type === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setType(opt.value)}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all ${
                      active
                        ? 'border-chocolate bg-chocolate-50 text-chocolate shadow-warm'
                        : 'border-chocolate-100/40 bg-cream text-ink-light hover:border-chocolate-light/60 hover:text-chocolate'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold leading-tight">{BUG_TYPE_LABEL[opt.value]}</span>
                    <span className="text-[10px] leading-tight opacity-70 hidden sm:block">{opt.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="br-message" className="block text-xs font-semibold text-ink-light mb-1.5">
              Contanos qué pasó
            </label>
            <textarea
              id="br-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              autoFocus
              placeholder={
                type === 'bug'
                  ? 'Ej: Al hacer clic en "Reproducir", el video no carga y aparece una pantalla en negro…'
                  : type === 'suggestion'
                    ? 'Ej: Estaría bueno poder descargar los materiales en un solo archivo…'
                    : 'Ej: ¿Dónde puedo ver mi certificado una vez aprobado el examen?'
              }
              className="w-full px-3.5 py-3 text-sm leading-relaxed rounded-xl bg-cream border border-chocolate-100/40 text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/40 transition-shadow resize-y"
            />
            <p className="text-[11px] text-ink-light/70 mt-1">Mínimo 5 caracteres. Cuanto más detalle, mejor.</p>
          </div>

          {/* Page (prefilled, editable) */}
          <div>
            <label htmlFor="br-page" className="flex items-center gap-1.5 text-xs font-semibold text-ink-light mb-1.5">
              <MapPin className="w-3.5 h-3.5" />
              ¿En qué página/sección?
            </label>
            <input
              id="br-page"
              value={pageLabel}
              onChange={(e) => setPageLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-cream border border-chocolate-100/40 text-ink focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/40 transition-shadow"
            />
            {context.pageHeading && (
              <p className="text-[11px] text-ink-light/70 mt-1 truncate">
                Detectamos: <span className="font-medium text-ink-light">{context.pageHeading}</span>
              </p>
            )}
          </div>

          {/* Image attachment */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-light mb-1.5">
              <ImagePlus className="w-3.5 h-3.5" />
              Captura de pantalla <span className="font-normal opacity-70">(opcional)</span>
            </label>

            {!previewUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1.5 px-4 py-5 rounded-xl border border-dashed border-chocolate-100/60 bg-cream/60 text-ink-light hover:border-chocolate-light hover:bg-chocolate-50/40 transition-colors"
              >
                <ImagePlus className="w-5 h-5" />
                <span className="text-xs font-medium">Adjuntar una imagen</span>
                <span className="text-[10px] opacity-70">JPG, PNG o WEBP · hasta {MAX_IMAGE_MB}MB</span>
              </button>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-chocolate-100/40 bg-cream">
                <img src={previewUrl} alt="Vista previa del adjunto" className="w-full max-h-48 object-contain bg-ink/5" />
                {isUploading && (
                  <div className="absolute inset-0 bg-ink/50 flex flex-col items-center justify-center text-cream gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-medium">Subiendo… {uploadPct}%</span>
                  </div>
                )}
                {!isUploading && attachmentUrl && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-light text-success text-[10px] font-semibold border border-success/30">
                    <CheckCircle2 className="w-3 h-3" /> Lista
                  </div>
                )}
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-ink/60 text-cream hover:bg-error transition-colors"
                  aria-label="Quitar imagen"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {uploadError && (
              <p className="flex items-start gap-1.5 text-[11px] text-error mt-1.5" role="alert">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                {uploadError}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {/* Technical details (transparent, collapsible) */}
          <div className="rounded-xl border border-chocolate-100/40 bg-cream/50 overflow-hidden">
            <button
              type="button"
              onClick={() => setTechOpen((o) => !o)}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-semibold text-ink-light hover:bg-chocolate-50/40 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                Detalles técnicos que adjuntamos
              </span>
              {techOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {techOpen && (
              <div className="border-t border-chocolate-100/30">
                <dl className="px-3.5 pb-3 pt-2 space-y-1.5 text-[11px] text-ink-light">
                  <ContextRow label="Dirección" value={context.url} mono />
                  <ContextRow label="Navegador" value={context.userAgent} mono />
                  <ContextRow label="Ventana" value={context.viewport} />
                  <ContextRow label="Pantalla" value={context.screen} />
                  <ContextRow label="Idioma" value={context.language} />
                </dl>
                {consoleLineCount > 0 && (
                  <div className="px-3.5 pb-3">
                    <p className="text-[11px] font-medium text-ink-light/80 mb-1">
                      Registros de consola ({consoleLineCount}) — se adjuntan para ayudar a diagnosticar:
                    </p>
                    <pre className="max-h-32 overflow-auto rounded-lg bg-ink/90 text-cream/90 text-[10px] leading-relaxed p-2.5 whitespace-pre-wrap break-words font-mono">
                      {context.consoleLogs}
                    </pre>
                  </div>
                )}
              </div>
            )}
            <p className="px-3.5 pb-3 text-[10px] text-ink-light/60">
              Incluimos esta información para reproducir el problema. No accedemos a nada que no esté en esta página.
            </p>
          </div>

          {/* Honeypot — visually hidden, off-screen. Bots fill it, humans don't. */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            className="absolute -left-[9999px] w-px h-px opacity-0"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-chocolate-100/30 bg-cream/60 shrink-0">
          <button onClick={() => !submitting && onClose()} className="btn-ghost btn-md" disabled={submitting}>
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Enviando…' : 'Enviar reporte'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ContextRow({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <dt className="shrink-0 w-20 font-medium text-ink-light/80">{label}</dt>
      <dd className={`min-w-0 break-all text-ink-light ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}
