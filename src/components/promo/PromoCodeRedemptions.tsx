import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Download, Loader2, CreditCard, Check, Inbox } from 'lucide-react';
import { promoCodesService } from '@/services/promoCodes';
import { useToast } from '@/context/ToastContext';
import { formatPrice } from '@/utils/format';
import { buildCsv, datedFilename, downloadCsv } from '@/utils/csv';
import { ApiError } from '@/services/api';
import type { PromoCode, PromoRedemption } from '@/types';

const TYPE_LABEL: Record<PromoRedemption['type'], string> = {
  course: 'Curso',
  workshop: 'Taller',
  bundle: 'Combo',
};

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  promo: PromoCode;
  onClose: () => void;
  /** Called after a settle so the parent list can refresh its rollups. */
  onSettled: () => void;
}

export default function PromoCodeRedemptions({ promo, onClose, onSettled }: Props) {
  const toast = useToast();
  const [settling, setSettling] = useState(false);
  const [confirmSettle, setConfirmSettle] = useState(false);

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['promo-codes', promo.id, 'redemptions'],
    queryFn: () => promoCodesService.redemptions(promo.id),
  });

  const pendingArs = rows
    .filter((r) => !r.commissionPaidAt && r.currency !== 'USD')
    .reduce((sum, r) => sum + r.commissionAmount, 0);
  const pendingUsd = rows
    .filter((r) => !r.commissionPaidAt && r.currency === 'USD')
    .reduce((sum, r) => sum + r.commissionAmount, 0);
  const hasPending = pendingArs > 0 || pendingUsd > 0;

  const handleSettle = async () => {
    if (!confirmSettle) {
      setConfirmSettle(true);
      return;
    }
    setSettling(true);
    try {
      const result = await promoCodesService.settle(promo.id);
      await refetch();
      onSettled();
      setConfirmSettle(false);
      toast.success(`${result.settled} venta(s) marcadas como liquidadas.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo registrar el pago.');
    } finally {
      setSettling(false);
    }
  };

  const handleExport = () => {
    const csv = buildCsv(
      ['Fecha', 'Tipo', 'Artículo', 'Estudiante', 'Email', 'Precio lista', 'Descuento', 'Cobrado', 'Comisión', 'Moneda', 'Comisión pagada'],
      rows.map((r) => [
        formatDateTime(r.paidAt),
        TYPE_LABEL[r.type],
        r.item?.title ?? '—',
        r.student?.name ?? '—',
        r.student?.email ?? '—',
        String(r.listAmount),
        String(r.discountAmount),
        String(r.amount),
        String(r.commissionAmount),
        r.currency,
        r.commissionPaidAt ? formatDateTime(r.commissionPaidAt) : '',
      ]),
    );
    downloadCsv(datedFilename(`usos-${promo.code.toLowerCase()}`), csv);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-sm animate-fade-in"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Usos del código ${promo.code}`}
    >
      <div
        className="relative w-full sm:max-w-4xl h-[100dvh] sm:h-auto sm:my-8 sm:max-h-[90vh] bg-surface-raised sm:rounded-2xl border border-primary-100/30 shadow-warm-lg overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-primary-100/20">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold tracking-wider text-ink">{promo.code}</span>
              <span className="text-xs text-ink-light">· {promo.discountPercent}% de descuento</span>
            </div>
            <p className="text-xs text-ink-light mt-0.5">
              {promo.uses} uso(s)
              {promo.kind === 'referral' && promo.payeeName && (
                <> · comisión del {promo.commissionPercent}% para {promo.payeeName}</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-ink-light hover:text-ink hover:bg-primary-50 transition-colors shrink-0"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-12 rounded-lg bg-surface-alt animate-pulse" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-10 h-10 text-ink-light/30 mx-auto mb-3" />
              <p className="text-sm text-ink-light">Este código todavía no se usó.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-100/20">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-ink-light uppercase tracking-wider">Fecha</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-ink-light uppercase tracking-wider">Estudiante</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-ink-light uppercase tracking-wider">Artículo</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-ink-light uppercase tracking-wider">Cobrado</th>
                    {promo.kind === 'referral' && (
                      <th className="text-right px-3 py-2 text-xs font-semibold text-ink-light uppercase tracking-wider">Comisión</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-primary-100/10 hover:bg-surface-alt/30 transition-colors">
                      <td className="px-3 py-2.5 text-ink-light whitespace-nowrap">{formatDateTime(r.paidAt)}</td>
                      <td className="px-3 py-2.5">
                        <span className="block text-ink font-medium truncate max-w-[16ch]">{r.student?.name ?? '—'}</span>
                        <span className="block text-[11px] text-ink-light truncate max-w-[22ch]">{r.student?.email ?? ''}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="block text-ink truncate max-w-[22ch]">{r.item?.title ?? '—'}</span>
                        <span className="block text-[11px] text-ink-light">{TYPE_LABEL[r.type]}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <span className="block font-semibold text-ink tabular-nums">
                          {r.amount === 0 ? 'Sin cargo' : formatPrice(r.amount, r.currency)}
                        </span>
                        {r.discountAmount > 0 && (
                          <span className="block text-[11px] text-ink-light line-through tabular-nums">
                            {formatPrice(r.listAmount, r.currency)}
                          </span>
                        )}
                      </td>
                      {promo.kind === 'referral' && (
                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                          <span className="block font-semibold text-ink tabular-nums">
                            {formatPrice(r.commissionAmount, r.currency)}
                          </span>
                          <span
                            className={`block text-[11px] ${r.commissionPaidAt ? 'text-success' : 'text-highlight-dark'}`}
                          >
                            {r.commissionPaidAt ? 'Pagada' : 'Pendiente'}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-primary-100/20 bg-surface-alt/30">
          {promo.kind === 'referral' && (
            <div className="text-sm mr-auto">
              <span className="text-ink-light">Pendiente de pago: </span>
              <strong className={hasPending ? 'text-highlight-dark' : 'text-ink'}>
                {formatPrice(pendingArs)}
              </strong>
              {pendingUsd > 0 && <strong className="text-highlight-dark"> · {formatPrice(pendingUsd, 'USD')}</strong>}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            Exportar CSV
          </button>

          {promo.kind === 'referral' && (
            <button
              onClick={handleSettle}
              disabled={settling || !hasPending}
              className={`inline-flex items-center gap-1.5 btn-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed ${
                confirmSettle ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {settling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : confirmSettle ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              {confirmSettle ? 'Confirmar liquidación' : 'Marcar comisión como pagada'}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
