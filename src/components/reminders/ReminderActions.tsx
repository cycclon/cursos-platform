import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bell, History, ChevronDown, CheckCircle2, AlertTriangle,
  Mail, Send, Users,
} from 'lucide-react';
import { remindersService } from '@/services/reminders';
import type { Reminder } from '@/types';
import ReminderComposeModal from './ReminderComposeModal';

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function StatusBadge({ status }: { status: Reminder['status'] }) {
  const map = {
    sent: { label: 'Enviado', cls: 'bg-success-light text-success', Icon: CheckCircle2 },
    logged: { label: 'Registrado', cls: 'bg-gold/10 text-gold-dark', Icon: AlertTriangle },
    failed: { label: 'Falló', cls: 'bg-error-light text-error', Icon: AlertTriangle },
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${map.cls}`}
      title={status === 'logged' ? 'Registrado, pero el correo no se envió (SMTP no configurado).' : undefined}
    >
      <map.Icon className="w-3 h-3" /> {map.label}
    </span>
  );
}

export default function ReminderActions({
  studentId,
  studentName,
  canUse,
}: {
  studentId: string;
  studentName: string;
  canUse: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);

  const { data: log = [] } = useQuery({
    queryKey: ['reminder-log', studentId],
    queryFn: () => remindersService.getStudentLog(studentId),
  });

  const last = log[0];

  return (
    <div className="mt-6 pt-5 border-t border-chocolate-100/20">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={!canUse}
          title={
            canUse
              ? 'Enviar un recordatorio cálido a este estudiante'
              : 'Solo los docentes pueden enviar recordatorios. Como administrador podés ver el historial.'
          }
          className="btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Bell className="w-4 h-4" /> Enviar recordatorio
        </button>

        <button
          type="button"
          onClick={() => setShowLog((v) => !v)}
          className="btn-ghost btn-md"
        >
          <History className="w-4 h-4" /> Historial
          {log.length > 0 && (
            <span className="ml-1 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-chocolate-50 text-chocolate">
              {log.length}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showLog ? 'rotate-180' : ''}`} />
        </button>

        {last && (
          <span className="text-xs text-ink-light">
            Último: <span className="font-medium text-ink">{fmtDateTime(last.sentAt)}</span>
          </span>
        )}
        {!canUse && (
          <span className="text-xs text-ink-light/70">Vista de administrador (solo lectura).</span>
        )}
      </div>

      {showLog && (
        <div className="mt-4 rounded-xl border border-chocolate-100/20 bg-cream/40 overflow-hidden">
          {log.length === 0 ? (
            <p className="text-sm text-ink-light text-center py-8">
              Todavía no se le enviaron recordatorios a este estudiante.
            </p>
          ) : (
            <ul className="divide-y divide-chocolate-100/20">
              {log.map((r) => {
                const isOpen = openRow === r.id;
                return (
                  <li key={r.id}>
                    <button
                      onClick={() => setOpenRow(isOpen ? null : r.id)}
                      className="w-full text-left px-4 py-3 hover:bg-chocolate-50/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-ink-light/60 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink truncate">{r.subject}</p>
                          <p className="text-xs text-ink-light mt-0.5">
                            {fmtDateTime(r.sentAt)} · {r.teacherName}
                          </p>
                        </div>
                        <span
                          className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-chocolate-50 text-chocolate"
                          title={r.source === 'mass' ? 'Envío masivo' : 'Envío individual'}
                        >
                          {r.source === 'mass' ? <Users className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                          {r.source === 'mass' ? 'Masivo' : 'Individual'}
                        </span>
                        <StatusBadge status={r.status} />
                        <ChevronDown
                          className={`w-4 h-4 text-ink-light/50 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1">
                        {r.courses.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {r.courses.map((c) => (
                              <span
                                key={c.courseId}
                                className="text-[11px] px-2 py-0.5 rounded-full bg-parchment border border-chocolate-100/30 text-ink-light"
                              >
                                {c.title} · {c.progress}%
                              </span>
                            ))}
                          </div>
                        )}
                        <pre className="text-xs text-ink-light whitespace-pre-wrap font-sans bg-parchment border border-chocolate-100/20 rounded-lg p-3 leading-relaxed">
{r.body}
{r.signature ? `\n${r.signature}` : ''}
                        </pre>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {modalOpen && (
        <ReminderComposeModal
          studentId={studentId}
          studentName={studentName}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}
