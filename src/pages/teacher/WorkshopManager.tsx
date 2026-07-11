import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit3, Eye, Trash2, CalendarDays, X, Check, DollarSign, MoreVertical,
  Video, MapPin, Users, Clock, ArrowLeft, BookOpen, CheckCircle2, Lock,
  GraduationCap, FileWarning, Search, Bell, Mail,
} from 'lucide-react';
import { coursesService } from '@/services/courses';
import { workshopsService } from '@/services/workshops';
import { workshopRegistrationsService } from '@/services/workshopRegistrations';
import { ProgressBar, Avatar, StatCard } from '@/components/progress/visuals';
import { toneFor } from '@/components/progress/tone';
import ReminderComposeModal from '@/components/reminders/ReminderComposeModal';
import WorkshopBulkReminderModal from '@/components/reminders/WorkshopBulkReminderModal';
import EnglishSection from '@/components/teacher/EnglishSection';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { formatPrice } from '@/utils/format';
import { generateSlug } from '@/utils/slug';
import { AVAILABILITY_OPTIONS } from '@/utils/availability';
import { pruneEn } from '@/utils/translations';
import { useToast } from '@/context/ToastContext';
import type {
  Workshop, WorkshopModality, WorkshopRosterEntry, PrereqProgress, AttendanceStatus,
} from '@/types';

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
  priceUsd: number | undefined;
  discountPriceUsd: number | undefined;
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
  translations: NonNullable<Workshop['translations']>;
};

type WorkshopEn = NonNullable<NonNullable<Workshop['translations']>['en']>;

