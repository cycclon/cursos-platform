import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bug, Lightbulb, HelpCircle, Search, Loader2, X, Send, Inbox,
  ExternalLink, ChevronLeft, ChevronRight, StickyNote, Clock, BellOff,
  Mail, RefreshCw, MapPin, Monitor, Image as ImageIcon, AlertCircle, CheckCircle2, Terminal,
} from 'lucide-react';
import { bugReportsService } from '@/services/bugReports';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/services/api';
import {
  BUG_TYPE_LABEL, BUG_STATUS_LABEL, BUG_STATUS_STYLE, BUG_STATUS_ORDER,
} from '@/utils/bugReports';
import type {
  BugReportListItem, BugReportDetail, BugReportStatus, BugReportType,
} from '@/types';

const TYPE_ICON: Record<BugReportType, typeof Bug> = {
  bug: Bug,
  suggestion: Lightbulb,
  question: HelpCircle,
};

const PAGE_SIZE = 20;

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'recién';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function StatusBadge({ status }: { status: BugReportStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${BUG_STATUS_STYLE[status]}`}>
      {BUG_STATUS_LABEL[status]}
    </span>
  );
}

export default function BugReports() {
  const toast = useToast();
  const [status, setStatus] = useState<BugReportStatus | undefined>(undefined);
  const [type, setType] = useState<BugReportType | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to first page whenever a filter changes.
  useEffect(() => { setPage(1); }, [status, type, debounced]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['bug-reports', { status, type, q: debounced, page }],
    queryFn: () => bugReportsService.list({ status, type, q: debounced || undefined, page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const counts = data?.counts ?? {};
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  const statusTabs: { key: BugReportStatus | 'all'; label: string }[] = [
    { key: 'all', label: 'Todos' },
    ...BUG_STATUS_ORDER.map((s) => ({ key: s, label: BUG_STATUS_LABEL[s] })),
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Bug className="w-5 h-5 text-error" />
          <span className="text-xs font-bold text-error uppercase tracking-wider">Soporte</span>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Reportes de estudiantes</h1>
            <p className="text-ink-light mt-1">Errores, sugerencias y consultas enviados desde la plataforma.</p>
          </div>
          <button
            onClick={() => refetch()}
            className="btn-secondary btn-sm shrink-0"
            disabled={isFetching}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-5">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {statusTabs.map((tab) => {
            const active = (tab.key === 'all' && !status) || tab.key === status;
            const count = tab.key === 'all' ? counts.all : counts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setStatus(tab.key === 'all' ? undefined : (tab.key as BugReportStatus))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-chocolate text-cream shadow-warm'
                    : 'bg-parchment text-ink-light border border-chocolate-100/30 hover:text-chocolate hover:border-chocolate-light/50'
                }`}
              >
                {tab.label}
                {count != null && count > 0 && (
                  <span className={`px-1.5 py-px rounded-full text-[10px] ${active ? 'bg-cream/25' : 'bg-chocolate-100/40 text-ink-light'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Type filter + search */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5">
            {(['bug', 'suggestion', 'question'] as BugReportType[]).map((t) => {
              const Icon = TYPE_ICON[t];
              const active = type === t;
              return (
                <button
                  key={t}
                  onClick={() => setType(active ? undefined : t)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    active
                      ? 'bg-chocolate-50 text-chocolate border-chocolate-light/50'
                      : 'bg-parchment text-ink-light border-chocolate-100/30 hover:text-chocolate'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {BUG_TYPE_LABEL[t]}
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 min-w-[180px] max-w-sm ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ticket, nombre, email…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-parchment border border-chocolate-100/40 text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/30"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-20 rounded-xl bg-parchment border border-chocolate-100/20 animate-pulse" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-16 bg-parchment rounded-xl border border-chocolate-100/20">
          <Inbox className="w-10 h-10 text-ink-light/40 mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-ink">Sin reportes por aquí</p>
          <p className="text-sm text-ink-light mt-1">
            {debounced || status || type
              ? 'No hay reportes que coincidan con los filtros.'
              : 'Cuando un estudiante envíe un reporte, va a aparecer acá.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((r) => (
            <ReportRow key={r.id} report={r} onClick={() => setSelectedId(r.id)} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.total > data.limit && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-xs text-ink-light">
            {(page - 1) * data.limit + 1}–{Math.min(page * data.limit, data.total)} de {data.total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary btn-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {selectedId && (
        <DetailModal id={selectedId} onClose={() => setSelectedId(null)} toastError={(m) => toast.error(m)} />
      )}
    </div>
  );
}

function ReportRow({ report, onClick }: { report: BugReportListItem; onClick: () => void }) {
  const Icon = TYPE_ICON[report.type];
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 p-3.5 rounded-xl bg-parchment border border-chocolate-100/20 hover:border-chocolate-light/40 hover:shadow-warm transition-all"
    >
      <div className="w-9 h-9 rounded-lg bg-chocolate-50 text-chocolate flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-xs font-bold text-chocolate">{report.ticketId}</span>
          <StatusBadge status={report.status} />
          {report.hasAttachment && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-ink-light/70">
              <ImageIcon className="w-3 h-3" /> imagen
            </span>
          )}
          {!report.notifyOnStatusChange && (
            <span title="El estudiante canceló las notificaciones" className="inline-flex items-center text-ink-light/60">
              <BellOff className="w-3 h-3" />
            </span>
          )}
        </div>
        <p className="text-sm text-ink mt-1 line-clamp-2">{report.message}</p>
        <p className="text-[11px] text-ink-light/80 mt-1 truncate">
          {report.reporter.name} · {report.pageLabel}
        </p>
      </div>
      <span className="text-[11px] text-ink-light/70 shrink-0 whitespace-nowrap">{timeAgo(report.createdAt)}</span>
    </button>
  );
}

/* ── Detail modal ───────────────────────────────────────────────────── */

function DetailModal({
  id,
  onClose,
  toastError,
}: {
  id: string;
  onClose: () => void;
  toastError: (m: string) => void;
}) {
  const qc = useQueryClient();

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['bug-report', id],
    queryFn: () => bugReportsService.get(id),
  });

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

  const onUpdated = (updated: BugReportDetail) => {
    qc.setQueryData(['bug-report', id], updated);
    qc.invalidateQueries({ queryKey: ['bug-reports'] });
    qc.invalidateQueries({ queryKey: ['bug-report-stats'] });
  };

  const Icon = report ? TYPE_ICON[report.type] : Bug;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full sm:max-w-3xl h-[100dvh] sm:h-auto sm:my-8 sm:max-h-[90vh] bg-parchment sm:rounded-2xl border border-chocolate-100/30 shadow-warm-lg overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-chocolate-100/30 bg-cream/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-chocolate text-cream flex items-center justify-center shrink-0">
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="font-mono text-sm font-bold text-chocolate">{report?.ticketId ?? '…'}</h2>
                {report && <StatusBadge status={report.status} />}
              </div>
              <p className="text-xs text-ink-light truncate">
                {report ? `${BUG_TYPE_LABEL[report.type]} · ${fmtDateTime(report.createdAt)}` : 'Cargando…'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ink-light hover:text-chocolate hover:bg-chocolate-50 transition-colors shrink-0" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-ink-light">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : error || !report ? (
          <div className="flex-1 flex items-center justify-center py-20 text-sm text-ink-light">
            No se pudo cargar el reporte.
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
            {/* Reporter */}
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-chocolate-100/40 flex items-center justify-center text-sm font-bold text-chocolate shrink-0">
                {report.reporter.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{report.reporter.name}</p>
                <p className="text-xs text-ink-light break-all">{report.reporter.email} · {report.reporter.role}</p>
                {!report.notifyOnStatusChange && (
                  <p className="inline-flex items-center gap-1 text-[11px] text-gold-dark mt-1">
                    <BellOff className="w-3 h-3" /> Canceló las notificaciones por email
                  </p>
                )}
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-semibold text-ink-light mb-1.5">Mensaje</p>
              <div className="rounded-xl bg-cream border border-chocolate-100/30 px-4 py-3 text-sm text-ink whitespace-pre-wrap leading-relaxed">
                {report.message}
              </div>
            </div>

            {/* Attachment */}
            {report.attachmentUrl && (
              <div>
                <p className="text-xs font-semibold text-ink-light mb-1.5">Captura adjunta</p>
                <a href={report.attachmentUrl} target="_blank" rel="noreferrer" className="block rounded-xl overflow-hidden border border-chocolate-100/30 group relative">
                  <img src={report.attachmentUrl} alt="Adjunto del reporte" className="w-full max-h-72 object-contain bg-ink/5" />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-ink/60 text-cream text-[10px] inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" /> Abrir
                  </span>
                </a>
              </div>
            )}

            {/* Context */}
            <ContextBlock report={report} />

            {/* Status management */}
            <StatusManager report={report} onUpdated={onUpdated} />

            {/* Internal notes */}
            <InternalNotes report={report} onUpdated={onUpdated} />

            {/* Personalized email */}
            <CustomEmail report={report} onUpdated={onUpdated} onError={toastError} />

            {/* Email history */}
            <EmailHistory report={report} />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function ContextBlock({ report }: { report: BugReportDetail }) {
  const c = report.context;
  const rows: [string, string | null][] = [
    ['Página', c.pageLabel],
    ['Encabezado visible', c.pageHeading],
    ['Dirección', c.url],
    ['Navegador', c.userAgent],
    ['Ventana', c.viewport],
    ['Pantalla', c.screen],
    ['Idioma', c.language],
    ['Vino de', c.referrer],
  ];
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-light mb-1.5">
        <Monitor className="w-3.5 h-3.5" /> Contexto técnico
      </p>
      <dl className="rounded-xl bg-cream/60 border border-chocolate-100/30 divide-y divide-chocolate-100/20 text-[12px]">
        {rows.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} className="flex gap-3 px-3.5 py-2">
            <dt className="shrink-0 w-32 font-medium text-ink-light/80 flex items-center gap-1">
              {label === 'Página' && <MapPin className="w-3 h-3" />}
              {label}
            </dt>
            <dd className="min-w-0 break-all text-ink-light font-mono">{value}</dd>
          </div>
        ))}
      </dl>

      {c.consoleLogs && (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-light mb-1.5">
            <Terminal className="w-3.5 h-3.5" /> Registros de consola
          </p>
          <pre className="max-h-64 overflow-auto rounded-xl bg-ink/90 text-cream/90 text-[11px] leading-relaxed p-3.5 whitespace-pre-wrap break-words font-mono border border-chocolate-100/30">
            {c.consoleLogs}
          </pre>
        </div>
      )}
    </div>
  );
}

function StatusManager({ report, onUpdated }: { report: BugReportDetail; onUpdated: (r: BugReportDetail) => void }) {
  const toast = useToast();
  const [next, setNext] = useState<BugReportStatus>(report.status);
  const [note, setNote] = useState('');

  useEffect(() => { setNext(report.status); }, [report.status]);

  const willEmail = next !== report.status && report.notifyOnStatusChange;

  const mutation = useMutation({
    mutationFn: () => bugReportsService.setStatus(report.id, { status: next, note: note.trim() || undefined }),
    onSuccess: (updated) => {
      onUpdated(updated);
      setNote('');
      const r = updated.emailResult;
      if (r === 'sent') toast.success('Estado actualizado. Avisamos al estudiante por email.');
      else if (r === 'logged') toast.success('Estado actualizado (email registrado; SMTP no configurado).');
      else if (r === 'failed') toast.warning('Estado actualizado, pero el email falló. Revisá el historial.');
      else toast.success('Estado actualizado.');
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No se pudo actualizar el estado.'),
  });

  const dirty = next !== report.status || note.trim().length > 0;

  return (
    <div className="rounded-xl border border-chocolate-100/30 bg-parchment p-4">
      <p className="text-xs font-semibold text-ink-light mb-2.5">Estado del reporte</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {BUG_STATUS_ORDER.map((s) => {
          const active = next === s;
          return (
            <button
              key={s}
              onClick={() => setNext(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                active ? BUG_STATUS_STYLE[s] + ' ring-2 ring-offset-1 ring-chocolate-light/40' : 'bg-cream text-ink-light border-chocolate-100/30 hover:text-chocolate'
              }`}
            >
              {BUG_STATUS_LABEL[s]}
            </button>
          );
        })}
      </div>

      <label className="block text-xs font-semibold text-ink-light mb-1.5">
        Mensaje para el estudiante <span className="font-normal opacity-70">(opcional, se incluye en el email)</span>
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Ej: ¡Gracias por avisar! Ya lo corregimos, probá de nuevo y contanos."
        className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-cream border border-chocolate-100/40 text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/30 resize-y"
      />

      <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">
        <p className="text-[11px] text-ink-light/80 flex items-center gap-1">
          {willEmail ? (
            <><Mail className="w-3.5 h-3.5 text-chocolate" /> Se enviará un email al estudiante.</>
          ) : next !== report.status && !report.notifyOnStatusChange ? (
            <><BellOff className="w-3.5 h-3.5" /> El estudiante canceló las notificaciones — no se enviará email.</>
          ) : (
            <span className="opacity-60">Cambiá el estado para notificar al estudiante.</span>
          )}
        </p>
        <button
          onClick={() => mutation.mutate()}
          disabled={!dirty || mutation.isPending}
          className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Guardar estado
        </button>
      </div>
    </div>
  );
}

