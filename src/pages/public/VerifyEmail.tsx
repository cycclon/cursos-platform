import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Clock, BookOpen } from 'lucide-react';

type Status = 'success' | 'invalid' | 'expired' | 'taken';

const TONES: Record<Status, 'success' | 'error' | 'warning'> = {
  success: 'success',
  expired: 'warning',
  invalid: 'error',
  taken: 'warning',
};

export default function VerifyEmail() {
  const { t } = useTranslation();
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
          <h1 className="font-display text-2xl font-bold text-ink mb-3">{t('verify.noStatusTitle')}</h1>
          <p className="text-sm text-ink-light leading-relaxed mb-8">
            {t('verify.noStatusBody')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/registrarse" className="btn-primary rounded-xl justify-center">
              {t('verify.registerAgain')}
            </Link>
            <Link to="/ingresar" className="btn-ghost rounded-xl justify-center">
              {t('verify.signIn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tone = TONES[status];
  const Icon = status === 'success' ? CheckCircle2 : status === 'expired' || status === 'taken' ? Clock : AlertCircle;
  const iconWrap =
    tone === 'success' ? 'bg-success-light text-success' :
    tone === 'warning' ? 'bg-chocolate-50 text-chocolate' :
    'bg-error-light text-error';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12 bg-cream">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-8 text-ink-light">
          <BookOpen className="w-4 h-4" />
          <span className="text-xs font-medium tracking-wide uppercase">{t('verify.badge')}</span>
        </div>

        <div className={`w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center ${iconWrap}`}>
          <Icon className="w-7 h-7" />
        </div>

        <h1 className="font-display text-2xl font-bold text-ink mb-3">{t(`verify.${status}.title`)}</h1>
        <p className="text-sm text-ink-light leading-relaxed mb-8">{t(`verify.${status}.body`)}</p>

        {(status === 'success' || status === 'taken') && (
          <Link to="/ingresar" className="btn-primary rounded-xl justify-center inline-flex">
            {t('verify.signIn')}
          </Link>
        )}

        {(status === 'invalid' || status === 'expired') && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/registrarse" className="btn-primary rounded-xl justify-center">
              {t('verify.registerAgain')}
            </Link>
            <Link to="/ingresar" className="btn-ghost rounded-xl justify-center">
              {t('verify.signIn')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
