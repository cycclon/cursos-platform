import { Outlet, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import { coursesService } from '@/services/courses';
import { bundlesService } from '@/services/bundles';
import {
  LayoutDashboard, BookOpen, BarChart3,
  ChevronRight, Package, HelpCircle, MessageSquare,
} from 'lucide-react';

export default function DashboardLayout() {
  const { role } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['bundles'],
    queryFn: bundlesService.getBundles,
  });

  const hasMultipleCourses = courses.length >= 2;
  const hasCombos = bundles.length > 0;

  const teacherLinks = [
    { to: '/admin/panel', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/cursos', label: 'Mis Cursos', icon: BookOpen },
    ...(hasMultipleCourses || hasCombos ? [{ to: '/admin/combos', label: 'Combos', icon: Package }] : []),
    { to: '/admin/faq', label: 'FAQ', icon: HelpCircle },
    { to: '/admin/opiniones', label: 'Opiniones', icon: MessageSquare },
    { to: '/admin/estadisticas', label: 'Estadísticas', icon: BarChart3 },
  ];

  const superuserLinks = [
    { to: '/superusuario', label: 'Panel General', icon: LayoutDashboard },
  ];

  const sidebarLinks = role === 'teacher'
    ? teacherLinks
    : role === 'superuser'
      ? superuserLinks
      : [];

  const dashboardTitle = role === 'teacher'
    ? 'Panel Docente'
    : role === 'superuser'
      ? 'Administración'
      : 'Mi Panel';

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <div className="flex-1 flex">
        {/* Sidebar — only for teacher/superuser */}
        {sidebarLinks.length > 0 && (
          <aside className="hidden lg:flex w-64 flex-col bg-parchment border-r border-chocolate-100/30">
            <div className="p-6">
              <h2 className="font-display text-lg font-bold text-ink">{dashboardTitle}</h2>
              <div className="mt-1 w-10 h-0.5 bg-gold" />
            </div>
            <nav className="flex-1 px-3 space-y-1">
              {sidebarLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to + link.label}
                    to={link.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.to)
                        ? 'text-chocolate bg-chocolate-50'
                        : 'text-ink-light hover:text-chocolate hover:bg-chocolate-50/50'
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    {link.label}
                    {isActive(link.to) && <ChevronRight className="w-4 h-4 ml-auto text-chocolate-light" />}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 m-3 rounded-lg bg-chocolate-50 border border-chocolate-100/50">
              <p className="text-xs text-ink-light">
                {role === 'teacher' ? (
                  <>Administrá tus cursos, revisá estadísticas y respondé a tus alumnos.</>
                ) : (
                  <>Panel de administración general de la plataforma.</>
                )}
              </p>
            </div>
          </aside>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
