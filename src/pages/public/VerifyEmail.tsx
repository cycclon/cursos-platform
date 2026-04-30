import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Clock, BookOpen } from 'lucide-react';

type Status = 'success' | 'invalid' | 'expired' | 'taken';

const COPY: Record<Status, { title: string; body: string; tone: 'success' | 'error' | 'warning' }> = {
  success: {
    title: '¡Email confirmado!',
    body: 'Tu cuenta está activa. Ya podés iniciar sesión con tu email y contraseña.',
    tone: 'success',
  },
  expired: {
    title: 'El enlace caducó',
    body: 'El enlace de verificación expiró. Volvé a registrarte para recibir uno nuevo.',
    tone: 'warning',
  },
  invalid: {
    title: 'Enlace inválido',
    body: 'No pudimos validar este enlace. Es posible que ya lo hayas usado o que sea incorrecto.',
    tone: 'error',
  },
  taken: {
    title: 'Email ya registrado',
    body: 'Esta cuenta ya fue activada por otra vía (por ejemplo, iniciando sesión con Google). Probá ingresar.',
    tone: 'warning',
  },
};

export default function VerifyEmail() {
  const location = useLocation();

  const status: Status | null = useMemo(() => {
    const raw = new URLSearchParams(location.search).get('status');
    if (raw === 'success' || raw === 'invalid' || raw === 'expired' || raw === 'taken') return raw;
    return null;
  }, [location.search]);

  if (!status) {
    // Reached without a status param — likely the email link was opened directly
    // against the frontend instead of routed through the backend. Send the user
    // somewhere sensible instead of dead-ending here.
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12 bg-cream">
        <div className="w-full max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-error-light flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-error" />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink mb-3">Enlace inválido</h1>
          <p className="text-sm text-ink-light leading-relaxed mb-8">
            No pudimos procesar este enlace. Volvé a registrarte para recibir uno nuevo.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/registrarse" className="btn-primary rounded-xl justify-center">
              Registrarse de nuevo
            </Link>
            <Link to="/ingresar" className="btn-ghost rounded-xl justify-center">
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const copy = COPY[status];
  const Icon = status === 'success' ? CheckCircle2 : status === 'expired' || status === 'taken' ? Clock : AlertCircle;
  const iconWrap =
    copy.tone === 'success' ? 'bg-success-light text-success' :
    copy.tone === 'warning' ? 'bg-chocolate-50 text-chocolate' :
    'bg-error-light text-error';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12 bg-cream">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8 text-ink-light">
          <BookOpen className="w-4 h-4" />
          <span className="text-xs font-medium tracking-wide uppercase">Verificación de cuenta</span>
        </div>

        <div className={`w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center ${iconWrap}`}>
          <Icon className="w-7 h-7" />
        </div>

        <h1 className="font-display text-2xl font-bold text-ink mb-3">{copy.title}</h1>
        <p className="text-sm text-ink-light leading-relaxed mb-8">{copy.body}</p>

        {status === 'success' && (
          <Link to="/ingresar" className="btn-primary rounded-xl justify-center inline-flex">
            Iniciar sesión
          </Link>
        )}

        {status === 'taken' && (
          <Link to="/ingresar" className="btn-primary rounded-xl justify-center inline-flex">
            Iniciar sesión
          </Link>
        )}

        {(status === 'invalid' || status === 'expired') && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/registrarse" className="btn-primary rounded-xl justify-center">
              Registrarse de nuevo
            </Link>
            <Link to="/ingresar" className="btn-ghost rounded-xl justify-center">
              Iniciar sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
