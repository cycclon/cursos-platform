import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt, Search, ArrowUpDown, ArrowDown, ArrowUp,
  Download, Copy, Check, Users, DollarSign, ShoppingBag, TrendingUp,
  CalendarDays, ExternalLink,
} from 'lucide-react';
import { statisticsService } from '@/services/statistics';
import { formatPrice } from '@/utils/format';
import { useToast } from '@/context/ToastContext';
import type { SaleDetail, ResourceStatType } from '@/types';

type SortKey = 'date' | 'amount' | 'buyer' | 'item';
type SortDir = 'asc' | 'desc';
type TypeFilter = 'all' | ResourceStatType;

const TYPE_LABEL: Record<ResourceStatType, string> = {
  course: 'Curso',
  workshop: 'Taller',
  bundle: 'Combo',
};

const TYPE_PILL: Record<ResourceStatType, string> = {
  course: 'bg-chocolate-50 text-chocolate ring-1 ring-chocolate-100/40',
  workshop: 'bg-gold/10 text-gold-dark ring-1 ring-gold/30',
  bundle: 'bg-success-light text-success ring-1 ring-success/30',
};

function formatDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '—', time: '' };
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
  };
}

function toCSV(rows: SaleDetail[]): string {
  const header = ['Fecha', 'Hora', 'Tipo', 'Artículo', 'Comprador', 'Email', 'Monto (ARS)', 'ID Mercado Pago'];
  const escape = (v: string) => {
    if (v.includes(',') || v.includes('"') || v.includes('\n')) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const lines = rows.map((r) => {
    const { date, time } = formatDateTime(r.paidAt || r.createdAt);
    return [
      date,
      time,
      TYPE_LABEL[r.type],
      r.item?.title ?? '—',
      r.student?.name ?? '—',
      r.student?.email ?? '—',
      String(r.amount),
      r.mercadoPagoId ?? '',
    ].map(escape).join(',');
  });
  return [header.join(','), ...lines].join('\n');
}

function downloadCSV(filename: string, content: string) {
  const blob = new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function SalesDetail() {
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [itemFilter, setItemFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['statistics', 'sales-detail'],
    queryFn: statisticsService.getSalesDetail,
  });

  const itemOptions = useMemo(() => {
    const map = new Map<string, { id: string; title: string; type: ResourceStatType }>();
    for (const s of sales) {
      if (s.item) {
        const key = `${s.type}:${s.item.id}`;
        if (!map.has(key)) {
          map.set(key, { id: key, title: s.item.title, type: s.type });
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.title.localeCompare(b.title, 'es'));
  }, [sales]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      if (typeFilter !== 'all' && s.type !== typeFilter) return false;
      if (itemFilter !== 'all') {
        const key = s.item ? `${s.type}:${s.item.id}` : '';
        if (key !== itemFilter) return false;
      }
      if (!q) return true;
      const hay = [
        s.student?.name,
        s.student?.email,
        s.item?.title,
        s.mercadoPagoId,
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }, [sales, search, typeFilter, itemFilter]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      switch (sortKey) {
        case 'date': {
          const av = a.paidAt || a.createdAt || '';
          const bv = b.paidAt || b.createdAt || '';
          return av.localeCompare(bv) * dir;
        }
        case 'amount':
          return (a.amount - b.amount) * dir;
        case 'buyer':
          return (a.student?.name ?? '').localeCompare(b.student?.name ?? '', 'es') * dir;
        case 'item':
          return (a.item?.title ?? '').localeCompare(b.item?.title ?? '', 'es') * dir;
      }
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totals = useMemo(() => {
    const revenue = filtered.reduce((s, x) => s + x.amount, 0);
    const buyers = new Set(filtered.map((x) => x.student?.id).filter(Boolean)).size;
    const count = filtered.length;
    const avg = count > 0 ? revenue / count : 0;
    return { revenue, buyers, count, avg };
  }, [filtered]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'date' || key === 'amount' ? 'desc' : 'asc');
    }
  };

  const handleCopy = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 1500);
    } catch {
      toast.error('No se pudo copiar el ID.');
    }
  };

  const handleExport = () => {
    if (sorted.length === 0) {
      toast.error('No hay ventas para exportar.');
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCSV(`ventas-${stamp}.csv`, toCSV(sorted));
    toast.success('Archivo descargado.');
  };

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-chocolate" />
      : <ArrowDown className="w-3 h-3 text-chocolate" />;
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-4 bg-parchment rounded animate-pulse w-32" />
          <div className="h-8 bg-parchment rounded animate-pulse w-60 mt-2" />
          <div className="h-4 bg-parchment rounded animate-pulse w-72 mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 bg-parchment rounded-xl border border-chocolate-100/20 animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-parchment rounded-xl border border-chocolate-100/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Receipt className="w-4 h-4 text-gold" />
          <span className="text-[11px] font-bold text-gold uppercase tracking-[0.18em]">Registro</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Detalle de Ventas</h1>
        <p className="text-ink-light mt-1">
          Quién compró cada curso, taller o combo — con monto, fecha y referencia de pago.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: DollarSign, label: 'Ingresos filtrados', value: formatPrice(totals.revenue), color: 'text-chocolate bg-chocolate-50' },
          { icon: ShoppingBag, label: 'Transacciones', value: totals.count.toLocaleString('es-AR'), color: 'text-gold bg-gold/10' },
          { icon: Users, label: 'Compradores únicos', value: totals.buyers.toLocaleString('es-AR'), color: 'text-success bg-success-light' },
          { icon: TrendingUp, label: 'Ticket promedio', value: formatPrice(Math.round(totals.avg)), color: 'text-chocolate bg-chocolate-50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-ink leading-tight">{s.value}</p>
              <p className="text-xs text-ink-light mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm p-4 mb-5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/60 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por comprador, email, artículo o ID de Mercado Pago…"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-chocolate-100/40 bg-cream-dark/30 text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all"
            />
          </div>

          {/* Type chips */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-cream-dark/40 border border-chocolate-100/20 shrink-0">
            {([
              { key: 'all', label: 'Todo' },
              { key: 'course', label: 'Cursos' },
              { key: 'workshop', label: 'Talleres' },
              { key: 'bundle', label: 'Combos' },
            ] as { key: TypeFilter; label: string }[]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setTypeFilter(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  typeFilter === opt.key
                    ? 'bg-chocolate text-cream shadow-sm'
                    : 'text-ink-light hover:text-chocolate hover:bg-chocolate-50/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Item dropdown */}
          <select
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-chocolate-100/40 bg-cream-dark/30 text-sm text-ink focus:outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/10 transition-all min-w-[180px]"
          >
            <option value="all">Todos los artículos</option>
            {itemOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {TYPE_LABEL[opt.type]} · {opt.title}
              </option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-chocolate text-cream hover:bg-chocolate/90 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Sales table */}
      <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-cream-dark/60 flex items-center justify-center mx-auto mb-3">
              <Receipt className="w-5 h-5 text-ink-light/60" />
            </div>
            <p className="text-sm font-semibold text-ink">Sin ventas que coincidan</p>
            <p className="text-xs text-ink-light mt-1">
              {sales.length === 0
                ? 'Cuando un alumno compre un curso, taller o combo, aparecerá aquí.'
                : 'Ajustá la búsqueda o los filtros para ver más resultados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-chocolate-100/20 bg-cream-dark/20">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-ink-light uppercase tracking-wider">
                    <button onClick={() => handleSort('date')} className="inline-flex items-center gap-1.5 hover:text-chocolate transition-colors">
                      <CalendarDays className="w-3 h-3" />
                      Fecha
                      <SortIcon k="date" />
                    </button>
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-ink-light uppercase tracking-wider">
                    <button onClick={() => handleSort('buyer')} className="inline-flex items-center gap-1.5 hover:text-chocolate transition-colors">
                      Comprador
                      <SortIcon k="buyer" />
                    </button>
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-ink-light uppercase tracking-wider">Tipo</th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-ink-light uppercase tracking-wider">
                    <button onClick={() => handleSort('item')} className="inline-flex items-center gap-1.5 hover:text-chocolate transition-colors">
                      Artículo
                      <SortIcon k="item" />
                    </button>
                  </th>
                  <th className="text-right px-5 py-3 text-[11px] font-semibold text-ink-light uppercase tracking-wider">
                    <button onClick={() => handleSort('amount')} className="inline-flex items-center gap-1.5 hover:text-chocolate transition-colors ml-auto">
                      Monto
                      <SortIcon k="amount" />
                    </button>
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold text-ink-light uppercase tracking-wider">ID Mercado Pago</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => {
                  const { date, time } = formatDateTime(s.paidAt || s.createdAt);
                  const initials = (s.student?.name ?? '?')
                    .split(' ')
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-chocolate-100/10 last:border-0 hover:bg-cream-dark/30 transition-colors"
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-ink whitespace-nowrap">{date}</div>
                        <div className="text-[11px] text-ink-light mt-0.5">{time}</div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-3 min-w-0">
                          {s.student?.avatar ? (
                            <img
                              src={s.student.avatar}
                              alt={s.student.name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-cream-dark/60 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-chocolate to-chocolate-light text-cream text-xs font-bold flex items-center justify-center shrink-0">
                              {initials || '?'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-ink truncate">{s.student?.name ?? '—'}</div>
                            <div className="text-[11px] text-ink-light truncate">{s.student?.email ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${TYPE_PILL[s.type]}`}>
                          {TYPE_LABEL[s.type]}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-medium text-ink max-w-xs truncate" title={s.item?.title ?? ''}>
                          {s.item?.title ?? <span className="text-ink-light italic">Artículo eliminado</span>}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <span className="font-display text-base font-bold text-ink tabular-nums">
                          {formatPrice(s.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        {s.mercadoPagoId ? (
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 rounded-md bg-cream-dark/60 border border-chocolate-100/20 text-[11px] font-mono text-ink-light">
                              {s.mercadoPagoId}
                            </code>
                            <button
                              onClick={() => handleCopy(s.mercadoPagoId!)}
                              className="text-ink-light/70 hover:text-chocolate transition-colors"
                              title="Copiar ID"
                            >
                              {copiedId === s.mercadoPagoId
                                ? <Check className="w-3.5 h-3.5 text-success" />
                                : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <a
                              href={`https://www.mercadopago.com.ar/activities/detail/${s.mercadoPagoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ink-light/70 hover:text-chocolate transition-colors"
                              title="Ver en Mercado Pago"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-ink-light/60 italic">Sin referencia</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-chocolate-100/30 bg-cream-dark/30">
                  <td colSpan={4} className="px-5 py-3 font-bold text-ink">
                    {sorted.length} {sorted.length === 1 ? 'venta' : 'ventas'}
                  </td>
                  <td className="px-5 py-3 text-right font-display font-bold text-ink tabular-nums">
                    {formatPrice(totals.revenue)}
                  </td>
                  <td className="px-5 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
