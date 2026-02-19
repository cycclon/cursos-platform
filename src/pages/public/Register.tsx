import { useState } from 'react';
import { BookOpen, User, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { ApiError } from '@/services/api';

export default function Register() {
  const { isAuthenticated, loginWithGoogle, register, role } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const dest = role === 'teacher' ? '/admin/panel' : role === 'superuser' ? '/superusuario' : '/mi-panel';
    return <Navigate to={dest} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await register({ name, email, password });
      toast.success('Cuenta creada correctamente.');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-chocolate relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 border border-gold/30 rounded-full" />
          <div className="absolute bottom-20 right-10 w-48 h-48 border border-gold/30 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-gold/20 rounded-full" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 bg-cream/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-gold-light" />
          </div>
          <h2 className="font-display text-3xl font-bold text-cream mb-4">
            Creá tu cuenta
          </h2>
          <p className="text-cream-dark/60 leading-relaxed">
            Registrate para acceder a cursos de formación profesional en derecho.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-ink mb-2">Registrarse</h1>
            <p className="text-sm text-ink-light">
              Creá tu cuenta con email o con Google
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-error-light border border-error/20 mb-6">
              <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">Nombre completo</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/60" />
                <input
                  id="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/60" />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/60" />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  minLength={8}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                />
              </div>
              <p className="text-[11px] text-ink-light/60 mt-1">Debe contener al menos una letra y un número.</p>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/60" />
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repetí tu contraseña"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn-lg btn-full rounded-xl justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-chocolate-100/30" />
            <span className="text-xs text-ink-light/60 font-medium">o</span>
            <div className="flex-1 h-px bg-chocolate-100/30" />
          </div>

          {/* Google button */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border border-chocolate-100/40 bg-parchment text-ink font-medium hover:bg-chocolate-50 hover:border-chocolate-100/60 transition-all shadow-warm"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </button>

          <p className="text-center text-sm text-ink-light mt-8">
            ¿Ya tenés cuenta?{' '}
            <Link to="/ingresar" className="font-semibold text-chocolate hover:text-chocolate-dark transition-colors">
              Ingresá
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
