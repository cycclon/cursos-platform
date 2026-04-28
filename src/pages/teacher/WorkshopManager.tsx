import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit3, Eye, Trash2, CalendarDays, X, Check, DollarSign, MoreVertical,
  Video, MapPin, Users, Clock,
} from 'lucide-react';
import { coursesService } from '@/services/courses';
import { workshopsService } from '@/services/workshops';
import { workshopRegistrationsService } from '@/services/workshopRegistrations';
import { formatPrice } from '@/utils/format';
import { generateSlug } from '@/utils/slug';
import { AVAILABILITY_OPTIONS } from '@/utils/availability';
import { useToast } from '@/context/ToastContext';
import type { Workshop, WorkshopModality } from '@/types';

const INPUT = 'w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all';
const SELECT = 'w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all appearance-none cursor-pointer';

type WorkshopFormState = {
  title: string;
  slug: string;
  category: string;
  summary: string;
  description: string;
  imageUrl: string;
  price: number;
  discountPrice: number | undefined;
  scheduledAt: string;
  durationMinutes: number;
  modality: WorkshopModality;
  meetingUrl: string;
  location: string;
  capacity: number | undefined;
  prerequisiteCourseIds: string[];
  prerequisitesText: string[];
  availability: string;
  featured: boolean;
};

const emptyForm: WorkshopFormState = {
  title: '',
  slug: '',
  category: '',
  summary: '',
  description: '',
  imageUrl: '',
  price: 0,
  discountPrice: undefined,
  scheduledAt: '',
  durationMinutes: 60,
  modality: 'online',
  meetingUrl: '',
  location: '',
  capacity: undefined,
  prerequisiteCourseIds: [],
  prerequisitesText: [],
  availability: 'Disponible',
  featured: false,
};

function toLocalDatetimeInput(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatScheduledAt(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'long', timeStyle: 'short' }).format(d);
}

