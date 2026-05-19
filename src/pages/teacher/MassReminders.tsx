import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Send, Users, Clock, Filter, Loader2, CheckCircle2,
  AlertTriangle, SlidersHorizontal, MailCheck,
} from 'lucide-react';
import { remindersService } from '@/services/reminders';
import { progressService } from '@/services/progress';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/services/api';
import { EmptyState } from '@/components/progress/visuals';
import type { MassReminderPreview, MassReminderResult } from '@/types';

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
      <p className="text-[11px] text-ink-light/80 mt-1">{hint}</p>
    </div>
  );
}

export default function MassReminders() {
  const { role } = useAuth();
  const canSend = role === 'teacher';
  const toast = useToast();

  const [staleDays, setStaleDays] = useState(14);
  const [cooldownDays, setCooldownDays] = useState(7);
  const [courseIds, setCourseIds] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<MassReminderPreview | null>(null);
  const [result, setResult] = useState<MassReminderResult | null>(null);

  const { data: courses = [] } = useQuery({
    queryKey: ['progress', 'courses'],
    queryFn: progressService.getCourses,
  });

  const params = () => ({
    staleDays,
    cooldownDays,
    courseIds: courseIds.size > 0 ? [...courseIds] : undefined,
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
      previewMutation.mutate();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No se pudieron enviar los recordatorios.'),
  });

  const toggleCourse = (id: string) =>
    setCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const dirtyAfterPreview = () => { setPreview(null); setResult(null); };

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Recordatorios masivos</h1>
        <p className="text-ink-light mt-1">
          Acompañá a quienes dejaron sus cursos en pausa con un mensaje cálido y personalizado.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <SlidersHorizontal className="w-4.5 h-4.5 text-gold" />
          <h2 className="font-display text-lg font-bold text-ink">Criterios</h2>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-5">
          <NumberField
            label="Días sin actividad"
            value={staleDays}
            onChange={(n) => { setStaleDays(n); dirtyAfterPreview(); }}
            hint="Sin progreso en ningún curso desde hace al menos estos días."
          />
          <NumberField
            label="Enfriamiento (días)"
            value={cooldownDays}
            onChange={(n) => { setCooldownDays(n); dirtyAfterPreview(); }}
            hint="No recordar si ya se le escribió en los últimos N días."
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-ink-light" />
            <span className="text-xs font-semibold text-ink-light">
              Cursos {courseIds.size === 0 ? '(todos)' : `(${courseIds.size} seleccionados)`}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => {
              const on = courseIds.has(c.courseId);
              return (
                <button
                  key={c.courseId}
                  onClick={() => { toggleCourse(c.courseId); dirtyAfterPreview(); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    on
                      ? 'bg-chocolate text-cream border-chocolate'
                      : 'bg-cream text-ink-light border-chocolate-100/30 hover:border-chocolate-light'
                  }`}
                >
                  {c.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-chocolate-100/20">
          <button
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending}
            className="btn-secondary btn-md disabled:opacity-50"
          >
            {previewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Previsualizar destinatarios
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-b border-chocolate-100/20 bg-cream/40">
            <div className="flex flex-wrap gap-6">
              <Stat label="Coinciden" value={preview.total} />
              <Stat label="Se enviarán" value={preview.willSend} tone="text-success" />
              <Stat label="Se omitirán" value={preview.willSkip} tone="text-gold-dark" />
            </div>
            <div className="flex items-center gap-3">
              {!canSend && (
                <span className="text-xs text-ink-light/80 max-w-[16rem] text-right">
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

          {preview.truncated && (
            <p className="px-5 py-2 text-[11px] text-gold-dark bg-gold/10 border-b border-gold/20">
              Mostrando los primeros {preview.students.length}. El envío procesa hasta 300 por lote.
            </p>
          )}

          {preview.students.length === 0 ? (
            <p className="text-sm text-ink-light text-center py-12">
              Ningún estudiante coincide con estos criterios. Probá bajar los “días sin actividad”.
            </p>
          ) : (
            <div className="divide-y divide-chocolate-100/20 max-h-[28rem] overflow-y-auto">
              {preview.students.map((s) => (
                <div key={s.studentId} className={`flex items-center gap-4 px-5 py-3 ${s.willSkip ? 'opacity-60' : ''}`}>
                  <div className="min-w-0 w-48 sm:w-60">
                    <p className="text-sm font-semibold text-ink truncate">{s.name}</p>
                    <p className="text-xs text-ink-light truncate">{s.email}</p>
                  </div>
                  <div className="flex-1 min-w-0 hidden md:flex flex-wrap gap-1.5">
                    {s.courses.slice(0, 3).map((c) => (
                      <span key={c.courseId} className="text-[11px] px-2 py-0.5 rounded-full bg-cream border border-chocolate-100/30 text-ink-light">
                        {c.title} · {c.progress}%
                      </span>
                    ))}
                    {s.courses.length > 3 && (
                      <span className="text-[11px] text-ink-light/70">+{s.courses.length - 3}</span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-ink-light shrink-0 tabular-nums">
                    <Clock className="w-3.5 h-3.5" /> {s.staleDays}d inactivo
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

      {/* Send result */}
      {result && (
        <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm p-6">
          <div className="flex items-center gap-2 mb-4">
            <MailCheck className="w-5 h-5 text-success" />
            <h2 className="font-display text-lg font-bold text-ink">Resultado del envío</h2>
          </div>
          <div className="flex flex-wrap gap-6">
            <Stat label="Enviados" value={result.sent} tone="text-success" />
            {result.logged > 0 && <Stat label="Registrados (sin SMTP)" value={result.logged} tone="text-gold-dark" />}
            <Stat label="Omitidos" value={result.skipped} tone="text-gold-dark" />
            {result.failed > 0 && <Stat label="Con error" value={result.failed} tone="text-error" />}
          </div>
          {result.failures.length > 0 && (
            <ul className="mt-4 text-xs text-error space-y-1">
              {result.failures.slice(0, 10).map((f) => (
                <li key={f.studentId}>{f.email}: {f.error}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!preview && !previewMutation.isPending && (
        <EmptyState text="Ajustá los criterios y previsualizá para ver a qué estudiantes se les enviaría el recordatorio." />
      )}
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
