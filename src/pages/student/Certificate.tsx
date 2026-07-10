import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Printer, ArrowLeft, Award } from 'lucide-react';
import { certificatesService } from '@/services/certificates';
import { formatDate } from '@/utils/format';

export default function Certificate() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();

  const { data: cert, isLoading } = useQuery({
    queryKey: ['certificates', id],
    queryFn: () => certificatesService.getCertificate(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="h-5 w-36 bg-parchment rounded animate-pulse" />
          <div className="h-10 w-44 bg-parchment rounded-lg animate-pulse" />
        </div>
        <div className="bg-parchment rounded-2xl border-2 border-gold/30 h-[500px] animate-pulse" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">{t('certificate.notFound')}</h1>
        <Link to="/mi-panel" className="text-chocolate mt-4 inline-block">{t('certificate.backToPanel')}</Link>
      </div>
    );
  }

  const dateStr = formatDate(cert.issuedAt);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 print-certificate">
      {/* Actions bar */}
      <div className="flex items-center justify-between mb-8 no-print">
        <Link to="/mi-panel" className="inline-flex items-center gap-2 text-sm text-chocolate font-medium hover:text-chocolate-dark transition-colors">
          <ArrowLeft className="w-4 h-4" />
          {t('certificate.backToPanel')}
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 btn-primary btn-md rounded-lg"
        >
          <Printer className="w-4 h-4" />
          {t('certificate.print')}
        </button>
      </div>

      {/* Certificate */}
      <div className="bg-parchment rounded-2xl border-2 border-gold/30 shadow-warm-lg overflow-hidden print-certificate-card">
        {/* Gold top border */}
        <div className="h-2 bg-gradient-to-r from-gold-light via-gold to-gold-light" />

        <div className="p-10 md:p-16 text-center relative diagonal-accent">
          {/* Corner decorations */}
          <div className="absolute top-6 left-6 w-16 h-16 border-l-2 border-t-2 border-gold/30" />
          <div className="absolute top-6 right-6 w-16 h-16 border-r-2 border-t-2 border-gold/30" />
          <div className="absolute bottom-6 left-6 w-16 h-16 border-l-2 border-b-2 border-gold/30" />
          <div className="absolute bottom-6 right-6 w-16 h-16 border-r-2 border-b-2 border-gold/30" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-chocolate flex items-center justify-center">
              <Award className="w-8 h-8 text-gold-light" />
            </div>

            <p className="text-xs font-semibold text-gold uppercase tracking-[0.3em] mb-2">{t('certificate.title')}</p>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-ink mb-8">
              {t('certificate.heading')}
            </h1>

            <p className="text-sm text-ink-light mb-2">{t('certificate.certifies')}</p>
            <p className="font-display text-2xl md:text-3xl font-bold text-chocolate mb-6">
              {cert.studentName}
            </p>

            <p className="text-sm text-ink-light mb-2">{t('certificate.completedCourse')}</p>
            <p className="font-display text-xl md:text-2xl font-bold text-ink mb-6">
              {cert.courseTitle}
            </p>

            {cert.score && (
              <div className="inline-flex items-center gap-2 bg-success-light text-success rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
                <Award className="w-4 h-4" />
                {t('certificate.score', { score: cert.score })}
              </div>
            )}

            <div className="w-24 h-px bg-gold/30 mx-auto my-8" />

            <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
              <div>
                <div className="w-32 h-px bg-ink/20 mx-auto mb-2" />
                <p className="font-display text-sm font-semibold text-ink">{cert.teacherName}</p>
                <p className="text-xs text-ink-light">{t('certificate.teacher')}</p>
              </div>
              <div>
                <div className="w-32 h-px bg-ink/20 mx-auto mb-2" />
                <p className="font-display text-sm font-semibold text-ink">{dateStr}</p>
                <p className="text-xs text-ink-light">{t('certificate.issueDate')}</p>
              </div>
            </div>

            <p className="text-[10px] text-ink-light/50 mt-8">
              Certificado ID: {cert.id} · cursosderecho.com
            </p>
          </div>
        </div>

        {/* Gold bottom border */}
        <div className="h-2 bg-gradient-to-r from-gold-light via-gold to-gold-light" />
      </div>
    </div>
  );
}
