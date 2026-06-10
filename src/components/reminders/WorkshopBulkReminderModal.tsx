import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation } from '@tanstack/react-query';
import {
  X, Send, Users, Clock, Loader2, AlertTriangle, CheckCircle2, Bell, MailCheck,
} from 'lucide-react';
import { remindersService } from '@/services/reminders';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/services/api';
import type { Workshop, MassReminderPreview, MassReminderResult } from '@/types';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function NumberField({
  label, value, onChange, hint, min = 0,
}: { label: string; value: number; onChange: (n: number) => void; hint: string; min?: number }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-light mb-1.5">{label}</label>
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
        className="w-28 px-3 py-2 text-sm rounded-lg bg-cream border border-chocolate-100/30 text-ink focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/40 transition-shadow tabular-nums"
      />
      <p className="text-[11px] text-ink-light/80 mt-1 max-w-[14rem]">{hint}</p>
    </div>
  );
}

function Stat({ label, value, tone = 'text-ink' }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <p className={`font-display text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
      <p className="text-xs text-ink-light mt-0.5">{label}</p>
    </div>
  );
}

/**
 * Workshop-scoped batch reminder. Reuses the platform mass-reminder endpoints but
 * restricts the pool to this workshop's registrants (`studentIds`) and measures
 * inactivity only on the required correlativas (`courseIds` + staleScope:'courses').
 * The teacher sets the "días sin actividad" threshold; preview → confirm → send.
 */
export default function WorkshopBulkReminderModal({
  workshop,
  studentIds,
  onClose,
  onSent,
}: {
  workshop: Workshop;
  studentIds: string[];
  onClose: () => void;
  onSent: () => void;
}) {
  const { role } = useAuth();
  const canSend = role === 'teacher';
  const toast = useToast();

  const [staleDays, setStaleDays] = useState(7);
  const [cooldownDays, setCooldownDays] = useState(7);
  const [preview, setPreview] = useState<MassReminderPreview | null>(null);
  const [result, setResult] = useState<MassReminderResult | null>(null);

  const params = () => ({
    staleDays,
    cooldownDays,
    courseIds: workshop.prerequisiteCourseIds,
    studentIds,
    staleScope: 'courses' as const,
  });

  const previewMutation = useMutation({
    mutationFn: () => remindersService.massPreview(params()),
    onSuccess: (d) => { setPreview(d); setResult(null); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No se pudo generar la previsualización.'),
  });

  const sendMutation = useMutation({
    mutationFn: () => remindersService.massSend(params()),
    onSuccess: (d) => {
      setResult(d);
      const delivered = d.sent + d.logged;
      toast.success(
        `Recordatorios procesados: ${delivered} enviado(s)${d.skipped ? `, ${d.skipped} omitido(s)` : ''}${d.failed ? `, ${d.failed} con error` : ''}.`,
      );
      onSent();
      previewMutation.mutate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No se pudieron enviar los recordatorios.'),
  });

  const dirty = () => { setPreview(null); setResult(null); };

  // Esc to close + lock background scroll while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in-up"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Enviar recordatorios para ${workshop.title}`}
    >
      <div
        className="relative w-full max-w-2xl my-8 bg-parchment rounded-2xl border border-chocolate-100/30 shadow-warm-lg overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-chocolate-100/20 bg-cream/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-chocolate-50 text-chocolate flex items-center justify-center shrink-0">
              <Bell className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ink leading-tight">Recordatorios del taller</h2>
              <p className="text-xs text-ink-light truncate">
                A los inscriptos que dejaron las correlativas en pausa
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-light hover:text-chocolate hover:bg-chocolate-50 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto space-y-5">
          <p className="text-sm text-ink-light">
            Buscamos a los alumnos que compraron <span className="font-medium text-ink">{workshop.title}</span> y
            todavía no completaron los cursos correlativos, filtrando por cuántos días llevan sin avanzar en ellos.
          </p>

          <div className="flex flex-wrap gap-x-10 gap-y-5">
            <NumberField
              label="Días sin actividad"
              value={staleDays}
              onChange={(n) => { setStaleDays(n); dirty(); }}
              hint="Sin progreso en las correlativas desde hace al menos estos días."
            />
            <NumberField
              label="Enfriamiento (días)"
              value={cooldownDays}
              onChange={(n) => { setCooldownDays(n); dirty(); }}
              hint="No recordar si ya se le escribió en los últimos N días."
            />
          </div>

          <button
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending}
            className="btn-secondary btn-md disabled:opacity-50"
          >
            {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Previsualizar destinatarios
          </button>

          {preview && (
            <div className="rounded-xl border border-chocolate-100/30 overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-chocolate-100/20 bg-cream/40">
                <div className="flex flex-wrap gap-6">
                  <Stat label="Coinciden" value={preview.total} />
                  <Stat label="Se enviarán" value={preview.willSend} tone="text-success" />
                  <Stat label="Se omitirán" value={preview.willSkip} tone="text-gold-dark" />
                </div>
                <div className="flex items-center gap-3">
                  {!canSend && (
                    <span className="text-xs text-ink-light/80 max-w-[14rem] text-right">
                      Vista de administrador: podés previsualizar pero no enviar.
                    </span>
                  )}
                  <button
                    onClick={() => sendMutation.mutate()}
                    disabled={!canSend || sendMutation.isPending || preview.willSend === 0}
                    title={canSend ? undefined : 'Solo los docentes pueden enviar recordatorios.'}
                    className="btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sendMutation.isPending ? 'Enviando…' : `Enviar a ${preview.willSend}`}
                  </button>
                </div>
              </div>

              {preview.students.length === 0 ? (
                <p className="text-sm text-ink-light text-center py-10">
                  Ningún inscripto coincide con estos criterios. Probá bajar los “días sin actividad”.
                </p>
              ) : (
                <div className="divide-y divide-chocolate-100/20 max-h-72 overflow-y-auto">
                  {preview.students.map((s) => (
                    <div key={s.studentId} className={`flex items-center gap-3 px-4 py-3 ${s.willSkip ? 'opacity-60' : ''}`}>
                      <div className="min-w-0 w-40 sm:w-52">
                        <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                        <p className="text-xs text-ink-light truncate">{s.email}</p>
                      </div>
                      <div className="flex-1 min-w-0 hidden md:flex flex-wrap gap-1.5">
                        {s.courses.slice(0, 2).map((c) => (
                          <span key={c.courseId} className="text-[11px] px-2 py-0.5 rounded-full bg-cream border border-chocolate-100/30 text-ink-light">
                            {c.title} · {c.progress}%
                          </span>
                        ))}
                        {s.courses.length > 2 && (
                          <span className="text-[11px] text-ink-light/70">+{s.courses.length - 2}</span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-ink-light shrink-0 tabular-nums">
                        <Clock className="w-3.5 h-3.5" /> {s.staleDays}d
                      </span>
                      {s.willSkip ? (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gold/10 text-gold-dark shrink-0"
                          title={s.lastReminderAt ? `Recordado el ${fmtDate(s.lastReminderAt)}` : 'En período de enfriamiento'}
                        >
                          <AlertTriangle className="w-3 h-3" /> Se omitirá
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-success-light text-success shrink-0">
                          <CheckCircle2 className="w-3 h-3" /> Se enviará
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-chocolate-100/30 bg-cream/40 p-4">
              <div className="flex items-center gap-2 mb-3">
                <MailCheck className="w-5 h-5 text-success" />
                <h3 className="font-display text-base font-bold text-ink">Resultado del envío</h3>
              </div>
              <div className="flex flex-wrap gap-6">
                <Stat label="Enviados" value={result.sent} tone="text-success" />
                {result.logged > 0 && <Stat label="Registrados (sin SMTP)" value={result.logged} tone="text-gold-dark" />}
                <Stat label="Omitidos" value={result.skipped} tone="text-gold-dark" />
                {result.failed > 0 && <Stat label="Con error" value={result.failed} tone="text-error" />}
              </div>
              {result.failures.length > 0 && (
                <ul className="mt-3 text-xs text-error space-y-1">
                  {result.failures.slice(0, 8).map((f) => (
                    <li key={f.studentId}>{f.email}: {f.error}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-chocolate-100/20 bg-cream/50">
          <button onClick={onClose} className="btn-ghost btn-md">Cerrar</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