export default function WorkshopManager() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: workshops = [], isLoading: loadingWorkshops } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => workshopsService.getWorkshops(),
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [formData, setFormData] = useState<WorkshopFormState>(emptyForm);
  const [newPrereqText, setNewPrereqText] = useState('');
  const [rosterWorkshopId, setRosterWorkshopId] = useState<string | null>(null);

  const handleCreate = () => {
    setEditingWorkshop(null);
    setFormData(emptyForm);
    setIsEditing(true);
  };

  const handleEdit = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setFormData({
      title: workshop.title,
      slug: workshop.slug,
      category: workshop.category,
      summary: workshop.summary,
      description: workshop.description,
      imageUrl: workshop.imageUrl,
      price: workshop.price,
      discountPrice: workshop.discountPrice,
      scheduledAt: toLocalDatetimeInput(workshop.scheduledAt),
      durationMinutes: workshop.durationMinutes,
      modality: workshop.modality,
      meetingUrl: workshop.meetingUrl ?? '',
      location: workshop.location ?? '',
      capacity: workshop.capacity,
      prerequisiteCourseIds: workshop.prerequisiteCourseIds ?? [],
      prerequisitesText: workshop.prerequisitesText ?? [],
      availability: workshop.availability,
      featured: workshop.featured,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    const workshop = workshops.find(w => w.id === id);
    if (!workshop) return;
    if (!window.confirm(`¿Eliminar el taller "${workshop.title}"? Se borrarán todas sus inscripciones.`)) return;
    try {
      await workshopsService.deleteWorkshop(workshop.slug);
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      toast.success('Taller eliminado.');
    } catch {
      toast.error('Error al eliminar el taller.');
    }
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug === generateSlug(prev.title) || !prev.slug
        ? generateSlug(title)
        : prev.slug,
    }));
  };

  const handleCourseToggle = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      prerequisiteCourseIds: prev.prerequisiteCourseIds.includes(courseId)
        ? prev.prerequisiteCourseIds.filter(id => id !== courseId)
        : [...prev.prerequisiteCourseIds, courseId],
    }));
  };

  const handleAddPrereqText = () => {
    const trimmed = newPrereqText.trim();
    if (!trimmed) return;
    setFormData(prev => ({ ...prev, prerequisitesText: [...prev.prerequisitesText, trimmed] }));
    setNewPrereqText('');
  };

  const handleRemovePrereqText = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      prerequisitesText: prev.prerequisitesText.filter((_, i) => i !== idx),
    }));
  };

  const discountPercentage =
    formData.price > 0 && formData.discountPrice && formData.discountPrice < formData.price
      ? Math.round((1 - formData.discountPrice / formData.price) * 100)
      : 0;

  const validateBeforeSave = (): string | null => {
    if (!formData.title) return 'Falta el título.';
    if (!formData.slug) return 'Falta el slug.';
    if (!formData.category) return 'Falta la categoría.';
    if (!formData.summary) return 'Falta el resumen.';
    if (!formData.description) return 'Falta la descripción.';
    if (!formData.scheduledAt) return 'Falta la fecha y hora del taller.';
    if (formData.durationMinutes <= 0) return 'La duración debe ser mayor a 0.';
    if (formData.modality === 'online' && !formData.meetingUrl.trim()) {
      return 'Para talleres online, ingresá el enlace de la sala.';
    }
    if (formData.modality === 'presencial' && !formData.location.trim()) {
      return 'Para talleres presenciales, ingresá la dirección.';
    }
    return null;
  };

  const handleSave = async () => {
    const errorMsg = validateBeforeSave();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    const discountLabel =
      discountPercentage > 0 ? `${discountPercentage}% OFF` : '';

    const payload = {
      title: formData.title,
      slug: formData.slug,
      category: formData.category,
      summary: formData.summary,
      description: formData.description,
      imageUrl: formData.imageUrl,
      price: formData.price,
      discountPrice: formData.discountPrice,
      discountLabel,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
      durationMinutes: formData.durationMinutes,
      modality: formData.modality,
      meetingUrl: formData.modality === 'online' ? formData.meetingUrl : undefined,
      location: formData.modality === 'presencial' ? formData.location : undefined,
      capacity: formData.capacity,
      prerequisiteCourseIds: formData.prerequisiteCourseIds,
      prerequisitesText: formData.prerequisitesText,
      availability: formData.availability,
      featured: formData.featured,
    };

    try {
      if (editingWorkshop) {
        await workshopsService.updateWorkshop(editingWorkshop.slug, payload as Partial<Workshop>);
        toast.success('Taller actualizado correctamente.');
      } else {
        await workshopsService.createWorkshop(payload as Partial<Workshop>);
        toast.success('Taller creado correctamente.');
      }
      queryClient.invalidateQueries({ queryKey: ['workshops'] });
      setIsEditing(false);
      setEditingWorkshop(null);
    } catch {
      toast.error('Error al guardar el taller.');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingWorkshop(null);
  };

  const isLoading = loadingCourses || loadingWorkshops;

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-8 bg-parchment rounded animate-pulse w-40" />
            <div className="h-4 bg-parchment rounded animate-pulse w-64 mt-2" />
          </div>
          <div className="h-10 w-32 bg-parchment rounded-xl animate-pulse" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 h-36 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Roster sub-view ─────────────────────────────── */
  if (rosterWorkshopId) {
    const workshop = workshops.find(w => w.id === rosterWorkshopId);
    if (!workshop) {
      setRosterWorkshopId(null);
      return null;
    }
    return (
      <RosterView
        workshop={workshop}
        onBack={() => setRosterWorkshopId(null)}
      />
    );
  }

  /* ── Form view ───────────────────────────────────── */
  if (isEditing) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
            {editingWorkshop ? 'Editar Taller' : 'Nuevo Taller'}
          </h1>
          <p className="text-ink-light mt-1">
            {editingWorkshop
              ? 'Modificá los datos del taller.'
              : 'Creá un nuevo taller en vivo, online o presencial.'}
          </p>
        </div>

        <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm p-6 space-y-6">
          {/* Title + Slug */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Título</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Ej: Taller de Cierre — Práctica Profesional"
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                placeholder="taller-cierre-practica"
                className={INPUT}
              />
            </div>
          </div>

          {/* Category + Image URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Categoría</label>
              <input
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Práctica profesional"
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">URL de Imagen</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className={INPUT}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Resumen</label>
            <input
              type="text"
              value={formData.summary}
              onChange={e => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Una línea para los listados públicos."
              className={INPUT}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describí qué se trabajará en el taller..."
              rows={4}
              className={`${INPUT} resize-none`}
            />
          </div>

          {/* Date + Duration + Capacity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Fecha y hora</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Duración (minutos)</label>
              <input
                type="number"
                min={1}
                value={formData.durationMinutes || ''}
                onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                className={INPUT}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Cupo (opcional)</label>
              <input
                type="number"
                min={1}
                value={formData.capacity ?? ''}
                onChange={e => setFormData({
                  ...formData,
                  capacity: e.target.value ? Number(e.target.value) : undefined,
                })}
                placeholder="Sin límite"
                className={INPUT}
              />
            </div>
          </div>

          {/* Modality */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Modalidad</label>
            <div className="flex gap-3">
              {(['online', 'presencial'] as WorkshopModality[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setFormData({ ...formData, modality: m })}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    formData.modality === m
                      ? 'bg-chocolate-50 border-chocolate/40 text-chocolate'
                      : 'bg-parchment border-chocolate-100/40 text-ink-light hover:border-chocolate/30'
                  }`}
                >
                  {m === 'online' ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  {m === 'online' ? 'Online' : 'Presencial'}
                </button>
              ))}
            </div>
          </div>

          {/* MeetingUrl OR Location */}
          {formData.modality === 'online' ? (
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Enlace de la sala (Zoom, Meet, etc.)</label>
              <input
                type="url"
                value={formData.meetingUrl}
                onChange={e => setFormData({ ...formData, meetingUrl: e.target.value })}
                placeholder="https://us02web.zoom.us/j/..."
                className={INPUT}
              />
              <p className="text-xs text-ink-light mt-1.5">
                El enlace solo se mostrará a los alumnos que hayan completado los cursos correlativos requeridos.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Dirección del encuentro</label>
              <textarea
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Av. Corrientes 1234, CABA"
                rows={2}
                className={`${INPUT} resize-none`}
              />
              <p className="text-xs text-ink-light mt-1.5">
                La dirección solo se mostrará a los alumnos que hayan completado los cursos correlativos requeridos.
              </p>
            </div>
          )}

          {/* Prerequisite courses (multi-select) */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Cursos correlativos requeridos</label>
            <p className="text-xs text-ink-light mb-2">
              Los alumnos deben completar estos cursos para acceder al taller (ver el enlace o la dirección).
              No bloquea la compra.
            </p>
            {courses.length === 0 ? (
              <p className="text-sm text-ink-light italic">No hay cursos creados aún.</p>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto border border-chocolate-100/30 rounded-xl p-3 bg-cream/50">
                {courses.map(course => (
                  <div
                    key={course.id}
                    onClick={() => handleCourseToggle(course.id)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                      formData.prerequisiteCourseIds.includes(course.id)
                        ? 'bg-chocolate-50 border border-chocolate/20'
                        : 'hover:bg-cream-dark/30 border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.prerequisiteCourseIds.includes(course.id)}
                      onChange={e => e.stopPropagation()}
                      onClick={e => e.stopPropagation()}
                      readOnly
                      className="w-4 h-4 rounded accent-chocolate pointer-events-none"
                    />
                    <span className="text-sm text-ink flex-1">{course.title}</span>
                    <span className="text-xs text-ink-light font-medium">{formatPrice(course.price)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Free-text prereqs */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Prerrequisitos adicionales (texto libre)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPrereqText}
                onChange={e => setNewPrereqText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPrereqText();
                  }
                }}
                placeholder="Ej: Conocimientos básicos de derecho civil"
                className={INPUT}
              />
              <button
                type="button"
                onClick={handleAddPrereqText}
                className="inline-flex items-center gap-1.5 btn-ghost btn-md rounded-xl"
              >
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </div>
            {formData.prerequisitesText.length > 0 && (
              <ul className="space-y-1.5">
                {formData.prerequisitesText.map((p, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 px-3 py-2 bg-cream/60 rounded-lg text-sm text-ink"
                  >
                    <span className="flex-1">{p}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePrereqText(idx)}
                      className="text-ink-light hover:text-error transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Price + DiscountPrice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Precio (ARS)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                <input
                  type="number"
                  min={0}
                  value={formData.price || ''}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  className={`${INPUT} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Precio con descuento (opcional)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                <input
                  type="number"
                  min={0}
                  value={formData.discountPrice ?? ''}
                  onChange={e => setFormData({
                    ...formData,
                    discountPrice: e.target.value ? Number(e.target.value) : undefined,
                  })}
                  className={`${INPUT} pl-9`}
                />
              </div>
              {discountPercentage > 0 && (
                <p className="mt-2 text-sm font-semibold text-success">Descuento: {discountPercentage}%</p>
              )}
            </div>
          </div>

          {/* Availability + Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Disponibilidad</label>
              <select
                value={formData.availability}
                onChange={e => setFormData({ ...formData, availability: e.target.value })}
                className={SELECT}
              >
                {AVAILABILITY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="pt-7">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded accent-chocolate"
                />
                <span className="text-sm text-ink font-medium">Marcar como destacado en la Landing</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-chocolate-100/20">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl"
            >
              <Check className="w-4 h-4" />
              Guardar
            </button>
            <button onClick={handleCancel} className="inline-flex items-center gap-2 btn-ghost btn-md rounded-xl">
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── List view ───────────────────────────────────── */
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Mis Talleres</h1>
          <p className="text-ink-light mt-1">Creá y gestioná talleres en vivo, online o presenciales.</p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
          <Plus className="w-4 h-4" />
          Nuevo Taller
        </button>
      </div>

      {workshops.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays className="w-12 h-12 text-ink-light/30 mx-auto mb-4" />
          <p className="text-ink-light text-lg mb-4">No hay talleres creados aún.</p>
          <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
            <Plus className="w-4 h-4" />
            Crear primer taller
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {workshops.map(workshop => (
            <div
              key={workshop.id}
              className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden card-accent"
            >
              <div className="flex flex-col md:flex-row gap-4 p-5">
                {/* Image */}
                <div className="w-full md:w-48 aspect-video md:aspect-[4/3] rounded-lg overflow-hidden shrink-0 bg-chocolate-50">
                  {workshop.imageUrl && (
                    <img src={workshop.imageUrl} alt={workshop.title} className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gold uppercase tracking-wider">Taller</span>
                        {workshop.featured && (
                          <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                            Destacado
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-chocolate bg-chocolate-50 px-2 py-0.5 rounded-full uppercase">
                          {workshop.modality}
                        </span>
                        {workshop.discountLabel && (
                          <span className="text-[10px] font-bold text-error bg-error-light px-2 py-0.5 rounded-full">
                            {workshop.discountLabel}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-lg font-bold text-ink">{workshop.title}</h3>
                    </div>
                    <button className="p-2 rounded-lg text-ink-light hover:bg-cream-dark transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-ink-light mt-1 line-clamp-1">{workshop.summary}</p>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-ink-light">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {formatScheduledAt(workshop.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {workshop.durationMinutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {workshop.registeredCount}
                      {workshop.capacity ? ` / ${workshop.capacity}` : ''} inscriptos
                    </span>
                    <span className="font-semibold text-chocolate">
                      {workshop.discountPrice ? formatPrice(workshop.discountPrice) : formatPrice(workshop.price)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <button onClick={() => handleEdit(workshop)} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                      <Edit3 className="w-3 h-3" />
                      Editar
                    </button>
                    <button onClick={() => setRosterWorkshopId(workshop.id)} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                      <Users className="w-3 h-3" />
                      Inscriptos
                    </button>
                    <Link
                      to={`/talleres/${workshop.slug}`}
                      className="inline-flex items-center gap-1.5 btn-secondary btn-sm rounded-lg"
                    >
                      <Eye className="w-3 h-3" />
                      Vista previa
                    </Link>
                    <button onClick={() => handleDelete(workshop.id)} className="inline-flex items-center gap-1.5 btn-danger btn-sm rounded-lg">
                      <Trash2 className="w-3 h-3" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Roster view component ───────────────────────────── */
function RosterView({ workshop, onBack }: { workshop: Workshop; onBack: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: roster = [], isLoading } = useQuery({
    queryKey: ['workshop-roster', workshop.id],
    queryFn: () => workshopRegistrationsService.getRoster(workshop.id),
  });

  const handleMark = async (id: string, status: 'attended' | 'no_show') => {
    try {
      await workshopRegistrationsService.markAttendance(id, status);
      queryClient.invalidateQueries({ queryKey: ['workshop-roster', workshop.id] });
      toast.success('Asistencia actualizada.');
    } catch {
      toast.error('No se pudo actualizar la asistencia.');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Inscriptos</h1>
          <p className="text-ink-light mt-1">{workshop.title}</p>
        </div>
        <button onClick={onBack} className="inline-flex items-center gap-2 btn-ghost btn-md rounded-xl">
          <X className="w-4 h-4" />
          Cerrar
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-20 bg-parchment rounded-xl animate-pulse" />
          ))}
        </div>
      ) : roster.length === 0 ? (
        <div className="text-center py-16 bg-parchment rounded-xl border border-chocolate-100/20">
          <Users className="w-12 h-12 text-ink-light/30 mx-auto mb-4" />
          <p className="text-ink-light text-lg">Aún no hay inscriptos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roster.map(entry => (
            <div
              key={entry.id}
              className="bg-parchment rounded-xl border border-chocolate-100/20 p-4 flex flex-col md:flex-row md:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink">{entry.student?.name ?? 'Alumno'}</p>
                <p className="text-xs text-ink-light">{entry.student?.email ?? ''}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    entry.attendanceStatus === 'attended'
                      ? 'text-success bg-success/10'
                      : entry.attendanceStatus === 'cancelled'
                        ? 'text-error bg-error-light'
                        : entry.attendanceStatus === 'no_show'
                          ? 'text-error bg-error-light'
                          : 'text-chocolate bg-chocolate-50'
                  }`}>
                    {entry.attendanceStatus}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    entry.eligible ? 'text-success bg-success/10' : 'text-ink-light bg-cream-dark'
                  }`}>
                    {entry.eligible ? 'Elegible' : `Falta: ${entry.missing.map(m => m.title).join(', ')}`}
                  </span>
                </div>
              </div>

              {entry.attendanceStatus === 'registered' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMark(entry.id, 'attended')}
                    className="inline-flex items-center gap-1.5 btn-secondary btn-sm rounded-lg"
                  >
                    <Check className="w-3 h-3" />
                    Asistió
                  </button>
                  <button
                    onClick={() => handleMark(entry.id, 'no_show')}
                    className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg"
                  >
                    <X className="w-3 h-3" />
                    Ausente
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