function InternalNotes({ report, onUpdated }: { report: BugReportDetail; onUpdated: (r: BugReportDetail) => void }) {
  const toast = useToast();
  const [notes, setNotes] = useState(report.internalNotes);
  useEffect(() => { setNotes(report.internalNotes); }, [report.internalNotes]);

  const mutation = useMutation({
    mutationFn: () => bugReportsService.saveNotes(report.id, notes),
    onSuccess: (updated) => { onUpdated(updated); toast.success('Notas guardadas.'); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'No se pudieron guardar las notas.'),
  });

  return (
    <div className="rounded-xl border border-gold/30 bg-gold/5 p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-gold-dark mb-2">
        <StickyNote className="w-3.5 h-3.5" /> Notas internas <span className="font-normal text-ink-light/70">(solo vos las ves)</span>
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Anotaciones de triaje, causa raíz, a quién derivarlo…"
        className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-parchment border border-chocolate-100/40 text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/30 resize-y"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={notes === report.internalNotes || mutation.isPending}
          className="btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <StickyNote className="w-3.5 h-3.5" />}
          Guardar notas
        </button>
      </div>
    </div>
  );
}

function CustomEmail({
  report, onUpdated, onError,
}: {
  report: BugReportDetail;
  onUpdated: (r: BugReportDetail) => void;
  onError: (m: string) => void;
}) {
  const toast = useToast();
  const [subject, setSubject] = useState(`Sobre tu reporte ${report.ticketId}`);
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: () => bugReportsService.sendMessage(report.id, { subject: subject.trim(), body: body.trim() }),
    onSuccess: (updated) => {
      onUpdated(updated);
      setBody('');
      toast.success(`Correo enviado a ${report.reporter.name.split(' ')[0]}.`);
    },
    onError: (e) => onError(e instanceof ApiError ? e.message : 'No se pudo enviar el correo.'),
  });

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && !mutation.isPending;

  return (
    <div className="rounded-xl border border-chocolate-100/30 bg-parchment p-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-light mb-2.5">
        <Mail className="w-3.5 h-3.5" /> Enviar correo personalizado
      </p>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Asunto"
        className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-cream border border-chocolate-100/40 text-ink mb-2 focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/30"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder={`Hola ${report.reporter.name.split(' ')[0]}, …`}
        className="w-full px-3.5 py-2.5 text-sm rounded-lg bg-cream border border-chocolate-100/40 text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate-light focus:ring-2 focus:ring-chocolate-100/30 resize-y"
      />
      <div className="flex items-center justify-between gap-3 mt-2.5 flex-wrap">
        <p className="text-[11px] text-ink-light/70">El estudiante podrá responder directamente a este correo.</p>
        <button onClick={() => mutation.mutate()} disabled={!canSend} className="btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed">
          {mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Enviar correo
        </button>
      </div>
    </div>
  );
}

