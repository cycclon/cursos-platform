import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ticket, Plus, Edit3, Trash2, Check, X, Link2, Megaphone, Gift,
  Power, BarChart3, CreditCard, Loader2, Sparkles, AlertCircle,
} from 'lucide-react';
import { promoCodesService, type PromoCodeInput } from '@/services/promoCodes';
import { coursesService } from '@/services/courses';
import { bundlesService } from '@/services/bundles';
import { workshopsService } from '@/services/workshops';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/utils/format';
import { ApiError } from '@/services/api';
import PromoCodeRedemptions from '@/components/promo/PromoCodeRedemptions';
import type { PromoCode, PromoCodeKind } from '@/types';

const INPUT =
  'w-full px-4 py-2.5 rounded-xl border border-border bg-surface-raised text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all';

type StatusFilter = 'all' | 'active' | 'inactive';
type KindFilter = 'all' | PromoCodeKind;

interface FormState {
  code: string;
  kind: PromoCodeKind;
  discountPercent: number;
  label: string;
  payeeName: string;
  payeeEmail: string;
  commissionPercent: number;
  maxUses: string;
  expiresAt: string;
  oncePerStudent: boolean;
  scope: 'all' | 'selected';
  courseIds: string[];
  bundleIds: string[];
  workshopIds: string[];
}

const emptyForm: FormState = {
  code: '',
  kind: 'promo',
  discountPercent: 100,
  label: '',
  payeeName: '',
  payeeEmail: '',
  commissionPercent: 5,
  maxUses: '',
  expiresAt: '',
  oncePerStudent: true,
  scope: 'all',
  courseIds: [],
  bundleIds: [],
  workshopIds: [],
};

