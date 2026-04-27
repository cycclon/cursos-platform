import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Camera, Plus, X, Loader2, Save, Video, GripVertical,
  CheckCircle2, CreditCard, ExternalLink, Unlink, AlertCircle,
} from 'lucide-react';
import { teacherService } from '@/services/teacher';
import { uploadsService } from '@/services/uploads';
import { mercadoPagoService } from '@/services/mercadoPago';
import { useToast } from '@/context/ToastContext';

const INPUT = 'w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all';

export default function ProfileSettings() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher'],
    queryFn: teacherService.getTeacher,
  });

  const { data: mpStatus, isLoading: mpLoading } = useQuery({
    queryKey: ['mercadopago-status'],
    queryFn: mercadoPagoService.getStatus,
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

  const [formData, setFormData] = useState({
    title: '',
    bio: '',
    photoUrl: '',
    credentials: [] as string[],
    videoUrl: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  useEffect(() => {
    if (teacher) {
      setFormData({
        title: teacher.title || '',
        bio: teacher.bio || '',
        photoUrl: teacher.photoUrl || '',
        credentials: teacher.credentials || [],
        videoUrl: teacher.videoUrl || '',
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

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.bio.trim()) {
      toast.error('El título y la biografía son obligatorios.');
      return;
    }
    setIsSaving(true);
    try {
      const cleanCredentials = formData.credentials.filter(c => c.trim());
      await teacherService.updateTeacher({
        ...formData,
        credentials: cleanCredentials,
        videoUrl: formData.videoUrl || undefined,
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

          {/* Mercado Pago connection */}
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
                Formato: MP4. Máximo 500 MB. Este video aparecerá en tu página "Sobre Mí".
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
            </div>
          </div>

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
