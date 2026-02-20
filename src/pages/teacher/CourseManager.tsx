import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit3, Eye, Users, Star, MoreVertical,
  BookOpen, Trash2, X, Check, DollarSign,
  ChevronDown, ChevronUp, Video, FileText,
  AlertTriangle, Loader2, Upload, Image as ImageIcon,
  Award, ClipboardList,
} from 'lucide-react';
import CourseImage from '@/components/ui/CourseImage';
import Combobox from '@/components/ui/Combobox';
import { coursesService } from '@/services/courses';
import { modulesService } from '@/services/modules';
import { uploadsService } from '@/services/uploads';
import { statisticsService } from '@/services/statistics';
import { testQuestionsService, type TestQuestion } from '@/services/testQuestions';
import { formatPrice } from '@/utils/format';
import { useToast } from '@/context/ToastContext';
import type { Course, Module, Material, TestConfig } from '@/types';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const INPUT = 'w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all';
const SELECT = 'w-full px-4 py-2.5 rounded-xl border border-chocolate-100/40 bg-parchment text-sm text-ink focus:outline-none focus:border-chocolate/40 focus:ring-2 focus:ring-chocolate/10 transition-all appearance-none cursor-pointer';

const AVAILABILITY_OPTIONS = [
  { value: 'Disponible', label: 'Disponible' },
  { value: 'Próximamente', label: 'Próximamente' },
  { value: 'En progreso', label: 'En progreso' },
  { value: 'Cerrado', label: 'Cerrado' },
] as const;

const RequiredMark = () => <span className="text-error ml-0.5">*</span>;

const emptyCourseForm = {
  title: '',
  slug: '',
  category: '',
  summary: '',
  description: '',
  imageUrl: '',
  price: 0,
  discountPrice: undefined as number | undefined,
  discountLabel: '',
  duration: '',
  prerequisites: [] as string[],
  tableOfContents: [] as string[],
  availability: 'Disponible',
  hasTest: false,
  testConfig: { totalQuestions: 10, timeLimit: 30, maxRetries: 2, passingScore: 70 } as TestConfig,
  hasCertificate: false,
  moneyBackGuarantee: '',
  featured: false,
};

interface ModuleVideoForm {
  url: string;
  title: string;
  durationInput: string; // "mm:ss" for display
  duration: number; // seconds
  order: number;
}

const emptyModuleForm = {
  number: 1,
  title: '',
  description: '',
  videos: [] as ModuleVideoForm[],
  materials: [] as Material[],
  isFree: false,
};

