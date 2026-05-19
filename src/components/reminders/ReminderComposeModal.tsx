import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Send, Mail, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { remindersService } from '@/services/reminders';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/services/api';
import type { ReminderDraft } from '@/types';

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Inner form — only mounted once the draft is loaded, so state can be
 *  initialized straight from props (no setState-in-effect). */
function ComposeForm({
  studentId,
  studentName,
  data,
  onClose,
}: {
  studentId: string;
  studentName: string;
  data: ReminderDraft;
  onClose: () => void;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const [subject, setSubject] = useState(data.draft.subject);
  const [body, setBody] = useState(data.draft.body);
  const [signature, setSignature] = useState(data.draft.signature);

  const sendMutation = useMutation({
    mutationFn: () => remindersService.sendToStudent(studentId, { subject, body, signature }),
    onSuccess: (r) => {
      toast.success(
        r.status === 'logged'
          ? 'Recordatorio registrado (SMTP no configurado, no se envió el correo).'
          : `Recordatorio enviado a ${studentName.split(' ')[0]}.`,
      );
      qc.invalidateQueries({ queryKey: ['reminder-log', studentId] });
      qc.invalidateQueries({ queryKey: ['reminder-draft', studentId] });
      onClose();
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No se pudo enviar el recordatorio.'),
  });

  const canSend = subject.trim().length > 0 && body.trim().length > 0;

  return (
    <>
      <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
        <div className="space-y-4">
          {data.recentlyReminded && data.lastReminderAt && (
            <div className="flex items-start gap-2.5 rounded-lg border border-gold/40 bg-gold/10 px-3.5 py-2.5">
              <AlertTriangle className="w-4 h-4 text-gold-dark shrink-0 mt-0.5" />
              <p className="text-xs text-ink-light">
                Ya le enviaste un recordatorio el{' '}
                <span className="font-semibold text-ink">{fmtDate(data.lastReminderAt)}</span>. Podés
                enviarlo igual, pero evitá saturarlo con mensajes muy seguidos.
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm border-b border-chocolate-100/20 pb-3">
            <span className="text-ink-light shrink-0">Para:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-chocolate-50 text-chocolate text-xs font-medium">
              {studentName} · {data.student.email}
            </span>
          </div>

          {data.courses.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {data.courses.map((c) => (
                <span
                  key={c.courseId}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-cream border border-chocolate-100/30 text-ink-light"
                  title={`${c.remainingModules} módulo(s) pendientes`}
                >
                  {c.title} · {c.progress}%
                </span>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-light mb-1.5">Asunto</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-cream border border-chocolate-100/30 text-ink focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/40 transition-shadow"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-light mb-1.5">Mensaje</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full px-3.5 py-3 text-sm leading-relaxed rounded-lg bg-cream border border-chocolate-100/30 text-ink focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/40 transition-shadow resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-light mb-1.5">Firma</label>
            <textarea
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-cream border border-chocolate-100/30 text-ink focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/40 transition-shadow resize-y"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-chocolate-100/20 bg-cream/50">
        <button onClick={onClose} className="btn-ghost btn-md" disabled={sendMutation.isPending}>
          Cancelar
        </button>
        <button
          onClick={() => sendMutation.mutate()}
          disabled={!canSend || sendMutation.isPending}
          className="btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sendMutation.isPending ? 'Enviando…' : 'Enviar recordatorio'}
        </button>
      </div>
    </>
  );
}

export default function ReminderComposeModal({
  studentId,
  studentName,
  onClose,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['reminder-draft', studentId],
    queryFn: () => remindersService.getStudentDraft(studentId),
    staleTime: 0,
  });

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
      aria-label={`Enviar recordatorio a ${studentName}`}
    >
      <div
        className="relative w-full max-w-2xl my-8 bg-parchment rounded-2xl border border-chocolate-100/30 shadow-warm-lg overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-chocolate-100/20 bg-cream/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-chocolate-50 text-chocolate flex items-center justify-center shrink-0">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ink leading-tight">Enviar recordatorio</h2>
              <p className="text-xs text-ink-light truncate">Un mensaje cálido para acompañar a {studentName}</p>
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

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-ink-light">
            <Loader2 className="w-6 h-6 animate-spin mb-3 text-chocolate" />
            <p className="text-sm">Preparando el mensaje…</p>
          </div>
        ) : error || !data ? (
          <div className="py-12 text-center text-sm text-ink-light">
            No se pudo preparar el recordatorio. Intentá de nuevo.
          </div>
        ) : !data.canSend ? (
          <div className="py-12 px-6 text-center">
            <Sparkles className="w-8 h-8 text-gold mx-auto mb-3" />
            <p className="font-display text-lg font-bold text-ink">¡{studentName.split(' ')[0]} está al día!</p>
            <p className="text-sm text-ink-light mt-1">
              No tiene cursos en progreso, así que no hay nada que recordarle por ahora.
            </p>
            <button onClick={onClose} className="btn-secondary btn-md mt-6">Cerrar</button>
          </div>
        ) : (
          <ComposeForm
            studentId={studentId}
            studentName={studentName}
            data={data}
            onClose={onClose}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
