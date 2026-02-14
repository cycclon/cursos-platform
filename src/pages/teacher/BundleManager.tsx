import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Edit3, Eye, Trash2, Package, BookOpen, X, Check, DollarSign, MoreVertical,
} from 'lucide-react';
import { courses, bundles as mockBundles, getBundleCourses, formatPrice } from '@/data/mock';
import type { Bundle } from '@/types';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const emptyForm = {
  title: '',
  slug: '',
  description: '',
  imageUrl: '',
  courseIds: [] as string[],
  price: 0,
  featured: false,
};

export default function BundleManager() {
  const [bundleList, setBundleList] = useState<Bundle[]>(mockBundles);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  const handleCreate = () => {
    setEditingBundle(null);
    setFormData(emptyForm);
    setIsEditing(true);
  };

  const handleEdit = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setFormData({
      title: bundle.title,
      slug: bundle.slug,
      description: bundle.description,
      imageUrl: bundle.imageUrl,
      courseIds: bundle.courseIds,
      price: bundle.price,
      featured: bundle.featured,
    });
    setIsEditing(true);
  };

  const handleDelete = (id: string) => {
    setBundleList(bundleList.filter(b => b.id !== id));
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
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  const originalPrice = formData.courseIds.reduce((sum, cid) => {
    const course = courses.find(c => c.id === cid);
    return sum + (course?.price ?? 0);
  }, 0);

  const discountPercentage = originalPrice > 0 && formData.price > 0
    ? Math.round((1 - formData.price / originalPrice) * 100)
    : 0;

  const handleSave = () => {
    const discountLabel = discountPercentage > 0 ? `${discountPercentage}% OFF` : '';

    if (editingBundle) {
      setBundleList(bundleList.map(b =>
        b.id === editingBundle.id
          ? { ...b, ...formData, originalPrice, discountLabel }
          : b
      ));
    } else {
      const newBundle: Bundle = {
        id: `b-${Date.now()}`,
        ...formData,
        originalPrice,
        discountLabel,
      };
      setBundleList([...bundleList, newBundle]);
    }
    setIsEditing(false);
    setEditingBundle(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingBundle(null);
  };

  /* ── Form View ──────────────────────────────────── */
  if (isEditing) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
            {editingBundle ? 'Editar Combo' : 'Nuevo Combo'}
          </h1>
          <p className="text-ink-light mt-1">
            {editingBundle ? 'Modificá los datos del combo.' : 'Creá un nuevo combo de cursos con descuento.'}
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
                placeholder="Ej: Formación Integral en Derecho"
                className="w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                placeholder="formacion-integral-derecho"
                className="w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Descripción</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describí los beneficios de este combo..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all resize-none"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">URL de Imagen</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
            />
          </div>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Seleccionar Cursos</label>
            <div className="space-y-1.5 max-h-64 overflow-y-auto border border-chocolate-100/30 rounded-xl p-3 bg-cream/50">
              {courses.map(course => (
                <div
                  key={course.id}
                  onClick={() => handleCourseToggle(course.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                    formData.courseIds.includes(course.id)
                      ? 'bg-chocolate-50 border border-chocolate/20'
                      : 'hover:bg-cream-dark/30 border border-transparent'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.courseIds.includes(course.id)}
                    onChange={() => handleCourseToggle(course.id)}
                    className="w-4 h-4 rounded accent-chocolate"
                  />
                  <span className="text-sm text-ink flex-1">{course.title}</span>
                  <span className="text-xs text-ink-light font-medium">{formatPrice(course.price)}</span>
                </div>
              ))}
            </div>

            {formData.courseIds.length > 0 && (
              <div className="mt-3 p-3 bg-chocolate-50 rounded-lg flex items-center justify-between">
                <span className="text-sm text-ink">Precio original ({formData.courseIds.length} cursos):</span>
                <span className="text-sm font-semibold text-ink">{formatPrice(originalPrice)}</span>
              </div>
            )}
          </div>

          {/* Price + Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Precio del Combo (ARS)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  placeholder="0"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all"
                />
              </div>
              {discountPercentage > 0 && (
                <p className="mt-2 text-sm font-semibold text-success">
                  Descuento: {discountPercentage}%
                </p>
              )}
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
              disabled={!formData.title || formData.courseIds.length < 2}
              className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
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

  /* ── List View ──────────────────────────────────── */
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Mis Combos</h1>
          <p className="text-ink-light mt-1">Creá y gestioná combos de cursos con descuentos especiales.</p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
          <Plus className="w-4 h-4" />
          Nuevo Combo
        </button>
      </div>

      {bundleList.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-ink-light/30 mx-auto mb-4" />
          <p className="text-ink-light text-lg mb-4">No hay combos creados aún.</p>
          <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
            <Plus className="w-4 h-4" />
            Crear primer combo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bundleList.map(bundle => {
            const bundleCourses = getBundleCourses(bundle);
            return (
              <div
                key={bundle.id}
                className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden card-accent"
              >
                <div className="flex flex-col md:flex-row gap-4 p-5">
                  {/* Image */}
                  <div className="w-full md:w-48 aspect-video md:aspect-[4/3] rounded-lg overflow-hidden shrink-0">
                    <img src={bundle.imageUrl} alt={bundle.title} className="w-full h-full object-cover" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gold uppercase tracking-wider">Combo</span>
                          {bundle.featured && (
                            <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full">
                              Destacado
                            </span>
                          )}
                          {bundle.discountLabel && (
                            <span className="text-[10px] font-bold text-error bg-error-light px-2 py-0.5 rounded-full">
                              {bundle.discountLabel}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-lg font-bold text-ink">{bundle.title}</h3>
                      </div>
                      <button className="p-2 rounded-lg text-ink-light hover:bg-cream-dark transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-ink-light mt-1 line-clamp-1">{bundle.description}</p>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-ink-light">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {bundleCourses.length} cursos
                      </span>
                      <span className="line-through">{formatPrice(bundle.originalPrice)}</span>
                      <span className="font-semibold text-chocolate">{formatPrice(bundle.price)}</span>
                    </div>

                    {/* Course pills */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bundleCourses.map(course => (
                        <span key={course.id} className="text-[10px] bg-chocolate-50 text-chocolate px-2 py-0.5 rounded-full">
                          {course.title}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <button onClick={() => handleEdit(bundle)} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                        <Edit3 className="w-3 h-3" />
                        Editar
                      </button>
                      <Link
                        to={`/combos/${bundle.slug}`}
                        className="inline-flex items-center gap-1.5 btn-secondary btn-sm rounded-lg"
                      >
                        <Eye className="w-3 h-3" />
                        Vista previa
                      </Link>
                      <button onClick={() => handleDelete(bundle.id)} className="inline-flex items-center gap-1.5 btn-danger btn-sm rounded-lg">
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
