import { useState } from 'react';
import {
  DollarSign, Users, BookOpen, TrendingUp, Calculator,
  AlertCircle, Settings,
} from 'lucide-react';
import { salesData, courses, formatPrice } from '@/data/mock';

export default function SuperuserPanel() {
  const [feeType, setFeeType] = useState<'percentage' | 'fixed'>('percentage');
  const [feeValue, setFeeValue] = useState(10);

  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0);
  const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);

  const lastMonth = salesData[salesData.length - 1];

  const calculateFee = (revenue: number) => {
    if (feeType === 'percentage') return revenue * (feeValue / 100);
    return feeValue;
  };

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-error" />
          <span className="text-xs font-bold text-error uppercase tracking-wider">Superusuario</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Panel de Administración</h1>
        <p className="text-ink-light mt-1">Vista general de la plataforma y cálculo de comisiones.</p>
      </div>

      {/* Platform overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { icon: DollarSign, label: 'Ingresos totales', value: formatPrice(totalRevenue), sub: 'Acumulado anual' },
          { icon: TrendingUp, label: 'Ingresos último mes', value: formatPrice(lastMonth.revenue), sub: lastMonth.month },
          { icon: Users, label: 'Estudiantes totales', value: totalStudents.toString(), sub: 'Inscripciones activas' },
          { icon: BookOpen, label: 'Ventas totales', value: totalSales.toString(), sub: 'Transacciones completadas' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-error bg-error-light mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-ink">{stat.value}</p>
              <p className="text-xs text-ink-light mt-0.5">{stat.label}</p>
              <p className="text-[10px] text-ink-light/60 mt-1">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Fee calculator */}
      <div className="bg-parchment rounded-xl p-6 border-2 border-error/10 shadow-warm mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Calculator className="w-5 h-5 text-error" />
          <h2 className="font-display text-lg font-bold text-ink">Calculadora de Comisión</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Settings */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Tipo de comisión</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFeeType('percentage')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    feeType === 'percentage'
                      ? 'bg-error text-cream'
                      : 'bg-cream-dark text-ink-light hover:bg-chocolate-100/30'
                  }`}
                >
                  Porcentaje
                </button>
                <button
                  onClick={() => setFeeType('fixed')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    feeType === 'fixed'
                      ? 'bg-error text-cream'
                      : 'bg-cream-dark text-ink-light hover:bg-chocolate-100/30'
                  }`}
                >
                  Monto fijo
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                {feeType === 'percentage' ? 'Porcentaje (%)' : 'Monto fijo (ARS)'}
              </label>
              <input
                type="number"
                value={feeValue}
                onChange={e => setFeeValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink focus:outline-none focus:border-error/40 focus:ring-2 focus:ring-error/10 transition-all"
              />
            </div>
            <div className="bg-error-light rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-xs text-error">
                La comisión no se descuenta automáticamente de los pagos de Mercado Pago. Este cálculo es solo informativo para la facturación mensual.
              </p>
            </div>
          </div>

          {/* Results */}
          <div className="bg-cream-dark/50 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">Comisión estimada por mes</h3>
            <div className="space-y-2">
              {salesData.slice(-6).map(d => {
                const fee = calculateFee(d.revenue);
                return (
                  <div key={d.month} className="flex items-center justify-between py-2 border-b border-chocolate-100/10 last:border-0">
                    <span className="text-sm text-ink-light">{d.month}</span>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-ink">{formatPrice(fee)}</span>
                      <span className="text-[10px] text-ink-light ml-2">
                        de {formatPrice(d.revenue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-3 border-t-2 border-chocolate-100/20">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">Total últimos 6 meses</span>
                <span className="text-lg font-bold text-error">
                  {formatPrice(salesData.slice(-6).reduce((sum, d) => sum + calculateFee(d.revenue), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="font-display text-lg font-bold text-ink mb-1">Detalle mensual</h2>
          <p className="text-xs text-ink-light">Desglose completo de ventas, ingresos y comisiones.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-chocolate-100/20">
                <th className="text-left px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Mes</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Ventas</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Estudiantes</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Ingresos</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Comisión</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map(d => (
                <tr key={d.month} className="border-b border-chocolate-100/10 hover:bg-cream-dark/30 transition-colors">
                  <td className="px-6 py-3 font-medium text-ink">{d.month}</td>
                  <td className="px-6 py-3 text-right text-ink-light">{d.sales}</td>
                  <td className="px-6 py-3 text-right text-ink-light">{d.students}</td>
                  <td className="px-6 py-3 text-right font-semibold text-ink">{formatPrice(d.revenue)}</td>
                  <td className="px-6 py-3 text-right font-semibold text-error">{formatPrice(calculateFee(d.revenue))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-chocolate-100/30 bg-cream-dark/30">
                <td className="px-6 py-3 font-bold text-ink">Total anual</td>
                <td className="px-6 py-3 text-right font-bold text-ink">{totalSales}</td>
                <td className="px-6 py-3 text-right font-bold text-ink">{salesData.reduce((s, d) => s + d.students, 0)}</td>
                <td className="px-6 py-3 text-right font-bold text-ink">{formatPrice(totalRevenue)}</td>
                <td className="px-6 py-3 text-right font-bold text-error">
                  {formatPrice(salesData.reduce((sum, d) => sum + calculateFee(d.revenue), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
