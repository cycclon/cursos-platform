import { Link } from 'react-router-dom';
import { BookOpen, Mail, Lock, User } from 'lucide-react';

export default function Register() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-chocolate relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-10 w-64 h-64 border border-gold/30 rounded-full" />
          <div className="absolute bottom-20 left-10 w-48 h-48 border border-gold/30 rounded-full" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 bg-cream/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-8 h-8 text-gold-light" />
          </div>
          <h2 className="font-display text-3xl font-bold text-cream mb-4">
            Comenzá tu formación
          </h2>
          <p className="text-cream-dark/60 leading-relaxed">
            Creá tu cuenta y accedé a cursos jurídicos de excelencia dictados por profesionales reconocidos.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-cream">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold text-ink">Crear cuenta</h1>
            <p className="text-sm text-ink-light mt-2">Completá tus datos para registrarte en la plataforma</p>
          </div>

          <form className="space-y-5" onSubmit={e => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Nombre</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-light" />
                  <input
                    type="text"
                    placeholder="Nombre"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Apellido</label>
                <input
                  type="text"
                  placeholder="Apellido"
                  className="w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-light" />
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-light" />
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Confirmar contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-light" />
                <input
                  type="password"
                  placeholder="Repetí tu contraseña"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 text-sm text-ink-light">
              <input type="checkbox" className="mt-1 rounded border-chocolate-100 text-chocolate focus:ring-chocolate/20" />
              <span>
                Acepto los{' '}
                <span className="text-chocolate cursor-pointer">Términos y Condiciones</span>{' '}
                y la{' '}
                <span className="text-chocolate cursor-pointer">Política de Privacidad</span>
              </span>
            </label>

            <button
              type="submit"
              className="btn-primary btn-lg btn-full rounded-xl"
            >
              Crear cuenta
            </button>
          </form>

          <p className="text-center text-sm text-ink-light mt-6">
            ¿Ya tenés cuenta?{' '}
            <Link to="/ingresar" className="text-chocolate font-semibold hover:text-chocolate-dark transition-colors">
              Ingresá
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
