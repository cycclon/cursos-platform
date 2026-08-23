import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera, Plus, X, Loader2, Save, Video, GripVertical,
  CheckCircle2, CreditCard, ExternalLink, Unlink, AlertCircle, Sparkles, Globe,
} from 'lucide-react';
import EnglishSection from '@/components/teacher/EnglishSection';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { teacherService } from '@/services/teacher';
import { uploadsService } from '@/services/uploads';
import { subtitlesService, type SubtitleJobInfo } from '@/services/subtitles';
import { mercadoPagoService } from '@/services/mercadoPago';
import { lemonSqueezyService, type LsStore, type LsVariant } from '@/services/lemonSqueezy';
import { pruneEn } from '@/utils/translations';
import { getVideoProvider } from '@/utils/video';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import type { VideoSubtitle, AppLanguage } from '@/types';

const INPUT = 'w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all';

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { isMainTeacher, role } = useAuth();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const subtitleLangRef = useRef<AppLanguage | null>(null);

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', 'edit'],
    queryFn: teacherService.getTeacherForEdit,
  });

  const { data: mpStatus, isLoading: mpLoading } = useQuery({
    queryKey: ['mercadopago-status'],
    queryFn: mercadoPagoService.getStatus,
    enabled: isMainTeacher,
  });

  const [isDisconnectingMp, setIsDisconnectingMp] = useState(false);

  // Surface OAuth callback result via toast and clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mp = params.get('mp');
    if (!mp) return;

    if (mp === 'connected') {
      toast.success('Mercado Pago conectado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['mercadopago-status'] });
    } else if (mp === 'error') {
      const reason = params.get('reason') || 'desconocido';
      toast.error(`No se pudo conectar Mercado Pago (${reason}).`);
    }

    params.delete('mp');
    params.delete('reason');
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [toast, queryClient]);

  const handleConnectMp = () => {
    window.location.href = mercadoPagoService.connectUrl;
  };

  const handleDisconnectMp = async () => {
    if (!window.confirm('¿Querés desconectar tu cuenta de Mercado Pago? Los estudiantes no podrán pagar hasta que la vuelvas a conectar.')) {
      return;
    }
    setIsDisconnectingMp(true);
    try {
      await mercadoPagoService.disconnect();
      queryClient.invalidateQueries({ queryKey: ['mercadopago-status'] });
      toast.success('Cuenta de Mercado Pago desconectada.');
    } catch {
      toast.error('No se pudo desconectar la cuenta. Probá de nuevo.');
    } finally {
      setIsDisconnectingMp(false);
    }
  };

  // --- Lemon Squeezy (international USD lane) connection ---
  const { data: lsStatus, isLoading: lsLoading } = useQuery({
    queryKey: ['lemonsqueezy-status'],
    queryFn: lemonSqueezyService.getStatus,
    enabled: role === 'teacher' || role === 'superuser',
  });

  const [lsApiKey, setLsApiKey] = useState('');
  const [lsTestMode, setLsTestMode] = useState(false);
  const [lsStores, setLsStores] = useState<LsStore[]>([]);
  const [lsVariants, setLsVariants] = useState<LsVariant[]>([]);
  const [lsStoreId, setLsStoreId] = useState('');
  const [lsVariantId, setLsVariantId] = useState('');
  const [lsDetecting, setLsDetecting] = useState(false);
  const [lsConnecting, setLsConnecting] = useState(false);
  const [lsDisconnecting, setLsDisconnecting] = useState(false);

  const handleLsDetect = async () => {
    if (!lsApiKey.trim()) return;
    setLsDetecting(true);
    try {
      const r = await lemonSqueezyService.inspect({ apiKey: lsApiKey.trim() });
      setLsStores(r.stores);
      setLsStoreId(r.storeId ?? '');
      setLsVariants(r.variants);
      setLsVariantId('');
      if (r.stores.length === 0) toast.error('No se encontraron tiendas para esa API key.');
    } catch {
      toast.error('No se pudo validar la API key. Revisá que sea correcta y del modo elegido.');
    } finally {
      setLsDetecting(false);
    }
  };

  const handleLsStoreChange = async (storeId: string) => {
    setLsStoreId(storeId);
    setLsVariantId('');
    setLsVariants([]);
    if (!storeId) return;
    setLsDetecting(true);
    try {
      const r = await lemonSqueezyService.inspect({ apiKey: lsApiKey.trim(), storeId });
      setLsVariants(r.variants);
    } catch {
      toast.error('No se pudieron cargar los productos de esa tienda.');
    } finally {
      setLsDetecting(false);
    }
  };

  const handleLsConnect = async () => {
    if (!lsStoreId || !lsVariantId) return;
    setLsConnecting(true);
    try {
      await lemonSqueezyService.connect({
        apiKey: lsApiKey.trim(),
        storeId: lsStoreId,
        variantId: lsVariantId,
        testMode: lsTestMode,
      });
      queryClient.invalidateQueries({ queryKey: ['lemonsqueezy-status'] });
      toast.success('Lemon Squeezy conectado. Ya podés cobrar en USD.');
      setLsApiKey('');
      setLsStores([]);
      setLsVariants([]);
      setLsStoreId('');
      setLsVariantId('');
    } catch {
      toast.error('No se pudo completar la conexión. Probá de nuevo.');
    } finally {
      setLsConnecting(false);
    }
  };

  const handleLsDisconnect = async () => {
    if (!window.confirm('¿Desconectar Lemon Squeezy? Los estudiantes internacionales no podrán pagar en USD hasta reconectar.')) {
      return;
    }
    setLsDisconnecting(true);
    try {
      await lemonSqueezyService.disconnect();
      queryClient.invalidateQueries({ queryKey: ['lemonsqueezy-status'] });
      toast.success('Lemon Squeezy desconectado.');
    } catch {
      toast.error('No se pudo desconectar. Probá de nuevo.');
    } finally {
      setLsDisconnecting(false);
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    photoUrl: '',
    credentials: [] as string[],
    videoUrl: '',
    videoSubtitles: [] as VideoSubtitle[],
    enTitle: '',
    enBio: '',
    enCredentials: [] as string[],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
  const [subtitleJob, setSubtitleJob] = useState<SubtitleJobInfo | null>(null);

  useEffect(() => {
    if (teacher) {
      setFormData({
        title: teacher.title || '',
        bio: teacher.bio || '',
        photoUrl: teacher.photoUrl || '',
        credentials: teacher.credentials || [],
        videoUrl: teacher.videoUrl || '',
        videoSubtitles: teacher.videoSubtitles || [],
        enTitle: teacher.translations?.en?.title ?? '',
        enBio: teacher.translations?.en?.bio ?? '',
        enCredentials: teacher.translations?.en?.credentials ?? [],
      });
    }
  }, [teacher]);

  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCredentialChange = (index: number, value: string) => {
    const newCredentials = [...formData.credentials];
    newCredentials[index] = value;
    handleChange('credentials', newCredentials);
  };

  const addCredential = () => {
    handleChange('credentials', [...formData.credentials, '']);
  };

  const removeCredential = (index: number) => {
    handleChange('credentials', formData.credentials.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const { url } = await uploadsService.uploadImage(file);
      handleChange('photoUrl', url);
      toast.success('Foto actualizada.');
    } catch {
      toast.error('Error al subir la foto.');
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingVideo(true);
    setVideoUploadProgress(0);
    try {
      const { url } = await uploadsService.uploadVideo(file, (percent) => {
        setVideoUploadProgress(percent);
      });
      handleChange('videoUrl', url);
      toast.success('Video subido correctamente.');
    } catch (err) {
      console.error('[uploadVideo] failed:', err);
      const message = err instanceof Error && err.message
        ? `Error al subir el video: ${err.message}`
        : 'Error al subir el video.';
      toast.error(message);
    } finally {
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  /* ── Subtitle handlers (welcome video) ──────────────── */

  const handlePickSubtitleFile = (lang: AppLanguage) => {
    subtitleLangRef.current = lang;
    subtitleInputRef.current?.click();
  };

  const handleSubtitleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const lang = subtitleLangRef.current;
    if (!file || !lang) return;
    setUploadingSubtitle(true);
    try {
      const { url } = await uploadsService.uploadSubtitle(file);
      setFormData(prev => ({
        ...prev,
        videoSubtitles: [
          ...prev.videoSubtitles.filter(s => s.lang !== lang),
          { lang, url, source: 'manual' as const, updatedAt: new Date().toISOString() },
        ],
      }));
      toast.success(`Subtítulo ${lang.toUpperCase()} cargado. Guardá los cambios para aplicarlo.`);
    } catch {
      toast.error('Error al subir el subtítulo (.vtt o .srt).');
    } finally {
      setUploadingSubtitle(false);
      subtitleLangRef.current = null;
      if (subtitleInputRef.current) subtitleInputRef.current.value = '';
    }
  };

  const handleRemoveSubtitle = (lang: AppLanguage) => {
    setFormData(prev => ({
      ...prev,
      videoSubtitles: prev.videoSubtitles.filter(s => s.lang !== lang),
    }));
  };

  const handleGenerateSubtitles = async () => {
    try {
      const { job } = await subtitlesService.generateTeacherVideo();
      setSubtitleJob(job);
      toast.success('Generación de subtítulos iniciada. Puede tardar varios minutos.');
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'No se pudo iniciar la generación.';
      toast.error(message);
    }
  };

  // Poll the active generation job (server-side pipeline). On completion, merge
  // ONLY the freshly generated tracks into the form — never invalidate/refetch
  // the whole ['teacher'] query, which would reset the form effect above and
  // discard any unsaved profile edits made while the (multi-minute) job ran.
  useEffect(() => {
    if (!subtitleJob || (subtitleJob.status !== 'queued' && subtitleJob.status !== 'processing')) return;
    const interval = setInterval(async () => {
      try {
        const { job } = await subtitlesService.getTeacherVideoJob();
        if (!job) return;
        setSubtitleJob(job);
        if (job.status === 'done') {
          toast.success(job.warning ? `Subtítulos generados. ${job.warning}` : 'Subtítulos generados (ES y EN).');
          try {
            const fresh = await teacherService.getTeacher();
            setFormData(prev => ({ ...prev, videoSubtitles: fresh.videoSubtitles || [] }));
          } catch {
            /* tracks are already saved server-side; they'll load on next open */
          }
        } else if (job.status === 'failed') {
          toast.error(`La generación de subtítulos falló: ${job.error ?? 'error desconocido'}`);
        }
      } catch {
        /* transient network error — keep polling */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [subtitleJob, toast]);

  const { translating, runTranslate } = useAutoTranslate();

  const handleAutoTranslate = async () => {
    const draft = {
      enTitle: formData.enTitle,
      enBio: formData.enBio,
      enCredentials: [...formData.enCredentials],
    };
    const slots: { text: string; apply: (v: string) => void }[] = [];
    if (formData.title.trim() && !draft.enTitle.trim()) {
      slots.push({ text: formData.title, apply: v => { draft.enTitle = v; } });
    }
    if (formData.bio.trim() && !draft.enBio.trim()) {
      slots.push({ text: formData.bio, apply: v => { draft.enBio = v; } });
    }
    const canonicalCreds = formData.credentials.map(c => c.trim()).filter(Boolean);
    if (canonicalCreds.length > 0 && draft.enCredentials.filter(c => c.trim()).length === 0) {
      const acc: string[] = new Array(canonicalCreds.length).fill('');
      canonicalCreds.forEach((cred, idx) =>
        slots.push({ text: cred, apply: v => { acc[idx] = v; draft.enCredentials = acc; } }),
      );
    }
    if (slots.length === 0) {
      toast.success('No hay campos en inglés pendientes de completar.');
      return;
    }
    const translations = await runTranslate(
      slots.map(s => s.text),
      'Perfil público de una abogada docente de litigación (título profesional, biografía, credenciales)',
    );
    if (!translations) return;
    slots.forEach((s, i) => s.apply(translations[i]));
    setFormData(prev => ({ ...prev, ...draft }));
    toast.success('Traducción lista. Revisá antes de guardar.');
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.bio.trim()) {
      toast.error('El título y la biografía son obligatorios.');
      return;
    }
    setIsSaving(true);
    try {
      const cleanCredentials = formData.credentials.filter(c => c.trim());
      await teacherService.updateTeacher({
        title: formData.title,
        bio: formData.bio,
        photoUrl: formData.photoUrl,
        credentials: cleanCredentials,
        videoUrl: formData.videoUrl || undefined,
        // Drop orphaned subtitle tracks if the video was removed.
        videoSubtitles: formData.videoUrl ? formData.videoSubtitles : [],
        translations: {
          en: pruneEn({
            title: formData.enTitle,
            bio: formData.enBio,
            credentials: formData.enCredentials,
          }),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['teacher'] });
      toast.success('Perfil actualizado correctamente.');
    } catch {
      toast.error('Error al guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="h-8 bg-parchment rounded animate-pulse w-48" />
          <div className="h-4 bg-parchment rounded animate-pulse w-72 mt-2" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="aspect-[3/4] bg-parchment rounded-2xl animate-pulse" />
          <div className="lg:col-span-2 space-y-6">
            <div className="h-12 bg-parchment rounded-xl animate-pulse" />
            <div className="h-40 bg-parchment rounded-xl animate-pulse" />
            <div className="h-32 bg-parchment rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Mi Perfil</h1>
        <p className="text-ink-light mt-1">Editá tu información pública visible en la plataforma.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Photo column */}
        <div className="space-y-4">
          <div
            onClick={() => !isUploadingPhoto && photoInputRef.current?.click()}
            className="group relative rounded-2xl overflow-hidden shadow-warm border border-chocolate-100/20 cursor-pointer"
          >
            {formData.photoUrl ? (
              <img
                src={formData.photoUrl}
                alt="Foto de perfil"
                className="w-full aspect-[3/4] object-cover"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-chocolate-50 flex items-center justify-center">
                <Camera className="w-12 h-12 text-chocolate-light" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/40 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
                {isUploadingPhoto ? (
                  <Loader2 className="w-8 h-8 text-cream animate-spin" />
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-cream" />
                    <span className="text-sm font-medium text-cream">Cambiar foto</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={photoInputRef}
            onChange={handlePhotoUpload}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />

          <p className="text-xs text-ink-light text-center">
            Formatos: JPG, PNG, WEBP. Máximo 5 MB.
          </p>
        </div>

        {/* Form column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Mercado Pago connection — only the main teacher manages the linked account */}
          {isMainTeacher && (
          <div
            className={`rounded-xl p-6 shadow-warm border ${
              mpStatus?.connected
                ? 'bg-parchment border-chocolate-100/20'
                : 'bg-gradient-to-br from-gold/10 to-parchment border-gold/30'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink gold-underline">
                  Cobros con Mercado Pago
                </h2>
              </div>
              {mpStatus?.connected && (
                <span className="inline-flex items-center gap-1.5 shrink-0 text-xs font-semibold text-success bg-success-light border border-success/30 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Conectada
                </span>
              )}
            </div>

            {mpLoading ? (
              <div className="mt-6 space-y-2">
                <div className="h-4 bg-cream-dark/40 rounded animate-pulse w-3/4" />
                <div className="h-10 bg-cream-dark/40 rounded animate-pulse w-48" />
              </div>
            ) : mpStatus?.connected ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-ink-light leading-relaxed">
                  Cuando un estudiante se inscriba en un curso pago, los fondos se acreditarán
                  directamente en tu cuenta de Mercado Pago.
                </p>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-cream-dark/40 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-ink-light/70 font-semibold">
                      ID de Mercado Pago
                    </p>
                    <p className="text-sm font-mono text-ink mt-0.5 truncate">{mpStatus.mpUserId}</p>
                  </div>
                  <div className="bg-cream-dark/40 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-ink-light/70 font-semibold">
                      Conectada el
                    </p>
                    <p className="text-sm text-ink mt-0.5">
                      {mpStatus.connectedAt
                        ? new Date(mpStatus.connectedAt).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                  <div className="bg-cream-dark/40 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-ink-light/70 font-semibold">
                      Modo
                    </p>
                    <p className="text-sm text-ink mt-0.5">
                      {mpStatus.liveMode ? 'Producción' : 'Prueba'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 text-xs text-ink-light pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                  <span>
                    La conexión se renueva automáticamente. No necesitás hacer nada.
                  </span>
                </div>

                <div className="pt-2 border-t border-chocolate-100/20">
                  <button
                    onClick={handleDisconnectMp}
                    disabled={isDisconnectingMp}
                    className="inline-flex items-center gap-2 text-sm font-medium text-ink-light hover:text-error transition-colors disabled:opacity-50"
                  >
                    {isDisconnectingMp ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                    {isDisconnectingMp ? 'Desconectando…' : 'Desconectar cuenta'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gold/10 border border-gold/30">
                  <AlertCircle className="w-5 h-5 text-gold-dark shrink-0 mt-0.5" />
                  <p className="text-sm text-ink leading-relaxed">
                    <span className="font-semibold">Conectá tu cuenta para empezar a recibir pagos.</span>{' '}
                    Mientras no esté conectada, los estudiantes no van a poder inscribirse en cursos pagos.
                  </p>
                </div>

                <p className="text-sm text-ink-light leading-relaxed">
                  Te vamos a redirigir a Mercado Pago para que inicies sesión con tu propia cuenta y
                  autorices a la plataforma. <span className="font-semibold text-ink">No vas a tener
                  que compartir tu token con nadie.</span> Los pagos se acreditan directamente en tu
                  cuenta de Mercado Pago.
                </p>

                <button
                  onClick={handleConnectMp}
                  className="inline-flex items-center gap-2 btn-primary btn-lg rounded-xl"
                >
                  <CreditCard className="w-4.5 h-4.5" />
                  Conectar Mercado Pago
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </button>
              </div>
            )}
          </div>
          )}

          {/* Lemon Squeezy connection — platform-wide USD lane (single store) */}
          {(role === 'teacher' || role === 'superuser') && (
          <div
            className={`rounded-xl p-6 shadow-warm border ${
              lsStatus?.connected
                ? 'bg-parchment border-chocolate-100/20'
                : 'bg-gradient-to-br from-gold/10 to-parchment border-gold/30'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="font-display text-lg font-bold text-ink gold-underline">
                  Cobros internacionales (USD)
                </h2>
                <p className="text-xs text-ink-light mt-1">
                  Lemon Squeezy · para compradores fuera de Argentina
                </p>
              </div>
              {lsStatus?.connected && (
                <span className="inline-flex items-center gap-1.5 shrink-0 text-xs font-semibold text-success bg-success-light border border-success/30 px-2.5 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {lsStatus.testMode ? 'Prueba' : 'Conectada'}
                </span>
              )}
            </div>

            {lsLoading ? (
              <div className="mt-6 space-y-2">
                <div className="h-4 bg-cream-dark/40 rounded animate-pulse w-3/4" />
                <div className="h-10 bg-cream-dark/40 rounded animate-pulse w-48" />
              </div>
            ) : lsStatus?.connected ? (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-ink-light leading-relaxed">
                  Los estudiantes que elijan USD pagan a través de Lemon Squeezy. Los fondos se
                  acreditan en el método de pago configurado en tu cuenta de Lemon Squeezy.
                </p>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="bg-cream-dark/40 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-ink-light/70 font-semibold">
                      Tienda
                    </p>
                    <p className="text-sm text-ink mt-0.5 truncate">
                      {lsStatus.storeName || lsStatus.storeId}
                    </p>
                  </div>
                  <div className="bg-cream-dark/40 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-ink-light/70 font-semibold">
                      Modo
                    </p>
                    <p className="text-sm text-ink mt-0.5">
                      {lsStatus.testMode ? 'Prueba' : 'Producción'}
                    </p>
                  </div>
                  <div className="bg-cream-dark/40 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-ink-light/70 font-semibold">
                      Conectada el
                    </p>
                    <p className="text-sm text-ink mt-0.5">
                      {lsStatus.connectedAt
                        ? new Date(lsStatus.connectedAt).toLocaleDateString('es-AR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                </div>
                {lsStatus.source === 'env' ? (
                  <div className="flex items-start gap-2 text-xs text-ink-light pt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-gold-dark shrink-0 mt-0.5" />
                    <span>
                      Configurado por variables de entorno del servidor. Para gestionarlo desde acá,
                      reconectá pegando tu API key.
                    </span>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-chocolate-100/20">
                    <button
                      onClick={handleLsDisconnect}
                      disabled={lsDisconnecting}
                      className="inline-flex items-center gap-2 text-sm font-medium text-ink-light hover:text-error transition-colors disabled:opacity-50"
                    >
                      {lsDisconnecting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Unlink className="w-4 h-4" />
                      )}
                      {lsDisconnecting ? 'Desconectando…' : 'Desconectar'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 space-y-5">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gold/10 border border-gold/30">
                  <AlertCircle className="w-5 h-5 text-gold-dark shrink-0 mt-0.5" />
                  <p className="text-sm text-ink leading-relaxed">
                    <span className="font-semibold">Pegá tu API key de Lemon Squeezy</span> y detectamos
                    tu tienda, creamos el webhook y dejamos todo listo. No hace falta tocar el servidor.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1.5">API key</label>
                    <input
                      type="password"
                      value={lsApiKey}
                      onChange={(e) => setLsApiKey(e.target.value)}
                      placeholder="Pegá tu API key (Settings » API en Lemon Squeezy)"
                      className={INPUT}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-ink-light">
                    <input
                      type="checkbox"
                      checked={lsTestMode}
                      onChange={(e) => setLsTestMode(e.target.checked)}
                      className="w-4 h-4 rounded accent-chocolate"
                    />
                    Modo de prueba (usá una API key de test)
                  </label>
                  <button
                    onClick={handleLsDetect}
                    disabled={!lsApiKey.trim() || lsDetecting}
                    className="inline-flex items-center gap-2 btn-secondary btn-md rounded-xl disabled:opacity-50"
                  >
                    {lsDetecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {lsDetecting ? 'Detectando…' : 'Detectar tienda'}
                  </button>
                </div>

                {lsStores.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-chocolate-100/20">
                    {lsStores.length > 1 && (
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">Tienda</label>
                        <select
                          value={lsStoreId}
                          onChange={(e) => handleLsStoreChange(e.target.value)}
                          className={INPUT}
                        >
                          <option value="">Elegí una tienda…</option>
                          {lsStores.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1.5">
                        Producto / variante
                      </label>
                      <select
                        value={lsVariantId}
                        onChange={(e) => setLsVariantId(e.target.value)}
                        disabled={lsVariants.length === 0}
                        className={INPUT}
                      >
                        <option value="">
                          {lsVariants.length
                            ? 'Elegí el producto placeholder…'
                            : 'Sin productos — creá uno en Lemon Squeezy'}
                        </option>
                        {lsVariants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1.5 text-xs text-ink-light">
                        El precio de este producto no importa: cada compra usa el precio USD del curso.
                      </p>
                    </div>
                    <button
                      onClick={handleLsConnect}
                      disabled={!lsStoreId || !lsVariantId || lsConnecting}
                      className="inline-flex items-center gap-2 btn-primary btn-lg rounded-xl disabled:opacity-50"
                    >
                      {lsConnecting ? (
                        <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      ) : (
                        <Globe className="w-4.5 h-4.5" />
                      )}
                      {lsConnecting ? 'Conectando…' : 'Conectar Lemon Squeezy'}
                    </button>
                  </div>
                )}

                <a
                  href="https://app.lemonsqueezy.com/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-chocolate hover:underline"
                >
                  Generar una API key en Lemon Squeezy <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
          )}

          {/* Title */}
          <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm">
            <h2 className="font-display text-lg font-bold text-ink mb-4 gold-underline">Información Principal</h2>

            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Título profesional <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => handleChange('title', e.target.value)}
                  placeholder="Ej: Abogada · Especialista en Derecho Civil y Comercial"
                  className={INPUT}
                />
                <p className="text-xs text-ink-light mt-1">Aparece debajo de tu nombre en la página "Sobre Mí".</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Biografía <span className="text-error">*</span>
                </label>
                <textarea
                  rows={8}
                  value={formData.bio}
                  onChange={e => handleChange('bio', e.target.value)}
                  placeholder="Contá tu trayectoria profesional, experiencia y enfoque educativo..."
                  className={`${INPUT} resize-none`}
                />
                <p className="text-xs text-ink-light mt-1">Usá líneas en blanco para separar párrafos.</p>
              </div>
            </div>
          </div>

          {/* Credentials */}
          <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm">
            <h2 className="font-display text-lg font-bold text-ink mb-4 gold-underline">Credenciales</h2>

            <div className="mt-6 space-y-2.5">
              {formData.credentials.map((cred, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-ink-light/40 shrink-0" />
                  <input
                    type="text"
                    value={cred}
                    onChange={e => handleCredentialChange(index, e.target.value)}
                    placeholder="Ej: Abogada (UBA)"
                    className={`${INPUT} flex-1`}
                  />
                  <button
                    onClick={() => removeCredential(index)}
                    className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-ink-light hover:text-error hover:bg-error-light transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                onClick={addCredential}
                className="inline-flex items-center gap-2 text-sm font-medium text-chocolate hover:text-chocolate-dark transition-colors mt-2"
              >
                <Plus className="w-4 h-4" />
                Agregar credencial
              </button>
            </div>
          </div>

          {/* Video */}
          <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 shadow-warm">
            <h2 className="font-display text-lg font-bold text-ink mb-4 gold-underline">Video de Presentación</h2>

            <div className="mt-6 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={e => handleChange('videoUrl', e.target.value)}
                  placeholder="URL del video (YouTube, Vimeo, etc.) o subí un archivo"
                  className={`${INPUT} flex-1`}
                />
                <button
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploadingVideo}
                  className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm font-medium text-chocolate hover:bg-chocolate-50 disabled:opacity-50 transition-all"
                >
                  {isUploadingVideo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  {isUploadingVideo
                    ? videoUploadProgress >= 100
                      ? 'Procesando…'
                      : `${videoUploadProgress}%`
                    : 'Subir'}
                </button>
              </div>

              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoUpload}
                accept="video/mp4"
                className="hidden"
              />

              {isUploadingVideo && (
                <div className="space-y-1">
                  <div
                    role="progressbar"
                    aria-valuenow={videoUploadProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    className="h-2 w-full overflow-hidden rounded-full bg-chocolate-100/30"
                  >
                    <div
                      className="h-full bg-chocolate transition-[width] duration-150 ease-out"
                      style={{ width: `${videoUploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-ink-light/80">
                    {videoUploadProgress >= 100
                      ? 'Subida completa. El servidor está guardando el archivo…'
                      : `Subiendo al servidor: ${videoUploadProgress}%`}
                  </p>
                </div>
              )}

              <p className="text-xs text-ink-light">
                Formato: MP4. Máximo 1,5 GB. Este video aparecerá en tu página "Sobre Mí".
              </p>

              {formData.videoUrl && (
                <div className="flex items-center justify-between bg-cream-dark/30 rounded-lg px-3 py-2">
                  <span className="text-xs text-ink truncate flex-1 mr-2">{formData.videoUrl}</span>
                  <button
                    onClick={() => handleChange('videoUrl', '')}
                    className="text-ink-light hover:text-error transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Subtítulos del video */}
              {formData.videoUrl && (() => {
                const isDirect = getVideoProvider(formData.videoUrl) === 'direct';
                const unsavedVideo = formData.videoUrl !== (teacher?.videoUrl || '');
                const jobActive = subtitleJob?.status === 'queued' || subtitleJob?.status === 'processing';
                const generateDisabled = !isDirect || unsavedVideo || jobActive;
                const generateTitle = !isDirect
                  ? 'Solo disponible para videos MP4 subidos a la plataforma (no YouTube/Vimeo).'
                  : unsavedVideo
                    ? 'Guardá los cambios primero para generar subtítulos del video subido.'
                    : 'Transcribe el audio y genera subtítulos en español e inglés.';
                return (
                  <div className="pt-3 mt-1 border-t border-chocolate-100/20">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-medium text-ink-light uppercase tracking-wide mr-1">Subtítulos</span>
                      {formData.videoSubtitles.map(s => (
                        <span
                          key={s.lang}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-chocolate-50 text-[11px] text-chocolate font-medium"
                          title={s.source === 'auto' ? 'Generado automáticamente' : 'Subido manualmente'}
                        >
                          {s.lang.toUpperCase()} · {s.source === 'auto' ? 'auto' : 'manual'}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtitle(s.lang)}
                            className="text-ink-light hover:text-error transition-colors"
                            title="Quitar subtítulo (se aplica al guardar)"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {formData.videoSubtitles.length === 0 && (
                        <span className="text-[11px] text-ink-light/70 mr-1">Sin subtítulos aún</span>
                      )}
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => handlePickSubtitleFile('es')}
                        disabled={uploadingSubtitle}
                        className="px-2 py-0.5 text-[11px] font-medium text-chocolate bg-chocolate-50 rounded-lg hover:bg-chocolate-100/40 transition-colors disabled:opacity-50"
                      >
                        Subir ES
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePickSubtitleFile('en')}
                        disabled={uploadingSubtitle}
                        className="px-2 py-0.5 text-[11px] font-medium text-chocolate bg-chocolate-50 rounded-lg hover:bg-chocolate-100/40 transition-colors disabled:opacity-50"
                      >
                        Subir EN
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateSubtitles}
                        disabled={generateDisabled}
                        title={generateTitle}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-parchment bg-chocolate rounded-lg hover:bg-chocolate/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Sparkles className="w-3 h-3" />
                        Generar con IA
                      </button>
                    </div>
                    {jobActive && (
                      <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-ink-light">
                        <Loader2 className="w-3 h-3 animate-spin text-chocolate" />
                        {subtitleJob?.step || 'Procesando…'}
                      </p>
                    )}
                    <p className="mt-1.5 text-[11px] text-ink-light/80">
                      Formatos manuales: .vtt o .srt. Los subtítulos generados con IA se guardan solos;
                      los subidos o quitados manualmente se aplican al guardar el perfil.
                    </p>
                  </div>
                );
              })()}

              <input
                type="file"
                ref={subtitleInputRef}
                onChange={handleSubtitleUpload}
                accept=".vtt,.srt,text/vtt"
                className="hidden"
              />
            </div>
          </div>

          {/* Traducción al inglés */}
          <EnglishSection onAutoTranslate={handleAutoTranslate} translating={translating} defaultOpen={!!formData.enTitle}>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Título profesional (EN)</label>
              <input
                type="text"
                value={formData.enTitle}
                onChange={e => setFormData(prev => ({ ...prev, enTitle: e.target.value }))}
                placeholder={formData.title || 'e.g. Trial Attorney & Law Professor'}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Biografía (EN)</label>
              <textarea
                value={formData.enBio}
                onChange={e => setFormData(prev => ({ ...prev, enBio: e.target.value }))}
                rows={6}
                className={`${INPUT} resize-y`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Credenciales (EN)
                <span className="text-xs text-ink-light font-normal ml-1">— una por línea</span>
              </label>
              <textarea
                value={formData.enCredentials.join('\n')}
                onChange={e => setFormData(prev => ({ ...prev, enCredentials: e.target.value.split('\n') }))}
                rows={4}
                className={`${INPUT} resize-y`}
              />
            </div>
          </EnglishSection>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 btn-primary btn-lg rounded-xl disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <Save className="w-4.5 h-4.5" />
              )}
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