/** ISO → the value a native `datetime-local` input expects, in local time. */
function toLocalDatetimeInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatShortDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PromoCodeManager() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { role } = useAuth();
  const basePath = role === 'superuser' ? '/superusuario' : '/admin';

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['promo-codes'],
    queryFn: promoCodesService.list,
  });

  // Only needed by the scope picker, so they load alongside but never block.
  const { data: courses = [] } = useQuery({ queryKey: ['courses'], queryFn: coursesService.getCourses });
  const { data: bundles = [] } = useQuery({ queryKey: ['bundles'], queryFn: bundlesService.getBundles });
  const { data: workshops = [] } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => workshopsService.getWorkshops(),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<PromoCode | null>(null);

  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const visible = useMemo(
    () =>
      codes.filter((c) => {
        if (kindFilter !== 'all' && c.kind !== kindFilter) return false;
        const usable = c.active && !c.expired && !c.exhausted;
        if (statusFilter === 'active') return usable;
        if (statusFilter === 'inactive') return !usable;
        return true;
      }),
    [codes, kindFilter, statusFilter],
  );

  /* ── Form actions ─────────────────────────────────── */

  const handleCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setIsEditing(true);
  };

  const handleEdit = (c: PromoCode) => {
    setEditing(c);
    setFormData({
      code: c.code,
      kind: c.kind,
      discountPercent: c.discountPercent,
      label: c.label ?? '',
      payeeName: c.payeeName ?? '',
      payeeEmail: c.payeeEmail ?? '',
      commissionPercent: c.commissionPercent ?? 5,
      maxUses: c.maxUses == null ? '' : String(c.maxUses),
      expiresAt: toLocalDatetimeInput(c.expiresAt),
      oncePerStudent: c.oncePerStudent,
      scope: c.scope,
      courseIds: c.courseIds,
      bundleIds: c.bundleIds,
      workshopIds: c.workshopIds,
    });
    setIsEditing(true);
  };

  const handleSuggestCode = async () => {
    try {
      const { code } = await promoCodesService.suggestCode();
      setFormData((prev) => ({ ...prev, code }));
    } catch {
      toast.error('No se pudo generar un código.');
    }
  };

  const buildPayload = (): PromoCodeInput => ({
    code: formData.code.trim().toUpperCase(),
    kind: formData.kind,
    discountPercent: formData.discountPercent,
    label: formData.label.trim() || null,
    payeeName: formData.kind === 'referral' ? formData.payeeName.trim() || null : null,
    payeeEmail: formData.kind === 'referral' ? formData.payeeEmail.trim() || null : null,
    commissionPercent: formData.kind === 'referral' ? formData.commissionPercent : null,
    maxUses: formData.maxUses.trim() === '' ? null : Number(formData.maxUses),
    expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    oncePerStudent: formData.oncePerStudent,
    scope: formData.scope,
    courseIds: formData.scope === 'selected' ? formData.courseIds : [],
    bundleIds: formData.scope === 'selected' ? formData.bundleIds : [],
    workshopIds: formData.scope === 'selected' ? formData.workshopIds : [],
  });

  const validationError = (): string | null => {
    if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(formData.code.trim().toUpperCase())) {
      return 'El código debe tener entre 3 y 24 caracteres: letras, números o guiones.';
    }
    if (formData.discountPercent < 1 || formData.discountPercent > 100) {
      return 'El descuento debe estar entre 1% y 100%.';
    }
    if (formData.kind === 'referral' && !formData.payeeName.trim()) {
      return 'Indicá a quién le corresponde la comisión.';
    }
    if (
      formData.scope === 'selected' &&
      formData.courseIds.length + formData.bundleIds.length + formData.workshopIds.length === 0
    ) {
      return 'Elegí al menos un curso, combo o taller.';
    }
    return null;
  };

  const handleSave = async () => {
    const problem = validationError();
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await promoCodesService.update(editing.id, buildPayload());
        toast.success('Código actualizado.');
      } else {
        await promoCodesService.create(buildPayload());
        toast.success('Código creado.');
      }
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      setIsEditing(false);
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo guardar el código.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Row actions ──────────────────────────────────── */

  const handleToggleActive = async (c: PromoCode) => {
    setBusyId(c.id);
    try {
      await promoCodesService.update(c.id, { active: !c.active });
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      toast.success(c.active ? 'Código desactivado.' : 'Código activado.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo cambiar el estado.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (c: PromoCode) => {
    if (confirmDelete !== c.id) {
      setConfirmDelete(c.id);
      return;
    }
    setBusyId(c.id);
    try {
      await promoCodesService.remove(c.id);
      queryClient.invalidateQueries({ queryKey: ['promo-codes'] });
      setConfirmDelete(null);
      toast.success('Código eliminado.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo eliminar el código.');
    } finally {
      setBusyId(null);
    }
  };

  const handleCopyLink = async (c: PromoCode) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/canjear/${c.code}`);
      setCopiedId(c.id);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch {
      toast.error('No se pudo copiar el enlace.');
    }
  };

  /* ── Loading ──────────────────────────────────────── */
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-surface-raised rounded animate-pulse w-56" />
            <div className="h-4 bg-surface-raised rounded animate-pulse w-80 mt-2" />
          </div>
          <div className="h-10 w-36 bg-surface-raised rounded-xl animate-pulse" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-surface-raised rounded-xl p-5 border border-primary-100/20 h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Form view ────────────────────────────────────── */
  if (isEditing) {
    const isReferral = formData.kind === 'referral';
    // Worked example so the numbers are concrete before anything is saved.
    const sample = 100000;
    const charged = Math.round(sample * (1 - formData.discountPercent / 100));
    const commission = Math.round((charged * formData.commissionPercent) / 100);

    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
            {editing ? 'Editar código' : 'Nuevo código'}
          </h1>
          <p className="text-ink-light mt-1">
            {isReferral
              ? 'Un código con descuento para los seguidores de un referente, y comisión para él.'
              : 'Un código de descuento para entregar en mano.'}
          </p>
        </div>

        <div className="bg-surface-raised rounded-xl border border-primary-100/20 shadow-warm p-6 space-y-6">
          {/* Kind */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Tipo de código</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {([
                { value: 'promo', icon: Gift, title: 'Promocional', hint: 'Acceso con descuento, sin comisión.' },
                { value: 'referral', icon: Megaphone, title: 'De referido', hint: 'Descuento + comisión para un referente.' },
              ] as const).map((opt) => {
                const Icon = opt.icon;
                const on = formData.kind === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, kind: opt.value })}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                      on
                        ? 'border-primary/40 bg-primary-50 ring-2 ring-primary/10'
                        : 'border-border hover:border-primary/30 hover:bg-primary-50/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${on ? 'text-primary' : 'text-ink-light'}`} />
                    <span>
                      <span className={`block text-sm font-semibold ${on ? 'text-primary' : 'text-ink'}`}>{opt.title}</span>
                      <span className="block text-xs text-ink-light mt-0.5">{opt.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code + discount */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Código</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="MESSI-NOVA"
                  className={`${INPUT} font-mono tracking-wider`}
                />
                <button
                  type="button"
                  onClick={handleSuggestCode}
                  title="Generar un código al azar"
                  className="shrink-0 inline-flex items-center gap-1.5 btn-ghost btn-md rounded-xl"
                >
                  <Sparkles className="w-4 h-4" />
                  Generar
                </button>
              </div>
              <p className="text-[11px] text-ink-light/70 mt-1">
                Lo que el estudiante escribe al inscribirse. No distingue mayúsculas.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Descuento</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.discountPercent}
                    onChange={(e) => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                    className={`${INPUT} pr-8`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-light">%</span>
                </div>
                {[100, 50, 25].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormData({ ...formData, discountPercent: v })}
                    className={`px-2.5 rounded-xl text-xs font-semibold transition-colors ${
                      formData.discountPercent === v
                        ? 'bg-primary text-surface'
                        : 'bg-surface-alt text-ink-light hover:bg-primary-100/30'
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Referral payee */}
          {isReferral && (
            <div className="p-4 rounded-xl bg-surface-alt/50 space-y-4">
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Referente</label>
                  <input
                    type="text"
                    value={formData.payeeName}
                    onChange={(e) => setFormData({ ...formData, payeeName: e.target.value })}
                    placeholder="Lionel Messi"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Email (opcional)</label>
                  <input
                    type="email"
                    value={formData.payeeEmail}
                    onChange={(e) => setFormData({ ...formData, payeeEmail: e.target.value })}
                    placeholder="referente@email.com"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Comisión</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      value={formData.commissionPercent}
                      onChange={(e) => setFormData({ ...formData, commissionPercent: Number(e.target.value) })}
                      className={`${INPUT} pr-8`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-light">%</span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-ink-light/70">
                La comisión se calcula sobre el precio final cobrado, ya con el descuento aplicado.
              </p>
            </div>
          )}

          {/* Worked example */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-50 border border-primary-100/40">
            <BarChart3 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-ink-light">
              Un curso de <strong className="text-ink">{formatPrice(sample)}</strong> se cobra{' '}
              <strong className="text-ink">{charged === 0 ? 'sin cargo' : formatPrice(charged)}</strong>
              {isReferral && formData.payeeName.trim() && (
                <>
                  {' '}y {formData.payeeName.trim()} cobra <strong className="text-ink">{formatPrice(commission)}</strong>
                </>
              )}
              .
            </p>
          </div>

          {/* Limits */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Usos máximos</label>
              <input
                type="number"
                min={1}
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                placeholder="Ilimitado"
                className={INPUT}
              />
              <p className="text-[11px] text-ink-light/70 mt-1">Vacío = sin límite.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Vence el</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                className={INPUT}
              />
              <p className="text-[11px] text-ink-light/70 mt-1">Vacío = sin vencimiento.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Por estudiante</label>
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border cursor-pointer hover:bg-primary-50/40 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.oncePerStudent}
                  onChange={(e) => setFormData({ ...formData, oncePerStudent: e.target.checked })}
                  className="w-4 h-4 accent-[var(--color-primary)]"
                />
                <span className="text-sm text-ink">Un solo uso</span>
              </label>
            </div>
          </div>

          {/* Scope */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Alcance</label>
            <div className="flex gap-2 mb-3">
              {([
                { value: 'all', label: 'Todo el catálogo' },
                { value: 'selected', label: 'Solo estos ítems' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, scope: opt.value })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.scope === opt.value
                      ? 'bg-primary text-surface'
                      : 'bg-surface-alt text-ink-light hover:bg-primary-100/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {formData.scope === 'selected' && (
              <div className="space-y-4 p-4 rounded-xl bg-surface-alt/50 max-h-80 overflow-y-auto">
                {([
                  { title: 'Cursos', items: courses, key: 'courseIds' as const },
                  { title: 'Combos', items: bundles, key: 'bundleIds' as const },
                  { title: 'Talleres', items: workshops, key: 'workshopIds' as const },
                ]).map((group) =>
                  group.items.length === 0 ? null : (
                    <div key={group.key}>
                      <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-ink-light/70 mb-1.5">
                        {group.title}
                      </p>
                      <div className="space-y-1">
                        {group.items.map((item) => {
                          const checked = formData[group.key].includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-primary-50/60 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  setFormData({
                                    ...formData,
                                    [group.key]: checked
                                      ? formData[group.key].filter((id) => id !== item.id)
                                      : [...formData[group.key], item.id],
                                  })
                                }
                                className="w-4 h-4 accent-[var(--color-primary)]"
                              />
                              <span className="text-sm text-ink truncate">{item.title}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Internal label */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Nota interna (opcional)</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              placeholder="Ej: Para la Dra. Pérez — canje en el congreso de octubre"
              className={INPUT}
            />
            <p className="text-[11px] text-ink-light/70 mt-1">
              Solo la ves vos. Se usa como nombre por defecto en la tarjeta de regalo.
            </p>
          </div>

          <div className="flex gap-3 pt-4 border-t border-primary-100/20">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar
            </button>
            <button
              onClick={() => { setIsEditing(false); setEditing(null); }}
              className="inline-flex items-center gap-2 btn-ghost btn-md rounded-xl"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── List view ────────────────────────────────────── */
  const pendingArs = codes.reduce((sum, c) => sum + c.commissionPendingArs, 0);
  const pendingUsd = codes.reduce((sum, c) => sum + c.commissionPendingUsd, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Códigos</h1>
          <p className="text-ink-light mt-1">
            Descuentos para entregar en mano y códigos de referido con comisión.
          </p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
          <Plus className="w-4 h-4" />
          Nuevo código
        </button>
      </div>

      {(pendingArs > 0 || pendingUsd > 0) && (
        <div className="flex items-start gap-2 p-4 mb-6 rounded-xl bg-highlight/10 border border-highlight/30">
          <CreditCard className="w-4 h-4 text-highlight-dark shrink-0 mt-0.5" />
          <p className="text-sm text-ink">
            Comisiones pendientes de pago:{' '}
            <strong>{formatPrice(pendingArs)}</strong>
            {pendingUsd > 0 && <> y <strong>{formatPrice(pendingUsd, 'USD')}</strong></>}.{' '}
            <span className="text-ink-light">Abrí “Ver usos” en cada código para liquidarlas.</span>
          </p>
        </div>
      )}

      {codes.length === 0 ? (
        <div className="text-center py-16">
          <Ticket className="w-12 h-12 text-ink-light/30 mx-auto mb-4" />
          <p className="text-ink-light text-lg mb-2">Todavía no hay códigos.</p>
          <p className="text-sm text-ink-light/70 mb-5 max-w-md mx-auto">
            Creá uno del 100% para regalar un curso, o uno de referido para que alguien difunda la academia
            a cambio de una comisión.
          </p>
          <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
            <Plus className="w-4 h-4" />
            Crear el primer código
          </button>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            {([
              { value: 'all', label: 'Todos' },
              { value: 'promo', label: 'Promocionales' },
              { value: 'referral', label: 'De referido' },
            ] as const).map((f) => (
              <button
                key={f.value}
                onClick={() => setKindFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  kindFilter === f.value
                    ? 'bg-primary text-surface'
                    : 'bg-surface-alt text-ink-light hover:bg-primary-100/30'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="w-px h-5 bg-primary-100/40 mx-1" />
            {([
              { value: 'all', label: 'Todos los estados' },
              { value: 'active', label: 'Vigentes' },
              { value: 'inactive', label: 'Sin uso posible' },
            ] as const).map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  statusFilter === f.value
                    ? 'bg-primary text-surface'
                    : 'bg-surface-alt text-ink-light hover:bg-primary-100/30'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-ink-light">Ningún código coincide con ese filtro.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visible.map((c) => {
                const usable = c.active && !c.expired && !c.exhausted;
                const statusLabel = !c.active ? 'Desactivado' : c.expired ? 'Vencido' : c.exhausted ? 'Agotado' : 'Vigente';
                const pct = c.maxUses ? Math.min((c.uses / c.maxUses) * 100, 100) : 0;

                return (
                  <div
                    key={c.id}
                    className="bg-surface-raised rounded-xl border border-primary-100/20 shadow-warm overflow-hidden card-accent"
                  >
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        {/* Identity */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-lg font-bold tracking-wider text-ink">{c.code}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                c.kind === 'referral'
                                  ? 'bg-highlight/15 text-highlight-dark'
                                  : 'bg-primary-50 text-primary'
                              }`}
                            >
                              {c.kind === 'referral' ? 'Referido' : 'Promocional'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                usable ? 'bg-success-light text-success' : 'bg-surface-alt text-ink-light'
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                          <p className="text-sm text-ink-light mt-1.5">
                            <strong className="text-ink">{c.discountPercent}% de descuento</strong>
                            {c.kind === 'referral' && c.payeeName && (
                              <> · {c.payeeName} cobra {c.commissionPercent}%</>
                            )}
                            {' · '}
                            {c.scope === 'all'
                              ? 'todo el catálogo'
                              : `${c.courseIds.length + c.bundleIds.length + c.workshopIds.length} ítem(s)`}
                          </p>
                          {c.label && <p className="text-xs text-ink-light/70 mt-1 italic">{c.label}</p>}
                        </div>

                        {/* Usage */}
                        <div className="text-right shrink-0">
                          <p className="font-display text-xl font-bold text-ink tabular-nums">
                            {c.uses}
                            <span className="text-sm text-ink-light font-body font-normal">
                              {c.maxUses == null ? ' usos' : ` / ${c.maxUses}`}
                            </span>
                          </p>
                          {c.maxUses != null && (
                            <div className="w-24 h-1 rounded-full bg-surface-alt mt-1.5 ml-auto overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          )}
                          <p className="text-[11px] text-ink-light/70 mt-1.5">
                            {c.expiresAt ? `Vence ${formatShortDate(c.expiresAt)}` : 'Sin vencimiento'}
                          </p>
                        </div>
                      </div>

                      {/* Money */}
                      {c.uses > 0 && (
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 pt-3 border-t border-primary-100/15 text-xs">
                          <span className="text-ink-light">
                            Cobrado <strong className="text-ink">{formatPrice(c.netArs)}</strong>
                            {c.netUsd > 0 && <> · <strong className="text-ink">{formatPrice(c.netUsd, 'USD')}</strong></>}
                          </span>
                          <span className="text-ink-light">
                            Descontado <strong className="text-ink">{formatPrice(c.discountArs)}</strong>
                          </span>
                          {c.kind === 'referral' && (
                            <span className="text-ink-light">
                              Comisión pendiente{' '}
                              <strong className={c.commissionPendingArs > 0 ? 'text-highlight-dark' : 'text-ink'}>
                                {formatPrice(c.commissionPendingArs)}
                              </strong>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap items-center gap-2 mt-4">
                        <button onClick={() => handleEdit(c)} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button onClick={() => setViewing(c)} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                          <BarChart3 className="w-3.5 h-3.5" />
                          Ver usos
                        </button>
                        <button onClick={() => handleCopyLink(c)} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                          {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-success" /> : <Link2 className="w-3.5 h-3.5" />}
                          {copiedId === c.id ? 'Copiado' : 'Copiar enlace'}
                        </button>
                        {c.kind === 'promo' && (
                          <Link
                            to={`${basePath}/codigos/${c.id}/tarjeta`}
                            className="inline-flex items-center gap-1.5 btn-secondary btn-sm rounded-lg"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            Tarjeta
                          </Link>
                        )}
                        <button
                          onClick={() => handleToggleActive(c)}
                          disabled={busyId === c.id}
                          className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg disabled:opacity-50"
                        >
                          <Power className="w-3.5 h-3.5" />
                          {c.active ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={busyId === c.id}
                          className={`inline-flex items-center gap-1.5 btn-sm rounded-lg ml-auto disabled:opacity-50 ${
                            confirmDelete === c.id ? 'btn-danger' : 'btn-ghost'
                          }`}
                        >
                          {busyId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          {confirmDelete === c.id ? 'Confirmar' : 'Eliminar'}
                        </button>
                      </div>

                      {confirmDelete === c.id && (
                        <p className="flex items-center gap-1.5 text-[11px] text-error mt-2">
                          <AlertCircle className="w-3 h-3" />
                          Volvé a tocar Confirmar para eliminarlo. Si ya tuvo usos, desactivalo en su lugar.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {viewing && (
        <PromoCodeRedemptions
          promo={viewing}
          onClose={() => setViewing(null)}
          onSettled={() => queryClient.invalidateQueries({ queryKey: ['promo-codes'] })}
        />
      )}
    </div>
  );
}
