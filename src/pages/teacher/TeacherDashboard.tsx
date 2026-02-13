import {
  DollarSign, Users, BookOpen, Star, TrendingUp,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { courses, salesData, courseStats, formatPrice } from '@/data/mock';

export default function TeacherDashboard() {
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalStudents = courses.reduce((sum, c) => sum + c.studentCount, 0);
  const avgRating = courses.reduce((sum, c) => sum + c.rating, 0) / courses.length;
  const lastMonth = salesData[salesData.length - 1];
  const prevMonth = salesData[salesData.length - 2];
  const revenueChange = ((lastMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Dashboard</h1>
        <p className="text-ink-light mt-1">Resumen general de tu actividad docente.</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          {
            icon: DollarSign, label: 'Ingresos totales', value: formatPrice(totalRevenue),
            change: `+${revenueChange}%`, up: true, color: 'text-chocolate bg-chocolate-50',
          },
          {
            icon: Users, label: 'Estudiantes', value: totalStudents.toString(),
            change: '+12%', up: true, color: 'text-gold bg-gold/10',
          },
          {
            icon: BookOpen, label: 'Cursos activos', value: courses.length.toString(),
            change: '', up: true, color: 'text-success bg-success-light',
          },
          {
            icon: Star, label: 'Valoración promedio', value: avgRating.toFixed(1),
            change: '+0.1', up: true, color: 'text-gold bg-gold/10',
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                {stat.change && (
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${stat.up ? 'text-success' : 'text-error'}`}>
                    {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-ink">{stat.value}</p>
              <p className="text-xs text-ink-light mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue chart (simple bar chart) */}
      <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Ingresos mensuales</h2>
            <p className="text-xs text-ink-light">Últimos 12 meses</p>
          </div>
          <TrendingUp className="w-5 h-5 text-success" />
        </div>
        <div className="flex gap-2 h-48">
          {salesData.map((d, i) => {
            const maxRev = Math.max(...salesData.map(s => s.revenue));
            const height = (d.revenue / maxRev) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center h-full group">
                <span className="text-[10px] text-ink-light opacity-0 group-hover:opacity-100 transition-opacity font-semibold shrink-0 h-4">
                  {formatPrice(d.revenue)}
                </span>
                <div className="flex-1 w-full relative">
                  <div
                    className="absolute bottom-0 left-1 right-1 rounded-t-md bg-gradient-to-t from-chocolate to-gold transition-all duration-300 group-hover:from-chocolate-light group-hover:to-gold-light cursor-pointer"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[10px] text-ink-light shrink-0 mt-1">{d.month.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Course performance table */}
      <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="font-display text-lg font-bold text-ink mb-1">Rendimiento por curso</h2>
          <p className="text-xs text-ink-light">Métricas acumuladas de todos tus cursos.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-chocolate-100/20">
                <th className="text-left px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Curso</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Vistas</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Inscripciones</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Ingresos</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-ink-light uppercase tracking-wider">Valoración</th>
              </tr>
            </thead>
            <tbody>
              {courseStats.map(cs => (
                <tr key={cs.courseId} className="border-b border-chocolate-100/10 hover:bg-cream-dark/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-ink">{cs.courseTitle}</td>
                  <td className="px-6 py-4 text-right text-ink-light">{cs.views.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right text-ink-light">{cs.enrollments}</td>
                  <td className="px-6 py-4 text-right font-semibold text-ink">{formatPrice(cs.revenue)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="inline-flex items-center gap-1 text-gold">
                      <Star className="w-3.5 h-3.5 fill-gold" />
                      {cs.avgRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