export default function CourseManager() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: courseStats = [] } = useQuery({
    queryKey: ['statistics', 'courses'],
    queryFn: statisticsService.getCourseStats,
  });

  // View state
  const [isEditing, setIsEditing] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState(emptyCourseForm);

  // Module state
  const [modules, setModules] = useState<Module[]>([]);
  const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [moduleForm, setModuleForm] = useState(emptyModuleForm);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  // Test questions state
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
  });

  // Async states
  const [saving, setSaving] = useState(false);
  const [savingModule, setSavingModule] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);

  /* ── Handlers ──────────────────────────────────── */

  const handleCreate = () => {
    setEditingCourse(null);
    setFormData(emptyCourseForm);
    setModules([]);
    setEditingModuleIndex(null);
    setIsAddingModule(false);
    setQuestions([]);
    setEditingQuestionIndex(null);
    setIsAddingQuestion(false);
    setIsEditing(true);
  };

  const handleEdit = async (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      slug: course.slug,
      category: course.category,
      summary: course.summary,
      description: course.description,
      imageUrl: course.imageUrl,
      price: course.price,
      discountPrice: course.discountPrice,
      discountLabel: course.discountLabel ?? '',
      duration: course.duration,
      prerequisites: course.prerequisites ?? [],
      tableOfContents: course.tableOfContents ?? [],
      availability: course.availability,
      hasTest: course.hasTest,
      testConfig: course.testConfig ?? emptyCourseForm.testConfig,
      hasCertificate: course.hasCertificate,
      moneyBackGuarantee: course.moneyBackGuarantee ?? '',
      featured: course.featured,
    });
    const courseModules = await modulesService.getModules(course.id);
    setModules(courseModules);
    setEditingModuleIndex(null);
    setIsAddingModule(false);

    // Fetch test questions if course has test enabled
    if (course.hasTest) {
      const courseQuestions = await testQuestionsService.getQuestions(course.id);
      setQuestions(courseQuestions);
    } else {
      setQuestions([]);
    }
    setEditingQuestionIndex(null);
    setIsAddingQuestion(false);

    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingCourse(null);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { url } = await uploadsService.uploadImage(file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
      toast.success('Imagen subida correctamente.');
    } catch {
      toast.error('Error al subir la imagen.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Auto-calculate discount label if not set
      let computedDiscountLabel = formData.discountLabel || undefined;
      if (!computedDiscountLabel && formData.discountPrice && formData.price > 0) {
        const pct = Math.round((1 - formData.discountPrice / formData.price) * 100);
        if (pct > 0) computedDiscountLabel = `${pct}% OFF`;
      }

      const payload = {
        ...formData,
        discountPrice: formData.discountPrice || undefined,
        discountLabel: computedDiscountLabel,
        testConfig: formData.hasTest ? formData.testConfig : undefined,
        moneyBackGuarantee: formData.moneyBackGuarantee || undefined,
      };

      if (editingCourse) {
        await coursesService.updateCourse(editingCourse.slug, payload);
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        setIsEditing(false);
        setEditingCourse(null);
        toast.success('Curso actualizado correctamente.');
      } else {
        const newCourse = await coursesService.createCourse(payload);
        queryClient.invalidateQueries({ queryKey: ['courses'] });
        // Switch to edit mode so user can add modules
        setEditingCourse(newCourse);
        setModules([]);
        toast.success('Curso creado. Ya podés agregar módulos.');
      }
    } catch {
      toast.error('Error al guardar el curso.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (slug: string) => {
    setDeleting(slug);
    try {
      await coursesService.deleteCourse(slug);
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setConfirmDelete(null);
      toast.success('Curso eliminado.');
    } catch {
      toast.error('Error al eliminar el curso.');
    } finally {
      setDeleting(null);
    }
  };

  /* ── Array field helpers ────────────────────────── */

  const handleAddArrayItem = (field: 'prerequisites' | 'tableOfContents') => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const handleUpdateArrayItem = (field: 'prerequisites' | 'tableOfContents', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const handleRemoveArrayItem = (field: 'prerequisites' | 'tableOfContents', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  /* ── Module handlers ────────────────────────────── */

  const handleStartAddModule = () => {
    setModuleForm({ ...emptyModuleForm, number: modules.length + 1 });
    setEditingModuleIndex(null);
    setIsAddingModule(true);
  };

  const handleStartEditModule = (index: number) => {
    const mod = modules[index];

    // Convert to videos form array
    let videos: ModuleVideoForm[] = [];
    if (mod.videos && mod.videos.length > 0) {
      videos = mod.videos.map(v => {
        const m = Math.floor(v.duration / 60);
        const s = Math.floor(v.duration % 60);
        return {
          url: v.url,
          title: v.title,
          durationInput: v.duration > 0 ? `${m}:${s.toString().padStart(2, '0')}` : '',
          duration: v.duration,
          order: v.order,
        };
      });
    } else if (mod.videoUrl) {
      // Legacy single video → convert
      videos = [{
        url: mod.videoUrl,
        title: '',
        durationInput: mod.videoDuration || '',
        duration: 0,
        order: 0,
      }];
    }

    setModuleForm({
      number: mod.number,
      title: mod.title,
      description: mod.description,
      videos,
      materials: mod.materials ?? [],
      isFree: mod.isFree,
    });
    setEditingModuleIndex(index);
    setIsAddingModule(false);
    setExpandedModule(index);
  };

  const handleSaveModule = async () => {
    if (!editingCourse) return;
    setSavingModule(true);

    // Transform videos form data for API
    const apiData = {
      number: moduleForm.number,
      title: moduleForm.title,
      description: moduleForm.description,
      videos: moduleForm.videos
        .filter(v => v.url.trim())
        .map((v, i) => ({
          url: v.url,
          title: v.title,
          duration: v.duration,
          order: i,
        })),
      materials: moduleForm.materials,
      isFree: moduleForm.isFree,
    };

    try {
      if (editingModuleIndex !== null) {
        const existing = modules[editingModuleIndex];
        const updated = await modulesService.updateModule(existing.id, apiData);
        setModules(prev => prev.map((m, i) => i === editingModuleIndex ? updated : m));
        setEditingModuleIndex(null);
        toast.success('Módulo actualizado.');
      } else {
        const created = await modulesService.createModule(editingCourse.id, apiData);
        setModules(prev => [...prev, created]);
        setIsAddingModule(false);
        toast.success('Módulo creado.');
      }
      setModuleForm(emptyModuleForm);
    } catch {
      toast.error('Error al guardar el módulo.');
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteModule = async (index: number) => {
    const mod = modules[index];
    if (mod.id) {
      await modulesService.deleteModule(mod.id);
    }
    setModules(prev => prev.filter((_, i) => i !== index));
    if (editingModuleIndex === index) {
      setEditingModuleIndex(null);
      setModuleForm(emptyModuleForm);
    }
  };

  const handleCancelModule = () => {
    setEditingModuleIndex(null);
    setIsAddingModule(false);
    setModuleForm(emptyModuleForm);
  };

  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMaterial(true);
    try {
      const { url, originalName } = await uploadsService.uploadMaterial(file);
      const ext = originalName.split('.').pop()?.toLowerCase() as Material['type'];
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
      setModuleForm(prev => ({
        ...prev,
        materials: [...prev.materials, {
          id: crypto.randomUUID(),
          name: originalName,
          type: ext || 'pdf',
          size: `${sizeInMB} MB`,
          fileUrl: url,
        }],
      }));
      toast.success('Material subido.');
    } catch {
      toast.error('Error al subir el material.');
    } finally {
      setUploadingMaterial(false);
      if (materialInputRef.current) materialInputRef.current.value = '';
    }
  };

  const handleRemoveMaterial = (matIndex: number) => {
    setModuleForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== matIndex),
    }));
  };

  /* ── Question handlers ────────────────────────── */

  const handleStartAddQuestion = () => {
    setQuestionForm({ question: '', options: ['', '', '', ''], correctIndex: 0 });
    setEditingQuestionIndex(null);
    setIsAddingQuestion(true);
  };

  const handleStartEditQuestion = (index: number) => {
    const q = questions[index];
    setQuestionForm({
      question: q.question,
      options: q.options.length >= 2 ? q.options : ['', '', '', ''],
      correctIndex: q.correctIndex,
    });
    setEditingQuestionIndex(index);
    setIsAddingQuestion(false);
  };

  const handleSaveQuestion = async () => {
    if (!editingCourse) return;
    setSavingQuestion(true);
    try {
      const data = {
        question: questionForm.question,
        options: questionForm.options.filter(o => o.trim()),
        correctIndex: questionForm.correctIndex,
      };

      if (editingQuestionIndex !== null) {
        const existing = questions[editingQuestionIndex];
        const updated = await testQuestionsService.updateQuestion(existing.id, data);
        setQuestions(prev => prev.map((q, i) => i === editingQuestionIndex ? { ...q, ...updated } : q));
        setEditingQuestionIndex(null);
        toast.success('Pregunta actualizada.');
      } else {
        const created = await testQuestionsService.createQuestion(editingCourse.id, data);
        setQuestions(prev => [...prev, created]);
        setIsAddingQuestion(false);
        toast.success('Pregunta creada.');
      }
      setQuestionForm({ question: '', options: ['', '', '', ''], correctIndex: 0 });
    } catch {
      toast.error('Error al guardar la pregunta.');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (index: number) => {
    const q = questions[index];
    if (q.id) {
      await testQuestionsService.deleteQuestion(q.id);
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
    if (editingQuestionIndex === index) {
      setEditingQuestionIndex(null);
      setQuestionForm({ question: '', options: ['', '', '', ''], correctIndex: 0 });
    }
    toast.success('Pregunta eliminada.');
  };

  const handleCancelQuestion = () => {
    setEditingQuestionIndex(null);
    setIsAddingQuestion(false);
    setQuestionForm({ question: '', options: ['', '', '', ''], correctIndex: 0 });
  };

  const handleUpdateOption = (index: number, value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((o, i) => i === index ? value : o),
    }));
  };

  /* ── Derived ────────────────────────────────────── */

  const categories = Array.from(new Set(courses.map(c => c.category))).filter(Boolean);

  const missingFields: string[] = [];
  if (!formData.title) missingFields.push('Título');
  if (!formData.slug) missingFields.push('Slug');
  if (!formData.category) missingFields.push('Categoría');
  if (!formData.duration) missingFields.push('Duración');
  if (!formData.summary) missingFields.push('Resumen');
  if (!formData.description) missingFields.push('Descripción');
  const canSave = missingFields.length === 0 && !saving;

  /* ── Loading skeleton ──────────────────────────── */

  if (loadingCourses) {
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
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="bg-parchment rounded-xl p-5 border border-chocolate-100/20 h-36 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Module Form (reused for add & edit) ───────── */

  const renderModuleForm = () => (
    <div className="bg-cream-dark/50 rounded-xl p-5 space-y-4 border border-chocolate-100/20">
      {/* Number + Title */}
      <div className="grid grid-cols-1 md:grid-cols-[100px_1fr] gap-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Nro.</label>
          <input
            type="number"
            value={moduleForm.number}
            onChange={e => setModuleForm(prev => ({ ...prev, number: Number(e.target.value) }))}
            min={1}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Título del módulo</label>
          <input
            type="text"
            value={moduleForm.title}
            onChange={e => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ej: Introducción al Derecho Penal"
            className={INPUT}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Descripción</label>
        <textarea
          value={moduleForm.description}
          onChange={e => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describí el contenido de este módulo..."
          rows={2}
          className={`${INPUT} resize-none`}
        />
      </div>

      {/* Videos */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">
          Videos
          <span className="text-xs text-ink-light font-normal ml-2">
            ({moduleForm.videos.length} {moduleForm.videos.length === 1 ? 'video' : 'videos'})
          </span>
        </label>
        {moduleForm.videos.length > 0 && (
          <div className="space-y-2 mb-3">
            {moduleForm.videos.map((video, vi) => (
              <div key={vi} className="p-3 bg-parchment rounded-lg border border-chocolate-100/20">
                <div className="flex items-center gap-2 mb-2">
                  <Video className="w-3.5 h-3.5 text-chocolate shrink-0" />
                  <span className="text-xs font-semibold text-ink">Video {vi + 1}</span>
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => setModuleForm(prev => ({
                      ...prev,
                      videos: prev.videos.filter((_, i) => i !== vi),
                    }))}
                    className="p-1 rounded text-ink-light hover:text-error transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_160px_120px] gap-2">
                  <input
                    type="text"
                    value={video.url}
                    onChange={e => setModuleForm(prev => ({
                      ...prev,
                      videos: prev.videos.map((v, i) => i === vi ? { ...v, url: e.target.value } : v),
                    }))}
                    placeholder="URL del contenido (YouTube, Vimeo, Prezi, etc.)"
                    className={`${INPUT} text-xs`}
                  />
                  <input
                    type="text"
                    value={video.title}
                    onChange={e => setModuleForm(prev => ({
                      ...prev,
                      videos: prev.videos.map((v, i) => i === vi ? { ...v, title: e.target.value } : v),
                    }))}
                    placeholder="Título (opcional)"
                    className={`${INPUT} text-xs`}
                  />
                  <input
                    type="text"
                    value={video.durationInput}
                    onChange={e => {
                      const input = e.target.value;
                      // Parse mm:ss to seconds
                      let seconds = 0;
                      const match = input.match(/^(\d+):(\d{0,2})$/);
                      if (match) {
                        seconds = parseInt(match[1]) * 60 + parseInt(match[2] || '0');
                      }
                      setModuleForm(prev => ({
                        ...prev,
                        videos: prev.videos.map((v, i) =>
                          i === vi ? { ...v, durationInput: input, duration: seconds } : v,
                        ),
                      }));
                    }}
                    placeholder="mm:ss"
                    className={`${INPUT} text-xs`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setModuleForm(prev => ({
            ...prev,
            videos: [...prev.videos, { url: '', title: '', durationInput: '', duration: 0, order: prev.videos.length }],
          }))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-chocolate bg-chocolate-50 rounded-lg hover:bg-chocolate-100/40 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar video
        </button>
      </div>

      {/* Materials */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Materiales</label>
        {moduleForm.materials.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {moduleForm.materials.map((mat, mi) => (
              <div key={mat.id} className="flex items-center gap-2 p-2 bg-parchment rounded-lg border border-chocolate-100/20">
                <FileText className="w-3.5 h-3.5 text-chocolate shrink-0" />
                <span className="text-sm text-ink flex-1 truncate">{mat.name}</span>
                <span className="text-[10px] text-ink-light uppercase">{mat.type}</span>
                <span className="text-[10px] text-ink-light">{mat.size}</span>
                <button onClick={() => handleRemoveMaterial(mi)} className="p-1 rounded text-ink-light hover:text-error transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <input ref={materialInputRef} type="file" accept=".pdf,.docx,.pptx,.xlsx" onChange={handleMaterialUpload} className="hidden" />
        <button
          type="button"
          onClick={() => materialInputRef.current?.click()}
          disabled={uploadingMaterial}
          className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg"
        >
          {uploadingMaterial ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Subir material
        </button>
      </div>

      {/* isFree */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={moduleForm.isFree}
          onChange={e => setModuleForm(prev => ({ ...prev, isFree: e.target.checked }))}
          className="w-4 h-4 rounded accent-chocolate"
        />
        <span className="text-sm text-ink font-medium">Módulo gratuito (vista previa)</span>
      </label>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSaveModule}
          disabled={!moduleForm.title || !moduleForm.description || savingModule}
          className="inline-flex items-center gap-1.5 btn-primary btn-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {savingModule ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Guardar módulo
        </button>
        <button onClick={handleCancelModule} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
          <X className="w-3 h-3" />
          Cancelar
        </button>
      </div>
    </div>
  );

  /* ── Form View ──────────────────────────────────── */

  if (isEditing) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">
            {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
          </h1>
          <p className="text-ink-light mt-1">
            {editingCourse ? 'Modificá los datos del curso y sus módulos.' : 'Completá los datos para crear un nuevo curso.'}
          </p>
          <p className="text-xs text-ink-light/60 mt-1">Los campos marcados con <span className="text-error">*</span> son obligatorios.</p>
        </div>

        <div className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm p-6 space-y-8">

          {/* Section 1: Datos principales */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Datos principales</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Título<RequiredMark /></label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    placeholder="Ej: Derecho Penal Avanzado"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Slug<RequiredMark /></label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                    placeholder="derecho-penal-avanzado"
                    className={INPUT}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Combobox
                    value={formData.category}
                    onChange={value => setFormData(prev => ({ ...prev, category: value }))}
                    options={categories}
                    placeholder="Elegir o escribir categoría..."
                    label="Categoría"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Duración<RequiredMark /></label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={e => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                    placeholder="Ej: 24 horas"
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Resumen<RequiredMark /></label>
                <textarea
                  value={formData.summary}
                  onChange={e => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Breve resumen que aparece en las tarjetas del catálogo..."
                  rows={2}
                  className={`${INPUT} resize-none`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Descripción */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Descripción<RequiredMark /></h2>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descripción completa del curso..."
              rows={5}
              className={`${INPUT} resize-none`}
            />
          </div>

          {/* Section 3: Imagen */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Imagen del curso</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-48 aspect-video rounded-lg overflow-hidden border border-chocolate-100/20 shrink-0">
                <CourseImage src={formData.imageUrl} alt="Preview" />
              </div>
              <div className="flex-1 space-y-3">
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-2 btn-secondary btn-sm rounded-xl"
                >
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  {uploadingImage ? 'Subiendo...' : 'Subir imagen'}
                </button>
                <div>
                  <label className="block text-xs text-ink-light mb-1">O pegá una URL</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={e => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className={INPUT}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Precios */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Precios</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Precio (ARS)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                      placeholder="0"
                      min={0}
                      className={`${INPUT} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Precio con descuento (ARS)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                    <input
                      type="number"
                      value={formData.discountPrice ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, discountPrice: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="Opcional"
                      min={0}
                      className={`${INPUT} pl-9`}
                    />
                  </div>
                </div>
              </div>
              <div className="max-w-sm">
                <label className="block text-sm font-medium text-ink mb-1.5">Etiqueta de descuento</label>
                <input
                  type="text"
                  value={formData.discountLabel}
                  onChange={e => setFormData(prev => ({ ...prev, discountLabel: e.target.value }))}
                  placeholder="Ej: 20% OFF"
                  className={INPUT}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Prerrequisitos */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Prerrequisitos</h2>
            <div className="space-y-2">
              {formData.prerequisites.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={e => handleUpdateArrayItem('prerequisites', i, e.target.value)}
                    placeholder="Ej: Título de abogado"
                    className={`${INPUT} flex-1`}
                  />
                  <button onClick={() => handleRemoveArrayItem('prerequisites', i)} className="p-2.5 rounded-xl text-ink-light hover:text-error transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => handleAddArrayItem('prerequisites')} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg mt-1">
                <Plus className="w-3 h-3" />
                Agregar prerrequisito
              </button>
            </div>
          </div>

          {/* Section 6: Contenidos del curso */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Contenidos del curso</h2>
            <div className="space-y-2">
              {formData.tableOfContents.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={e => handleUpdateArrayItem('tableOfContents', i, e.target.value)}
                    placeholder="Ej: Principios generales del derecho penal"
                    className={`${INPUT} flex-1`}
                  />
                  <button onClick={() => handleRemoveArrayItem('tableOfContents', i)} className="p-2.5 rounded-xl text-ink-light hover:text-error transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => handleAddArrayItem('tableOfContents')} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg mt-1">
                <Plus className="w-3 h-3" />
                Agregar contenido
              </button>
            </div>
          </div>

          {/* Section 7: Disponibilidad y garantía */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Disponibilidad y garantía</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Estado del curso</label>
                <select
                  value={formData.availability}
                  onChange={e => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                  className={SELECT}
                >
                  {AVAILABILITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Garantía de devolución</label>
                <input
                  type="text"
                  value={formData.moneyBackGuarantee}
                  onChange={e => setFormData(prev => ({ ...prev, moneyBackGuarantee: e.target.value }))}
                  placeholder="Ej: 30 días de garantía"
                  className={INPUT}
                />
              </div>
            </div>
          </div>

          {/* Section 8: Evaluación y certificado */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Evaluación y certificado</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasTest}
                  onChange={e => setFormData(prev => ({ ...prev, hasTest: e.target.checked }))}
                  className="w-4 h-4 rounded accent-chocolate"
                />
                <span className="text-sm text-ink font-medium">Incluir examen final</span>
              </label>

              {formData.hasTest && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-cream-dark/50 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Preguntas</label>
                    <div className={`${INPUT} bg-cream-dark text-ink-light`}>
                      {questions.length} pregunta{questions.length !== 1 ? 's' : ''} agregada{questions.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Tiempo (min)</label>
                    <input
                      type="number"
                      value={formData.testConfig.timeLimit}
                      onChange={e => setFormData(prev => ({ ...prev, testConfig: { ...prev.testConfig, timeLimit: Number(e.target.value) } }))}
                      min={1}
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Reintentos</label>
                    <input
                      type="number"
                      value={formData.testConfig.maxRetries}
                      onChange={e => setFormData(prev => ({ ...prev, testConfig: { ...prev.testConfig, maxRetakes: Number(e.target.value) } }))}
                      min={0}
                      className={INPUT}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink mb-1">Aprobación (%)</label>
                    <input
                      type="number"
                      value={formData.testConfig.passingScore}
                      onChange={e => setFormData(prev => ({ ...prev, testConfig: { ...prev.testConfig, passingScore: Number(e.target.value) } }))}
                      min={0}
                      max={100}
                      className={INPUT}
                    />
                  </div>
                </div>
              )}

              {formData.hasTest && editingCourse && (
                <div className="mt-4 pt-4 border-t border-chocolate-100/20">
                  <h3 className="text-sm font-semibold text-ink mb-3">Preguntas del examen ({questions.length})</h3>

                  {questions.length > 0 && !isAddingQuestion && editingQuestionIndex === null && (
                    <div className="space-y-2 mb-4">
                      {questions.map((q, i) => (
                        <div key={q.id} className="flex items-center gap-3 p-3 bg-parchment rounded-lg border border-chocolate-100/20">
                          <span className="w-6 h-6 rounded-full bg-chocolate-50 flex items-center justify-center text-xs font-bold text-chocolate shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-ink flex-1 line-clamp-1">{q.question}</span>
                          <span className="text-[10px] text-ink-light">{q.options.length} opciones</span>
                          <button
                            onClick={() => handleStartEditQuestion(i)}
                            className="p-1.5 rounded-lg text-ink-light hover:text-chocolate hover:bg-chocolate-50 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(i)}
                            className="p-1.5 rounded-lg text-ink-light hover:text-error hover:bg-error-light transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {isAddingQuestion || editingQuestionIndex !== null ? (
                    <div className="bg-cream-dark/50 rounded-xl p-4 space-y-3 border border-chocolate-100/20">
                      <div>
                        <label className="block text-xs font-medium text-ink mb-1">Pregunta</label>
                        <textarea
                          value={questionForm.question}
                          onChange={e => setQuestionForm(prev => ({ ...prev, question: e.target.value }))}
                          placeholder="Escribí la pregunta..."
                          rows={2}
                          className={`${INPUT} resize-none text-sm`}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-ink">Opciones (marcá la correcta)</label>
                        {questionForm.options.map((opt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correctOption"
                              checked={questionForm.correctIndex === i}
                              onChange={() => setQuestionForm(prev => ({ ...prev, correctIndex: i }))}
                              className="w-4 h-4 accent-chocolate"
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={e => handleUpdateOption(i, e.target.value)}
                              placeholder={`Opción ${i + 1}`}
                              className={`${INPUT} flex-1 text-sm py-2`}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={handleSaveQuestion}
                          disabled={!questionForm.question || questionForm.options.filter(o => o.trim()).length < 2 || savingQuestion}
                          className="inline-flex items-center gap-1.5 btn-primary btn-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {savingQuestion ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          {editingQuestionIndex !== null ? 'Actualizar' : 'Agregar'}
                        </button>
                        <button onClick={handleCancelQuestion} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={handleStartAddQuestion} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                      <Plus className="w-3 h-3" />
                      Agregar pregunta
                    </button>
                  )}
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasCertificate}
                  onChange={e => setFormData(prev => ({ ...prev, hasCertificate: e.target.checked }))}
                  className="w-4 h-4 rounded accent-chocolate"
                />
                <span className="text-sm text-ink font-medium">Otorgar certificado al aprobar</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={e => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                  className="w-4 h-4 rounded accent-chocolate"
                />
                <span className="text-sm text-ink font-medium">Destacar en la Landing</span>
              </label>
            </div>
          </div>

          {/* Section 9: Módulos */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Módulos</h2>

            {!editingCourse ? (
              <div className="p-4 bg-cream-dark/50 rounded-xl text-center">
                <BookOpen className="w-8 h-8 text-ink-light/30 mx-auto mb-2" />
                <p className="text-sm text-ink-light">Guardá el curso primero para agregar módulos.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((mod, i) => (
                  <div key={mod.id} className="border border-chocolate-100/20 rounded-xl overflow-hidden">
                    {/* Module header */}
                    <div
                      className="flex items-center gap-3 p-3 bg-cream-dark/30 cursor-pointer hover:bg-cream-dark/50 transition-colors"
                      onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                    >
                      <span className="w-8 h-8 rounded-lg bg-chocolate-50 flex items-center justify-center text-xs font-bold text-chocolate shrink-0">
                        {mod.number}
                      </span>
                      <span className="text-sm font-medium text-ink flex-1">{mod.title}</span>
                      {mod.isFree && (
                        <span className="text-[10px] font-bold text-success bg-success-light px-2 py-0.5 rounded-full">Gratis</span>
                      )}
                      <span className="text-[10px] text-ink-light">
                        {mod.materials?.length ?? 0} material{(mod.materials?.length ?? 0) !== 1 ? 'es' : ''}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={e => { e.stopPropagation(); handleStartEditModule(i); }}
                          className="p-1.5 rounded-lg text-ink-light hover:text-chocolate hover:bg-chocolate-50 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteModule(i); }}
                          className="p-1.5 rounded-lg text-ink-light hover:text-error hover:bg-error-light transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {expandedModule === i ? <ChevronUp className="w-4 h-4 text-ink-light" /> : <ChevronDown className="w-4 h-4 text-ink-light" />}
                    </div>

                    {/* Expanded content or edit form */}
                    {expandedModule === i && (
                      <div className="p-3">
                        {editingModuleIndex === i ? (
                          renderModuleForm()
                        ) : (
                          <div className="text-sm text-ink-light space-y-1">
                            <p>{mod.description}</p>
                            {mod.videoUrl && (
                              <p className="flex items-center gap-1">
                                <Video className="w-3.5 h-3.5" />
                                {mod.videoDuration ?? 'Video incluido'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add module form */}
                {isAddingModule && renderModuleForm()}

                {/* Add module button */}
                {!isAddingModule && editingModuleIndex === null && (
                  <button onClick={handleStartAddModule} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                    <Plus className="w-3 h-3" />
                    Agregar módulo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-chocolate-100/20 space-y-2">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingCourse ? 'Guardar cambios' : 'Crear curso'}
              </button>
              <button onClick={handleCancel} className="inline-flex items-center gap-2 btn-ghost btn-md rounded-xl">
                <X className="w-4 h-4" />
                Cancelar
              </button>
            </div>
            {missingFields.length > 0 && (
              <p className="text-xs text-error/80">
                Campos obligatorios faltantes: {missingFields.join(', ')}
              </p>
            )}
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
          <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Mis Cursos</h1>
          <p className="text-ink-light mt-1">Gestioná y editá tus cursos publicados.</p>
        </div>
        <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
          <Plus className="w-4 h-4" />
          Nuevo Curso
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-ink-light/30 mx-auto mb-4" />
          <p className="text-ink-light text-lg mb-4">No hay cursos creados aún.</p>
          <button onClick={handleCreate} className="inline-flex items-center gap-2 btn-primary btn-md rounded-xl">
            <Plus className="w-4 h-4" />
            Crear primer curso
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map(course => {
            const stat = courseStats.find(s => s.courseId === course.id);
            return (
              <div
                key={course.id}
                className="bg-parchment rounded-xl border border-chocolate-100/20 shadow-warm overflow-hidden card-accent"
              >
                <div className="flex flex-col md:flex-row gap-4 p-5">
                  {/* Image */}
                  <div className="w-full md:w-48 aspect-video md:aspect-[4/3] rounded-lg overflow-hidden shrink-0">
                    <CourseImage src={course.imageUrl} alt={course.title} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gold uppercase tracking-wider">{course.category}</span>
                          {course.discountPrice && (
                            <span className="text-[10px] font-bold text-error bg-error-light px-2 py-0.5 rounded-full">
                              {course.discountLabel}
                            </span>
                          )}
                        </div>
                        <h3 className="font-display text-lg font-bold text-ink">{course.title}</h3>
                      </div>
                      <button className="p-2 rounded-lg text-ink-light hover:bg-cream-dark transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-ink-light mt-1 line-clamp-1">{course.summary}</p>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-ink-light">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {course.modules?.length ?? 0} módulos
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {course.studentCount} estudiantes
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-gold fill-gold" />
                        {course.rating}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" />
                        {stat?.views.toLocaleString() ?? '—'} vistas
                      </span>
                      {course.hasTest && (
                        <span className="flex items-center gap-1 text-xs text-gold-dark">
                          <ClipboardList className="w-3.5 h-3.5" />
                          Examen
                        </span>
                      )}
                      {course.hasCertificate && (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <Award className="w-3.5 h-3.5" />
                          Certificado
                        </span>
                      )}
                      <span className="font-semibold text-chocolate">
                        {formatPrice(course.discountPrice ?? course.price)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4">
                      <button onClick={() => handleEdit(course)} className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg">
                        <Edit3 className="w-3 h-3" />
                        Editar
                      </button>
                      <Link
                        to={`/cursos/${course.slug}`}
                        className="inline-flex items-center gap-1.5 btn-secondary btn-sm rounded-lg"
                      >
                        <Eye className="w-3 h-3" />
                        Vista previa
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(course.slug)}
                        className="inline-flex items-center gap-1.5 btn-danger btn-sm rounded-lg"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>

                    {/* Delete confirmation */}
                    {confirmDelete === course.slug && (
                      <div className="mt-3 p-3 bg-error-light rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-error">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Se eliminará el curso y todos sus módulos.</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteCourse(course.slug)}
                            disabled={deleting === course.slug}
                            className="inline-flex items-center gap-1.5 btn-danger btn-sm rounded-lg disabled:opacity-50"
                          >
                            {deleting === course.slug ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirmar'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
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