function EmailHistory({ report }: { report: BugReportDetail }) {
  if (report.emails.length === 0) return null;
  const KIND_LABEL: Record<string, string> = {
    ack: 'Confirmación',
    status_change: 'Cambio de estado',
    custom: 'Correo personalizado',
  };
  const STATUS_TEXT: Record<string, { label: string; cls: string }> = {
    sent: { label: 'enviado', cls: 'text-success' },
    logged: { label: 'registrado', cls: 'text-ink-light' },
    failed: { label: 'falló', cls: 'text-error' },
  };
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-ink-light mb-1.5">
        <Clock className="w-3.5 h-3.5" /> Historial de correos
      </p>
      <ul className="space-y-1.5">
        {[...report.emails].reverse().map((e, i) => {
          const st = STATUS_TEXT[e.status] ?? { label: e.status, cls: 'text-ink-light' };
          return (
            <li key={i} className="flex items-start gap-2 text-[12px] px-3 py-2 rounded-lg bg-cream/60 border border-chocolate-100/20">
              {e.status === 'failed' ? (
                <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
              ) : (
                <Mail className="w-3.5 h-3.5 text-ink-light/70 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-ink truncate">{e.subject}</p>
                <p className="text-ink-light/70">
                  {KIND_LABEL[e.kind] ?? e.kind} · <span className={st.cls}>{st.label}</span> · {fmtDateTime(e.at)}
                </p>
                {e.error && <p className="text-error/80 break-all">{e.error}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