const emptyForm: WorkshopFormState = {
  title: '',
  slug: '',
  category: '',
  summary: '',
  description: '',
  imageUrl: '',
  price: 0,
  discountPrice: undefined,
  priceUsd: undefined,
  discountPriceUsd: undefined,
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
  translations: { en: {} },
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

function fmtShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
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
      priceUsd: workshop.priceUsd,
      discountPriceUsd: workshop.discountPriceUsd,
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
      translations: { en: { ...(workshop.translations?.en ?? {}) } },
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

  /* ── English translation ─────────────────────────── */

  const { translating, runTranslate } = useAutoTranslate();

  const setWorkshopEn = (field: keyof WorkshopEn, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      translations: { en: { ...(prev.translations.en ?? {}), [field]: value } },
    }));
  };

  const handleAutoTranslate = async () => {
    const draft: WorkshopEn = { ...(formData.translations.en ?? {}) };
    const slots: { text: string; apply: (v: string) => void }[] = [];

    const scalarFields: { key: keyof WorkshopEn; value: string }[] = [
      { key: 'title', value: formData.title },
      { key: 'summary', value: formData.summary },
      { key: 'description', value: formData.description },
      { key: 'category', value: formData.category },
      { key: 'location', value: formData.modality === 'presencial' ? formData.location : '' },
    ];
    for (const f of scalarFields) {
      if (f.value.trim() && !((draft[f.key] as string | undefined) ?? '').trim()) {
        slots.push({ text: f.value, apply: v => { (draft[f.key] as string) = v; } });
      }
    }
    const canonicalPrereqs = formData.prerequisitesText.map(s => s.trim()).filter(Boolean);
    if (canonicalPrereqs.length > 0 && (draft.prerequisitesText ?? []).filter(s => s.trim()).length === 0) {
      const acc: string[] = new Array(canonicalPrereqs.length).fill('');
      canonicalPrereqs.forEach((item, idx) =>
        slots.push({ text: item, apply: v => { acc[idx] = v; draft.prerequisitesText = acc; } }),
      );
    }

    if (slots.length === 0) {
      toast.success('No hay campos en inglés pendientes de completar.');
      return;
    }
    const translations = await runTranslate(
      slots.map(s => s.text),
      'Ficha pública de un taller de litigación en vivo',
    );
    if (!translations) return;
    slots.forEach((s, i) => s.apply(translations[i]));
    setFormData(prev => ({ ...prev, translations: { en: draft } }));
    toast.success(`${slots.length} campo${slots.length !== 1 ? 's' : ''} traducido${slots.length !== 1 ? 's' : ''}. Revisá antes de guardar.`);
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
      priceUsd: formData.priceUsd,
      discountPriceUsd: formData.discountPriceUsd,
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
      translations: { en: pruneEn(formData.translations.en) },
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

          {/* USD prices — international (Lemon Squeezy) lane */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Precio (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                <input
                  type="number"
                  min={0}
                  value={formData.priceUsd ?? ''}
                  onChange={e => setFormData({ ...formData, priceUsd: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Sin venta internacional"
                  className={`${INPUT} pl-9`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Precio con descuento (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                <input
                  type="number"
                  min={0}
                  value={formData.discountPriceUsd ?? ''}
                  onChange={e => setFormData({ ...formData, discountPriceUsd: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="Opcional"
                  className={`${INPUT} pl-9`}
                />
              </div>
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

          {/* Traducción al inglés */}
          <EnglishSection onAutoTranslate={handleAutoTranslate} translating={translating} defaultOpen={!!formData.translations.en?.title}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1.5">Título (EN)</label>
                <input
                  type="text"
                  value={formData.translations.en?.title ?? ''}
                  onChange={e => setWorkshopEn('title', e.target.value)}
                  placeholder={formData.title || 'Workshop title'}
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Categoría (EN)</label>
                <input
                  type="text"
                  value={formData.translations.en?.category ?? ''}
                  onChange={e => setWorkshopEn('category', e.target.value)}
                  placeholder={formData.category || 'Category'}
                  className={INPUT}
                />
              </div>
              {formData.modality === 'presencial' && (
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Dirección (EN)</label>
                  <input
                    type="text"
                    value={formData.translations.en?.location ?? ''}
                    onChange={e => setWorkshopEn('location', e.target.value)}
                    placeholder={formData.location || 'Venue address'}
                    className={INPUT}
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1.5">Resumen (EN)</label>
                <textarea
                  value={formData.translations.en?.summary ?? ''}
                  onChange={e => setWorkshopEn('summary', e.target.value)}
                  rows={2}
                  className={`${INPUT} resize-none`}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1.5">Descripción (EN)</label>
                <textarea
                  value={formData.translations.en?.description ?? ''}
                  onChange={e => setWorkshopEn('description', e.target.value)}
                  rows={4}
                  className={`${INPUT} resize-y`}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Requisitos (EN)
                  <span className="text-xs text-ink-light font-normal ml-1">— uno por línea</span>
                </label>
                <textarea
                  value={(formData.translations.en?.prerequisitesText ?? []).join('\n')}
                  onChange={e => setWorkshopEn('prerequisitesText', e.target.value.split('\n'))}
                  rows={3}
                  className={`${INPUT} resize-y`}
                />
              </div>
            </div>
          </EnglishSection>

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

/* ── Roster view ─────────────────────────────────────────
 * Lists everyone who bought the workshop and — the point of this view — how far
 * each student has progressed through the required correlativas, so the teacher
 * can nudge the ones who won't be eligible by the workshop date.
 * ─────────────────────────────────────────────────────── */

const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  registered: 'Inscripto',
  attended: 'Asistió',
  cancelled: 'Cancelado',
  no_show: 'Ausente',
};

const ATTENDANCE_TONES: Record<AttendanceStatus, string> = {
  registered: 'text-chocolate bg-chocolate-50',
  attended: 'text-success bg-success/15',
  cancelled: 'text-error bg-error-light',
  no_show: 'text-error bg-error-light',
};

function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${ATTENDANCE_TONES[status]}`}>
      {ATTENDANCE_LABELS[status]}
    </span>
  );
}

function EligibilityBadge({ eligible, total, done }: { eligible: boolean; total: number; done: number }) {
  if (total === 0 || eligible) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide text-success bg-success/15">
        <CheckCircle2 className="w-3 h-3" />
        Listo para el taller
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide text-gold-dark bg-gold/15">
      <Lock className="w-3 h-3" />
      Faltan {total - done}
    </span>
  );
}

function CorrelativaRow({ prereq }: { prereq: PrereqProgress }) {
  const { title, progress, completed, enrolled, hasTest, testPassed } = prereq;
  const tone = toneFor(progress);
  // The exam gates eligibility even when every video is watched — surface it.
  const testPending = hasTest && testPassed !== true;

  const Icon = completed ? CheckCircle2 : enrolled ? BookOpen : Lock;
  const iconColor = completed ? 'text-success' : enrolled ? 'text-chocolate' : 'text-ink-light/40';

  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink truncate">{title}</span>
          {testPending && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-gold-dark bg-gold/15 px-1.5 py-0.5 rounded-full shrink-0">
              <FileWarning className="w-3 h-3" />
              Examen
            </span>
          )}
          {!enrolled && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-ink-light/70 bg-cream-dark px-1.5 py-0.5 rounded-full shrink-0">
              No inscripto
            </span>
          )}
        </div>
        <ProgressBar value={progress} className="mt-1.5" />
      </div>
      <span className={`text-sm font-bold tabular-nums w-11 text-right shrink-0 ${tone.text}`}>
        {progress}%
      </span>
    </div>
  );
}

function RosterEntryCard({
  entry,
  index,
  onMark,
  onCompose,
}: {
  entry: WorkshopRosterEntry;
  index: number;
  onMark: (id: string, status: 'attended' | 'no_show') => void;
  onCompose: (student: { id: string; name: string }) => void;
}) {
  // Blockers first (incomplete, lowest progress on top), completed sink to the bottom.
  const prereqs = [...entry.prereqProgress].sort(
    (a, b) => Number(a.completed) - Number(b.completed) || a.progress - b.progress,
  );
  const total = prereqs.length;
  const done = prereqs.filter(p => p.completed).length;
  // Only worth a reminder when a correlativa is actually in progress (the email is
  // about resuming pending modules — exam-only blockers have nothing to remind).
  const canRemind = !entry.eligible && prereqs.some(p => p.enrolled && p.progress < 100);
  const showFooter = canRemind || entry.attendanceStatus === 'registered'
    || (entry.staleDays != null && !entry.eligible) || !!entry.lastReminderAt;

  return (
    <div
      className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm card-accent p-5 animate-fade-in-up opacity-0"
      style={{ animationDelay: `${Math.min(index, 10) * 55}ms` }}
    >
      {/* Header: student + status */}
      <div className="flex items-start gap-3">
        <Avatar name={entry.student?.name ?? 'Alumno'} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-ink truncate">{entry.student?.name ?? 'Alumno'}</p>
          <p className="text-xs text-ink-light truncate">{entry.student?.email ?? ''}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <AttendanceBadge status={entry.attendanceStatus} />
          <EligibilityBadge eligible={entry.eligible} total={total} done={done} />
        </div>
      </div>

      {/* Correlativas progress */}
      <div className="mt-4 rounded-lg border border-chocolate-100/30 bg-cream/40 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink uppercase tracking-wide">
            <GraduationCap className="w-3.5 h-3.5 text-chocolate" />
            Cursos correlativos
          </span>
          {total > 0 && (
            <span className="text-xs font-medium text-ink-light tabular-nums">{done}/{total} completados</span>
          )}
        </div>
        {total === 0 ? (
          <p className="text-xs text-ink-light italic mt-2">Este taller no requiere cursos correlativos.</p>
        ) : (
          <div className="mt-1 divide-y divide-chocolate-100/30">
            {prereqs.map(p => <CorrelativaRow key={p.id} prereq={p} />)}
          </div>
        )}
      </div>

      {/* Footer: activity context + actions */}
      {showFooter && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-light">
            {entry.staleDays != null && !entry.eligible && (
              <span className={`inline-flex items-center gap-1 tabular-nums ${entry.staleDays >= 14 ? 'text-gold-dark font-medium' : ''}`}>
                <Clock className="w-3.5 h-3.5" />
                {entry.staleDays === 0 ? 'Con actividad hoy' : `Sin actividad hace ${entry.staleDays} d`}
              </span>
            )}
            {entry.lastReminderAt && (
              <span className="inline-flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                Recordado el {fmtShortDate(entry.lastReminderAt)}
              </span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {canRemind && (
              <button
                onClick={() => onCompose({ id: entry.studentId, name: entry.student?.name ?? 'Alumno' })}
                className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg"
              >
                <Mail className="w-3 h-3" />
                Recordatorio
              </button>
            )}
            {entry.attendanceStatus === 'registered' && (
              <>
                <button
                  onClick={() => onMark(entry.id, 'attended')}
                  className="inline-flex items-center gap-1.5 btn-secondary btn-sm rounded-lg"
                >
                  <Check className="w-3 h-3" />
                  Marcar asistió
                </button>
                <button
                  onClick={() => onMark(entry.id, 'no_show')}
                  className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg"
                >
                  <X className="w-3 h-3" />
                  Ausente
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function RosterView({ workshop, onBack }: { workshop: Workshop; onBack: () => void }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const [composeStudent, setComposeStudent] = useState<{ id: string; name: string } | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: roster = [], isLoading } = useQuery({
    queryKey: ['workshop-roster', workshop.id],
    queryFn: () => workshopRegistrationsService.getRoster(workshop.id),
  });

  const invalidateRoster = () =>
    queryClient.invalidateQueries({ queryKey: ['workshop-roster', workshop.id] });

  const handleMark = async (id: string, status: 'attended' | 'no_show') => {
    try {
      await workshopRegistrationsService.markAttendance(id, status);
      queryClient.invalidateQueries({ queryKey: ['workshop-roster', workshop.id] });
      toast.success('Asistencia actualizada.');
    } catch {
      toast.error('No se pudo actualizar la asistencia.');
    }
  };

  const active = roster.filter(r => r.attendanceStatus !== 'cancelled');
  const eligibleCount = active.filter(r => r.eligible).length;
  const pendingCount = active.length - eligibleCount;

  const q = search.trim().toLowerCase();
  const filtered = roster.filter(r => {
    if (onlyPending && r.eligible) return false;
    if (!q) return true;
    return (r.student?.name ?? '').toLowerCase().includes(q)
      || (r.student?.email ?? '').toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-chocolate transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a talleres
          </button>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Inscriptos y correlativas</h1>
          <p className="text-ink-light mt-1">{workshop.title}</p>
          <p className="text-xs text-ink-light mt-0.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            {formatScheduledAt(workshop.scheduledAt)}
          </p>
        </div>
        {workshop.prerequisiteCourseIds.length > 0 && pendingCount > 0 && (
          <button
            onClick={() => setBulkOpen(true)}
            className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl shrink-0"
          >
            <Bell className="w-4 h-4" />
            Enviar recordatorios
          </button>
        )}
      </div>

      {!isLoading && active.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard icon={Users} label="Inscriptos" value={String(active.length)} accent="bg-chocolate-50 text-chocolate" />
          <StatCard icon={CheckCircle2} label="Listos para el taller" value={String(eligibleCount)} accent="bg-success-light text-success" />
          <StatCard icon={Lock} label="Con correlativas pendientes" value={String(pendingCount)} accent="bg-gold/15 text-gold-dark" />
        </div>
      )}

      {!isLoading && roster.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o email…"
              className={`${INPUT} pl-10`}
            />
          </div>
          <button
            type="button"
            onClick={() => setOnlyPending(v => !v)}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all shrink-0 ${
              onlyPending
                ? 'bg-gold/15 border-gold/40 text-gold-dark'
                : 'bg-parchment border-chocolate-100/40 text-ink-light hover:border-chocolate/30'
            }`}
          >
            <Lock className="w-4 h-4" />
            Solo pendientes
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-44 bg-parchment rounded-xl animate-pulse" />
          ))}
        </div>
      ) : roster.length === 0 ? (
        <div className="text-center py-16 bg-parchment rounded-xl border border-chocolate-100/20">
          <Users className="w-12 h-12 text-ink-light/30 mx-auto mb-4" />
          <p className="text-ink-light text-lg">Aún no hay inscriptos.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-parchment rounded-xl border border-dashed border-chocolate-100/40">
          <Search className="w-10 h-10 text-ink-light/30 mx-auto mb-3" />
          <p className="text-ink-light">No hay inscriptos que coincidan con el filtro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry, i) => (
            <RosterEntryCard
              key={entry.id}
              entry={entry}
              index={i}
              onMark={handleMark}
              onCompose={setComposeStudent}
            />
          ))}
        </div>
      )}

      {composeStudent && (
        <ReminderComposeModal
          studentId={composeStudent.id}
          studentName={composeStudent.name}
          onClose={() => { setComposeStudent(null); invalidateRoster(); }}
        />
      )}

      {bulkOpen && (
        <WorkshopBulkReminderModal
          workshop={workshop}
          studentIds={active.map(r => r.studentId)}
          onClose={() => setBulkOpen(false)}
          onSent={invalidateRoster}
        />
      )}
    </div>
  );
}
