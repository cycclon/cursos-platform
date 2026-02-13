import { BarChart3, Users, Eye, Star, DollarSign } from 'lucide-react';
import { salesData, courseStats, formatPrice } from '@/data/mock';

export default function Statistics() {
  const totalViews = courseStats.reduce((sum, c) => sum + c.views, 0);
  const totalEnrollments = courseStats.reduce((sum, c) => sum + c.enrollments, 0);
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const avgRating = courseStats.reduce((sum, c) => sum + c.avgRating, 0) / courseStats.length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Estadísticas</h1>
        <p className="text-ink-light mt-1">Análisis detallado del rendimiento de tus cursos.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Eye, label: 'Vistas totales', value: totalViews.toLocaleString(), color: 'text-chocolate bg-chocolate-50' },
          { icon: Users, label: 'Inscripciones', value: totalEnrollments.toString(), color: 'text-gold bg-gold/10' },
          { icon: DollarSign, label: 'Ingresos totales', value: formatPrice(totalRevenue), color: 'text-success bg-success-light' },
          { icon: Star, label: 'Valoración promedio', value: avgRating.toFixed(1), color: 'text-gold bg-gold/10' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 shadow-warm">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xl font-bold text-ink">{stat.value}</p>
              <p className="text-xs text-ink-light mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Monthly sales chart */}
      <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm mb-8">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-gold" />
          <h2 className="font-display text-lg font-bold text-ink">Ventas mensuales</h2>
        </div>
        <div className="grid grid-cols-12 gap-2 h-56">
          {salesData.map((d, i) => {
            const maxSales = Math.max(...salesData.map(s => s.sales));
            const height = (d.sales / maxSales) * 100;
            return (
              <div key={i} className="flex flex-col items-center h-full group">
                <span className="text-[10px] text-ink-light opacity-0 group-hover:opacity-100 transition-opacity font-semibold shrink-0 h-4">
                  {d.sales}
                </span>
                <div className="flex-1 w-full relative">
                  <div
                    className="absolute bottom-0 left-0.5 right-0.5 rounded-t-md bg-gradient-to-t from-chocolate to-chocolate-light transition-all duration-300 group-hover:from-gold group-hover:to-gold-light cursor-pointer"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[9px] text-ink-light truncate w-full text-center shrink-0 mt-1">{d.month.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly students chart */}
      <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-gold" />
          <h2 className="font-display text-lg font-bold text-ink">Nuevos estudiantes por mes</h2>
        </div>
        <div className="grid grid-cols-12 gap-2 h-48">
          {salesData.map((d, i) => {
            const maxStudents = Math.max(...salesData.map(s => s.students));
            const height = (d.students / maxStudents) * 100;
            return (
              <div key={i} className="flex flex-col items-center h-full group">
                <span className="text-[10px] text-ink-light opacity-0 group-hover:opacity-100 transition-opacity font-semibold shrink-0 h-4">
                  {d.students}
                </span>
                <div className="flex-1 w-full relative">
                  <div
                    className="absolute bottom-0 left-0.5 right-0.5 rounded-t-md bg-gradient-to-t from-gold to-gold-light transition-all duration-300 group-hover:from-chocolate group-hover:to-chocolate-light cursor-pointer"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[9px] text-ink-light truncate w-full text-center shrink-0 mt-1">{d.month.split(' ')[0]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Course comparison */}
      <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm">
        <h2 className="font-display text-lg font-bold text-ink mb-6">Comparativa por curso</h2>
        <div className="space-y-4">
          {courseStats.map(cs => {
            const maxViews = Math.max(...courseStats.map(c => c.views));
            const maxEnrollments = Math.max(...courseStats.map(c => c.enrollments));
            return (
              <div key={cs.courseId} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">{cs.courseTitle}</h3>
                  <div className="flex items-center gap-1 text-xs text-gold">
                    <Star className="w-3 h-3 fill-gold" />
                    {cs.avgRating}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-ink-light mb-1">
                      <span>Vistas</span>
                      <span>{cs.views.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-chocolate-100/20">
                      <div
                        className="h-full rounded-full bg-chocolate"
                        style={{ width: `${(cs.views / maxViews) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-ink-light mb-1">
                      <span>Inscripciones</span>
                      <span>{cs.enrollments}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gold/20">
                      <div
                        className="h-full rounded-full bg-gold"
                        style={{ width: `${(cs.enrollments / maxEnrollments) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
