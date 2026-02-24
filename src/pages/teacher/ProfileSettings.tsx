import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Plus, X, Loader2, Save, Video, GripVertical } from 'lucide-react';
import { teacherService } from '@/services/teacher';
import { uploadsService } from '@/services/uploads';
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
    try {
      const { url } = await uploadsService.uploadVideo(file);
      handleChange('videoUrl', url);
      toast.success('Video subido correctamente.');
    } catch {
      toast.error('Error al subir el video.');
    } finally {
      setIsUploadingVideo(false);
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
                  {isUploadingVideo ? 'Subiendo...' : 'Subir'}
                </button>
              </div>

              <input
                type="file"
                ref={videoInputRef}
                onChange={handleVideoUpload}
                accept="video/mp4"
                className="hidden"
              />

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
