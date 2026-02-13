import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, User, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { role, isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const publicLinks = [
    { to: '/', label: 'Inicio' },
    { to: '/cursos', label: 'Cursos' },
    { to: '/sobre-mi', label: 'Sobre Mí' },
    { to: '/preguntas-frecuentes', label: 'FAQ' },
  ];

  const studentLinks = [
    { to: '/mi-panel', label: 'Mi Panel' },
  ];

  const teacherLinks = [
    { to: '/admin/panel', label: 'Dashboard' },
    { to: '/admin/cursos', label: 'Mis Cursos' },
    { to: '/admin/estadisticas', label: 'Estadísticas' },
  ];

  const superuserLinks = [
    { to: '/superusuario', label: 'Panel Admin' },
  ];

  const navLinks = [
    ...publicLinks,
    ...(role === 'student' ? studentLinks : []),
    ...(role === 'teacher' ? teacherLinks : []),
    ...(role === 'superuser' ? superuserLinks : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-parchment/95 backdrop-blur-sm border-b border-chocolate-100/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-chocolate rounded-lg flex items-center justify-center group-hover:bg-chocolate-dark transition-colors">
              <BookOpen className="w-5 h-5 text-cream" />
            </div>
            <div className="hidden sm:block">
              <span className="font-display text-lg font-bold text-ink">Dra. Vidal</span>
              <span className="text-xs text-ink-light block -mt-1 tracking-wide">Cursos de Derecho</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'text-chocolate bg-chocolate-50'
                    : 'text-ink-light hover:text-chocolate hover:bg-chocolate-50/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={role === 'teacher' ? '/admin/panel' : role === 'superuser' ? '/superusuario' : '/mi-panel'}
                className="hidden md:flex items-center gap-2 text-sm font-medium text-ink-light hover:text-chocolate transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-chocolate-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-chocolate" />
                </div>
                <span>{user?.name?.split(' ')[0]}</span>
              </Link>
            ) : (
              <Link
                to="/ingresar"
                className="hidden md:flex items-center gap-2 btn-primary btn-md rounded-lg"
              >
                <LogIn className="w-4 h-4" />
                Ingresar
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-ink-light hover:bg-chocolate-50 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-chocolate-100/50 bg-parchment">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'text-chocolate bg-chocolate-50'
                    : 'text-ink-light hover:text-chocolate hover:bg-chocolate-50/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link
                to="/ingresar"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-chocolate hover:bg-chocolate-50"
              >
                Ingresar
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
