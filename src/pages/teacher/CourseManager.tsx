import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Edit3, Eye, Users, Star,
  BookOpen, Trash2, X, Check, DollarSign,
  ChevronDown, ChevronUp, Video, FileText,
  AlertTriangle, Loader2, Upload, Image as ImageIcon,
  Award, ClipboardList, Link2, Layers, Sparkles,
} from 'lucide-react';
import CourseImage from '@/components/ui/CourseImage';
import ModuleVideoPreview from '@/components/ui/ModuleVideoPreview';
import Combobox from '@/components/ui/Combobox';
import EnglishSection from '@/components/teacher/EnglishSection';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { coursesService } from '@/services/courses';
import { modulesService } from '@/services/modules';
import { uploadsService } from '@/services/uploads';
import { subtitlesService, type SubtitleJobInfo } from '@/services/subtitles';
import { statisticsService } from '@/services/statistics';
import { testQuestionsService, type TestQuestion } from '@/services/testQuestions';
import { formatPrice } from '@/utils/format';
import { getVideoProvider } from '@/utils/video';
import { pruneEn } from '@/utils/translations';
import { useToast } from '@/context/ToastContext';
import type { Course, Module, Material, ModuleLink, Flashcard, TestConfig, VideoSubtitle, AppLanguage } from '@/types';

type CourseEn = NonNullable<NonNullable<Course['translations']>['en']>;

// Prepend https:// when the teacher pastes a bare host so the stored href is
// always navigable (and passes the backend's URL validation).
function normalizeLinkUrl(raw: string): string {
  const url = raw.trim();
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

// Parse a NotebookLM-style flashcards CSV: two columns (question, answer), no
// header row. Follows RFC-4180 quoting — fields may be wrapped in double quotes,
// embedded quotes are doubled (""), and quoted fields can hold commas/newlines.
// Extra columns are ignored; empty rows are dropped.
function parseFlashcardCsv(text: string): Flashcard[] {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // strip BOM
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++; // CRLF
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  // Drop a leading header row if it looks like one (Anki/Quizlet style exports).
  const headerWords = new Set([
    'question', 'pregunta', 'front', 'frente', 'anverso',
    'term', 'termino', 'término', 'tarjeta', 'concepto',
  ]);
  if (rows.length && headerWords.has((rows[0][0] || '').trim().toLowerCase())) {
    rows.shift();
  }

  return rows
    .map(r => ({ id: crypto.randomUUID(), question: (r[0] || '').trim(), answer: (r[1] || '').trim() }))
    .filter(c => c.question && c.answer);
}

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
  priceUsd: undefined as number | undefined,
  discountPriceUsd: undefined as number | undefined,
  discountLabel: '',
  duration: '',
  prerequisites: [] as string[],
  prerequisiteCourseIds: [] as string[],
  tableOfContents: [] as string[],
  availability: 'Disponible',
  hasTest: false,
  testConfig: { totalQuestions: 10, timeLimit: 30, maxRetries: 2, passingScore: 70, timed: true, showExplanations: false } as TestConfig,
  hasCertificate: false,
  moneyBackGuarantee: '',
  featured: false,
  translations: { en: {} as CourseEn },
};

interface ModuleVideoForm {
  id?: string; // server-assigned subdoc _id (round-tripped to keep identity)
  url: string;
  title: string;
  durationInput: string; // "mm:ss" for display
  duration: number; // seconds
  order: number;
  subtitles?: VideoSubtitle[];
  translations?: { en?: { title?: string } };
}

const emptyModuleForm = {
  number: 1,
  title: '',
  description: '',
  videos: [] as ModuleVideoForm[],
  materials: [] as Material[],
  links: [] as ModuleLink[],
  flashcards: [] as Flashcard[],
  isFree: false,
  translations: { en: {} } as NonNullable<Module['translations']>,
};

const emptyQuestionForm = {
  question: '',
  options: ['', '', '', ''],
  explanations: ['', '', '', ''],
  correctIndex: 0,
  enQuestion: '',
  enOptions: ['', '', '', ''],
  enExplanations: ['', '', '', ''],
};

export default function CourseManager() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const flashcardCsvInputRef = useRef<HTMLInputElement>(null);

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
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);

  // Async states
  const [saving, setSaving] = useState(false);
  const [savingModule, setSavingModule] = useState(false);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingMaterial, setUploadingMaterial] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);

  // Bilingual state
  const { translating, runTranslate } = useAutoTranslate();
  const [subtitleJobs, setSubtitleJobs] = useState<Record<string, SubtitleJobInfo>>({});
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  const subtitleTargetRef = useRef<{ videoIndex: number; lang: AppLanguage } | null>(null);

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
      priceUsd: course.priceUsd,
      discountPriceUsd: course.discountPriceUsd,
      discountLabel: course.discountLabel ?? '',
      duration: course.duration,
      prerequisites: course.prerequisites ?? [],
      prerequisiteCourseIds: course.prerequisiteCourseIds ?? [],
      tableOfContents: course.tableOfContents ?? [],
      availability: course.availability,
      hasTest: course.hasTest,
      testConfig: { ...emptyCourseForm.testConfig, ...course.testConfig },
      hasCertificate: course.hasCertificate,
      moneyBackGuarantee: course.moneyBackGuarantee ?? '',
      featured: course.featured,
      translations: { en: { ...(course.translations?.en ?? {}) } },
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
      // Auto-calculate discount label
      let computedDiscountLabel: string | undefined;
      if (formData.discountPrice && formData.price > 0 && formData.discountPrice < formData.price) {
        const pct = Math.round((1 - formData.discountPrice / formData.price) * 100);
        if (pct > 0) computedDiscountLabel = `${pct}% OFF`;
      }

      // Keep a sane time limit: a timed exam needs a positive value (a 0 would
      // auto-submit instantly and the API rejects it); an untimed exam ignores it.
      const tc = formData.testConfig;
      const normalizedTestConfig = {
        ...tc,
        timeLimit: tc.timed ? Math.max(1, Math.round(tc.timeLimit) || 30) : Math.max(0, Math.round(tc.timeLimit) || 0),
        // The exam uses the whole question bank — there's no separate UI control
        // for how many to draw — so keep totalQuestions equal to the live count
        // instead of letting the seeded default (10) overwrite the synced value.
        // For a brand-new course (no questions yet) the form default stands; the
        // create schema rejects 0, and the backend re-syncs once questions exist.
        totalQuestions: questions.length > 0 ? questions.length : tc.totalQuestions,
      };

      const payload = {
        ...formData,
        discountPrice: formData.discountPrice || undefined,
        discountLabel: computedDiscountLabel,
        testConfig: formData.hasTest ? normalizedTestConfig : undefined,
        moneyBackGuarantee: formData.moneyBackGuarantee || undefined,
        translations: { en: pruneEn(formData.translations?.en) },
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
          id: v.id,
          url: v.url,
          title: v.title,
          durationInput: v.duration > 0 ? `${m}:${s.toString().padStart(2, '0')}` : '',
          duration: v.duration,
          order: v.order,
          subtitles: v.subtitles,
          translations: v.translations,
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
      links: mod.links ?? [],
      flashcards: mod.flashcards ?? [],
      isFree: mod.isFree,
      translations: { en: { ...(mod.translations?.en ?? {}) } },
    });
    setEditingModuleIndex(index);
    setIsAddingModule(false);
    setExpandedModule(index);
  };

  const handleSaveModule = async () => {
    if (!editingCourse) return;
    setSavingModule(true);

    // Transform videos form data for API. `_id`, `subtitles` and the EN
    // overlays must round-trip or a module save would silently wipe them.
    const apiData = {
      number: moduleForm.number,
      title: moduleForm.title,
      description: moduleForm.description,
      videos: moduleForm.videos
        .filter(v => v.url.trim())
        .map((v, i) => ({
          ...(v.id ? { _id: v.id } : {}),
          url: v.url,
          title: v.title,
          duration: v.duration,
          order: i,
          ...(v.subtitles?.length ? { subtitles: v.subtitles } : {}),
          translations: { en: pruneEn(v.translations?.en) },
        })),
      materials: moduleForm.materials.map(m => ({
        ...m,
        translations: { en: pruneEn(m.translations?.en) },
      })),
      links: moduleForm.links
        .map(l => ({
          title: l.title.trim(),
          url: normalizeLinkUrl(l.url),
          description: (l.description ?? '').trim(),
          translations: { en: pruneEn(l.translations?.en) },
        }))
        .filter(l => l.title && l.url),
      flashcards: moduleForm.flashcards
        .map(f => ({
          question: f.question.trim(),
          answer: f.answer.trim(),
          translations: { en: pruneEn(f.translations?.en) },
        }))
        .filter(f => f.question && f.answer),
      isFree: moduleForm.isFree,
      translations: { en: pruneEn(moduleForm.translations?.en) },
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

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVideo(true);
    setVideoUploadProgress(0);
    try {
      // Try to read duration from file metadata before upload
      const duration = await new Promise<number>((resolve) => {
        const videoEl = document.createElement('video');
        videoEl.preload = 'metadata';
        videoEl.onloadedmetadata = () => {
          const d = isFinite(videoEl.duration) ? Math.round(videoEl.duration) : 0;
          URL.revokeObjectURL(videoEl.src);
          resolve(d);
        };
        videoEl.onerror = () => {
          URL.revokeObjectURL(videoEl.src);
          resolve(0);
        };
        videoEl.src = URL.createObjectURL(file);
      });

      const { url } = await uploadsService.uploadVideo(file, (percent) => {
        setVideoUploadProgress(percent);
      });

      const m = Math.floor(duration / 60);
      const s = duration % 60;
      const durationInput = duration > 0 ? `${m}:${s.toString().padStart(2, '0')}` : '';

      const baseName = file.name.replace(/\.[^.]+$/, '');
      setModuleForm(prev => ({
        ...prev,
        videos: [
          ...prev.videos,
          {
            url,
            title: baseName,
            durationInput,
            duration,
            order: prev.videos.length,
          },
        ],
      }));
      toast.success('Video subido.');
    } catch (err) {
      console.error('[uploadVideo] failed:', err);
      const message = err instanceof Error && err.message
        ? `Error al subir el video: ${err.message}`
        : 'Error al subir el video. Verificá que sea MP4 y pese menos de 1,5 GB.';
      toast.error(message);
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress(0);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleRemoveMaterial = (matIndex: number) => {
    setModuleForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== matIndex),
    }));
  };

  const handleAddLink = () => {
    setModuleForm(prev => ({
      ...prev,
      links: [...prev.links, { id: crypto.randomUUID(), title: '', url: '', description: '' }],
    }));
  };

  const handleUpdateLink = (index: number, field: keyof ModuleLink, value: string) => {
    setModuleForm(prev => ({
      ...prev,
      links: prev.links.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));
  };

  const handleRemoveLink = (index: number) => {
    setModuleForm(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index),
    }));
  };

  /* ── Flashcard handlers ───────────────────────── */

  const handleAddFlashcard = () => {
    setModuleForm(prev => ({
      ...prev,
      flashcards: [...prev.flashcards, { id: crypto.randomUUID(), question: '', answer: '' }],
    }));
  };

  const handleUpdateFlashcard = (index: number, field: keyof Flashcard, value: string) => {
    setModuleForm(prev => ({
      ...prev,
      flashcards: prev.flashcards.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    }));
  };

  const handleRemoveFlashcard = (index: number) => {
    setModuleForm(prev => ({
      ...prev,
      flashcards: prev.flashcards.filter((_, i) => i !== index),
    }));
  };

  const handleFlashcardCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseFlashcardCsv(text);
      if (parsed.length === 0) {
        toast.error('No se encontraron tarjetas en el archivo. Usá dos columnas: pregunta, respuesta.');
        return;
      }
      setModuleForm(prev => ({ ...prev, flashcards: [...prev.flashcards, ...parsed] }));
      toast.success(`${parsed.length} tarjeta${parsed.length !== 1 ? 's' : ''} importada${parsed.length !== 1 ? 's' : ''}.`);
    } catch {
      toast.error('No se pudo leer el archivo CSV.');
    } finally {
      if (flashcardCsvInputRef.current) flashcardCsvInputRef.current.value = '';
    }
  };

  /* ── Question handlers ────────────────────────── */

  const handleStartAddQuestion = () => {
    setQuestionForm(emptyQuestionForm);
    setEditingQuestionIndex(null);
    setIsAddingQuestion(true);
  };

  const handleStartEditQuestion = (index: number) => {
    const q = questions[index];
    const options = q.options.length >= 2 ? q.options : ['', '', '', ''];
    const en = q.translations?.en;
    setQuestionForm({
      question: q.question,
      options,
      // Keep explanations aligned 1:1 with options (pad/truncate as needed).
      explanations: options.map((_, i) => q.explanations?.[i] ?? ''),
      correctIndex: q.correctIndex,
      enQuestion: en?.question ?? '',
      enOptions: options.map((_, i) => en?.options?.[i] ?? ''),
      enExplanations: options.map((_, i) => en?.explanations?.[i] ?? ''),
    });
    setEditingQuestionIndex(index);
    setIsAddingQuestion(false);
  };

  const handleSaveQuestion = async () => {
    if (!editingCourse) return;
    setSavingQuestion(true);
    try {
      // Drop blank options while keeping each option's explanation, EN
      // overlay and the correct answer aligned (filtering can shift indices).
      const kept = questionForm.options
        .map((opt, i) => ({
          opt: opt.trim(),
          exp: (questionForm.explanations[i] ?? '').trim(),
          enOpt: (questionForm.enOptions[i] ?? '').trim(),
          enExp: (questionForm.enExplanations[i] ?? '').trim(),
          wasCorrect: i === questionForm.correctIndex,
        }))
        .filter(p => p.opt);

      let correctIndex = kept.findIndex(p => p.wasCorrect);
      if (correctIndex < 0) correctIndex = 0;

      // EN options are all-or-nothing: a partially translated set would show
      // mixed languages, so it's only persisted when every option has an EN
      // version (the resolver also enforces matching lengths).
      const enQuestion = questionForm.enQuestion.trim();
      const enOptionsComplete = kept.length > 0 && kept.every(p => p.enOpt);
      const someEnOptions = kept.some(p => p.enOpt);
      if (someEnOptions && !enOptionsComplete) {
        toast.error('Traducí todas las opciones en inglés (o ninguna): se guardó sin la traducción de opciones.');
      }
      const enPayload = {
        ...(enQuestion ? { question: enQuestion } : {}),
        ...(enOptionsComplete ? { options: kept.map(p => p.enOpt) } : {}),
        ...(enOptionsComplete && formData.testConfig.showExplanations && kept.some(p => p.enExp)
          ? { explanations: kept.map(p => p.enExp) }
          : {}),
      };

      const data = {
        question: questionForm.question,
        options: kept.map(p => p.opt),
        correctIndex,
        // Only persist rationale when the course runs in explanation mode.
        ...(formData.testConfig.showExplanations ? { explanations: kept.map(p => p.exp) } : {}),
        translations: { en: enPayload },
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
      setQuestionForm(emptyQuestionForm);
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
      setQuestionForm(emptyQuestionForm);
    }
    toast.success('Pregunta eliminada.');
  };

  const handleCancelQuestion = () => {
    setEditingQuestionIndex(null);
    setIsAddingQuestion(false);
    setQuestionForm(emptyQuestionForm);
  };

  const handleUpdateOption = (index: number, value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.map((o, i) => i === index ? value : o),
    }));
  };

  const handleUpdateExplanation = (index: number, value: string) => {
    setQuestionForm(prev => ({
      ...prev,
      explanations: prev.explanations.map((e, i) => i === index ? value : e),
    }));
  };

  /* ── English translation handlers ───────────────── */

  const setCourseEn = (field: keyof CourseEn, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      translations: { en: { ...(prev.translations?.en ?? {}), [field]: value } },
    }));
  };

  const setModuleEn = (field: 'title' | 'description', value: string) => {
    setModuleForm(prev => ({
      ...prev,
      translations: { en: { ...(prev.translations?.en ?? {}), [field]: value } },
    }));
  };

  const setVideoEnTitle = (index: number, value: string) => {
    setModuleForm(prev => ({
      ...prev,
      videos: prev.videos.map((v, i) =>
        i === index ? { ...v, translations: { en: { ...(v.translations?.en ?? {}), title: value } } } : v,
      ),
    }));
  };

  const setLinkEn = (index: number, field: 'title' | 'description', value: string) => {
    setModuleForm(prev => ({
      ...prev,
      links: prev.links.map((l, i) =>
        i === index ? { ...l, translations: { en: { ...(l.translations?.en ?? {}), [field]: value } } } : l,
      ),
    }));
  };

  const setFlashcardEn = (index: number, field: 'question' | 'answer', value: string) => {
    setModuleForm(prev => ({
      ...prev,
      flashcards: prev.flashcards.map((f, i) =>
        i === index ? { ...f, translations: { en: { ...(f.translations?.en ?? {}), [field]: value } } } : f,
      ),
    }));
  };

  // Fill-empty-only machine translation. Each slot pairs a Spanish source text
  // with an applier that writes the translation into a draft; one API call
  // translates everything, then the draft lands in state in a single set.
  const handleAutoTranslateCourse = async () => {
    const draft: CourseEn = { ...(formData.translations?.en ?? {}) };
    const slots: { text: string; apply: (v: string) => void }[] = [];

    const scalarFields: { key: keyof CourseEn; value: string }[] = [
      { key: 'title', value: formData.title },
      { key: 'summary', value: formData.summary },
      { key: 'description', value: formData.description },
      { key: 'category', value: formData.category },
      { key: 'duration', value: formData.duration },
      { key: 'moneyBackGuarantee', value: formData.moneyBackGuarantee },
    ];
    for (const f of scalarFields) {
      if (f.value.trim() && !((draft[f.key] as string | undefined) ?? '').trim()) {
        slots.push({ text: f.value, apply: v => { (draft[f.key] as string) = v; } });
      }
    }
    for (const key of ['prerequisites', 'tableOfContents'] as const) {
      const canonical = formData[key].map(s => s.trim()).filter(Boolean);
      const existing = (draft[key] ?? []).map(s => s.trim()).filter(Boolean);
      if (canonical.length > 0 && existing.length === 0) {
        const acc: string[] = new Array(canonical.length).fill('');
        canonical.forEach((item, idx) =>
          slots.push({ text: item, apply: v => { acc[idx] = v; draft[key] = acc; } }),
        );
      }
    }

    if (slots.length === 0) {
      toast.success('No hay campos en inglés pendientes de completar.');
      return;
    }
    const translations = await runTranslate(
      slots.map(s => s.text),
      'Ficha pública de un curso de litigación (título, resumen, descripción, requisitos)',
    );
    if (!translations) return;
    slots.forEach((s, i) => s.apply(translations[i]));
    setFormData(prev => ({ ...prev, translations: { en: draft } }));
    toast.success(`${slots.length} campo${slots.length !== 1 ? 's' : ''} traducido${slots.length !== 1 ? 's' : ''}. Revisá antes de guardar.`);
  };

  const handleAutoTranslateModule = async () => {
    const draft = {
      en: { ...(moduleForm.translations?.en ?? {}) },
      videos: moduleForm.videos.map(v => ({ ...(v.translations?.en ?? {}) })),
      links: moduleForm.links.map(l => ({ ...(l.translations?.en ?? {}) })),
      flashcards: moduleForm.flashcards.map(f => ({ ...(f.translations?.en ?? {}) })),
    };
    const slots: { text: string; apply: (v: string) => void }[] = [];

    if (moduleForm.title.trim() && !(draft.en.title ?? '').trim()) {
      slots.push({ text: moduleForm.title, apply: v => { draft.en.title = v; } });
    }
    if (moduleForm.description.trim() && !(draft.en.description ?? '').trim()) {
      slots.push({ text: moduleForm.description, apply: v => { draft.en.description = v; } });
    }
    moduleForm.videos.forEach((v, i) => {
      if (v.title.trim() && !(draft.videos[i].title ?? '').trim()) {
        slots.push({ text: v.title, apply: t => { draft.videos[i].title = t; } });
      }
    });
    moduleForm.links.forEach((l, i) => {
      if (l.title.trim() && !(draft.links[i].title ?? '').trim()) {
        slots.push({ text: l.title, apply: t => { draft.links[i].title = t; } });
      }
      if ((l.description ?? '').trim() && !(draft.links[i].description ?? '').trim()) {
        slots.push({ text: l.description!, apply: t => { draft.links[i].description = t; } });
      }
    });
    moduleForm.flashcards.forEach((f, i) => {
      if (f.question.trim() && !(draft.flashcards[i].question ?? '').trim()) {
        slots.push({ text: f.question, apply: t => { draft.flashcards[i].question = t; } });
      }
      if (f.answer.trim() && !(draft.flashcards[i].answer ?? '').trim()) {
        slots.push({ text: f.answer, apply: t => { draft.flashcards[i].answer = t; } });
      }
    });

    if (slots.length === 0) {
      toast.success('No hay campos en inglés pendientes de completar.');
      return;
    }
    const translations = await runTranslate(
      slots.map(s => s.text),
      'Módulo de un curso de litigación: títulos, descripciones, enlaces y tarjetas de estudio',
    );
    if (!translations) return;
    slots.forEach((s, i) => s.apply(translations[i]));
    setModuleForm(prev => ({
      ...prev,
      translations: { en: draft.en },
      videos: prev.videos.map((v, i) => ({ ...v, translations: { en: draft.videos[i] } })),
      links: prev.links.map((l, i) => ({ ...l, translations: { en: draft.links[i] } })),
      flashcards: prev.flashcards.map((f, i) => ({ ...f, translations: { en: draft.flashcards[i] } })),
    }));
    toast.success(`${slots.length} campo${slots.length !== 1 ? 's' : ''} traducido${slots.length !== 1 ? 's' : ''}. Revisá antes de guardar.`);
  };

  const handleAutoTranslateQuestion = async () => {
    const slots: { text: string; apply: (v: string) => void }[] = [];
    const draft = {
      enQuestion: questionForm.enQuestion,
      enOptions: [...questionForm.enOptions],
      enExplanations: [...questionForm.enExplanations],
    };

    if (questionForm.question.trim() && !draft.enQuestion.trim()) {
      slots.push({ text: questionForm.question, apply: v => { draft.enQuestion = v; } });
    }
    questionForm.options.forEach((opt, i) => {
      if (opt.trim() && !(draft.enOptions[i] ?? '').trim()) {
        slots.push({ text: opt, apply: v => { draft.enOptions[i] = v; } });
      }
    });
    if (formData.testConfig.showExplanations) {
      questionForm.explanations.forEach((exp, i) => {
        if (exp.trim() && !(draft.enExplanations[i] ?? '').trim()) {
          slots.push({ text: exp, apply: v => { draft.enExplanations[i] = v; } });
        }
      });
    }

    if (slots.length === 0) {
      toast.success('No hay campos en inglés pendientes de completar.');
      return;
    }
    const translations = await runTranslate(
      slots.map(s => s.text),
      'Pregunta de examen de un curso de litigación con opciones múltiples',
    );
    if (!translations) return;
    slots.forEach((s, i) => s.apply(translations[i]));
    setQuestionForm(prev => ({ ...prev, ...draft }));
    toast.success('Traducción lista. Revisá antes de guardar.');
  };

  /* ── Subtitle handlers ──────────────────────────── */

  const activeModuleId = editingModuleIndex !== null ? modules[editingModuleIndex]?.id : null;

  // Merge freshly generated subtitles into both the modules list and the open
  // module form (matching videos by server id so unsaved edits are preserved).
  const refreshSubtitles = async () => {
    if (!editingCourse) return;
    try {
      const fresh = await modulesService.getModules(editingCourse.id);
      setModules(fresh);
      setModuleForm(prev => ({
        ...prev,
        videos: prev.videos.map(v => {
          if (!v.id) return v;
          const freshVideo = fresh
            .flatMap(m => m.videos ?? [])
            .find(fv => fv.id === v.id);
          return freshVideo ? { ...v, subtitles: freshVideo.subtitles } : v;
        }),
      }));
    } catch {
      /* next module edit reload will pick them up */
    }
  };

  const handleGenerateSubtitles = async (video: ModuleVideoForm) => {
    if (!activeModuleId || !video.id) return;
    try {
      const { job } = await subtitlesService.generate(activeModuleId, video.id);
      setSubtitleJobs(prev => ({ ...prev, [video.id!]: job }));
      toast.success('Generación de subtítulos iniciada. Puede tardar varios minutos.');
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'No se pudo iniciar la generación.';
      toast.error(message);
    }
  };

  const handlePickSubtitleFile = (videoIndex: number, lang: AppLanguage) => {
    subtitleTargetRef.current = { videoIndex, lang };
    subtitleInputRef.current?.click();
  };

  const handleSubtitleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = subtitleTargetRef.current;
    if (!file || !target) return;
    setUploadingSubtitle(true);
    try {
      const { url } = await uploadsService.uploadSubtitle(file);
      setModuleForm(prev => ({
        ...prev,
        videos: prev.videos.map((v, i) =>
          i === target.videoIndex
            ? {
                ...v,
                subtitles: [
                  ...(v.subtitles ?? []).filter(s => s.lang !== target.lang),
                  { lang: target.lang, url, source: 'manual' as const },
                ],
              }
            : v,
        ),
      }));
      toast.success(`Subtítulo ${target.lang.toUpperCase()} cargado. Guardá el módulo para aplicarlo.`);
    } catch {
      toast.error('Error al subir el subtítulo (.vtt o .srt).');
    } finally {
      setUploadingSubtitle(false);
      subtitleTargetRef.current = null;
      if (subtitleInputRef.current) subtitleInputRef.current.value = '';
    }
  };

  const handleRemoveSubtitle = (videoIndex: number, lang: AppLanguage) => {
    setModuleForm(prev => ({
      ...prev,
      videos: prev.videos.map((v, i) =>
        i === videoIndex ? { ...v, subtitles: (v.subtitles ?? []).filter(s => s.lang !== lang) } : v,
      ),
    }));
  };

  // Poll active generation jobs while a module is being edited.
  useEffect(() => {
    if (!activeModuleId) return;
    const activeIds = Object.entries(subtitleJobs)
      .filter(([, j]) => j.status === 'queued' || j.status === 'processing')
      .map(([videoId]) => videoId);
    if (activeIds.length === 0) return;

    const interval = setInterval(async () => {
      for (const videoId of activeIds) {
        try {
          const { job } = await subtitlesService.getJob(activeModuleId, videoId);
          if (!job) continue;
          setSubtitleJobs(prev => ({ ...prev, [videoId]: job }));
          if (job.status === 'done') {
            toast.success(job.warning ? `Subtítulos generados. ${job.warning}` : 'Subtítulos generados (ES y EN).');
            void refreshSubtitles();
          } else if (job.status === 'failed') {
            toast.error(`La generación de subtítulos falló: ${job.error ?? 'error desconocido'}`);
          }
        } catch {
          /* transient network error — keep polling */
        }
      }
    }, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleId, subtitleJobs]);

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

                {/* Subtítulos */}
                <div className="mt-2 pt-2 border-t border-chocolate-100/20">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-ink-light uppercase tracking-wide mr-1">Subtítulos</span>
                    {(video.subtitles ?? []).map(s => (
                      <span
                        key={s.lang}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-chocolate-50 text-[11px] text-chocolate font-medium"
                        title={s.source === 'auto' ? 'Generado automáticamente' : 'Subido manualmente'}
                      >
                        {s.lang.toUpperCase()} · {s.source === 'auto' ? 'auto' : 'manual'}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtitle(vi, s.lang)}
                          className="text-ink-light hover:text-error transition-colors"
                          title="Quitar subtítulo (se aplica al guardar el módulo)"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <div className="flex-1" />
                    <button
                      type="button"
                      onClick={() => handlePickSubtitleFile(vi, 'es')}
                      disabled={uploadingSubtitle}
                      className="px-2 py-0.5 text-[11px] font-medium text-chocolate bg-chocolate-50 rounded-lg hover:bg-chocolate-100/40 transition-colors disabled:opacity-50"
                    >
                      Subir ES
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePickSubtitleFile(vi, 'en')}
                      disabled={uploadingSubtitle}
                      className="px-2 py-0.5 text-[11px] font-medium text-chocolate bg-chocolate-50 rounded-lg hover:bg-chocolate-100/40 transition-colors disabled:opacity-50"
                    >
                      Subir EN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSubtitles(video)}
                      disabled={
                        !video.id ||
                        getVideoProvider(video.url) !== 'direct' ||
                        subtitleJobs[video.id ?? '']?.status === 'queued' ||
                        subtitleJobs[video.id ?? '']?.status === 'processing'
                      }
                      title={
                        !video.id
                          ? 'Guardá el módulo primero para poder generar subtítulos.'
                          : getVideoProvider(video.url) !== 'direct'
                            ? 'Solo disponible para videos MP4 subidos a la plataforma (no YouTube/Prezi).'
                            : 'Transcribe el audio y genera subtítulos en español e inglés.'
                      }
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-parchment bg-chocolate rounded-lg hover:bg-chocolate/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-3 h-3" />
                      Generar con IA
                    </button>
                  </div>
                  {video.id && subtitleJobs[video.id] && ['queued', 'processing'].includes(subtitleJobs[video.id].status) && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-ink-light">
                      <Loader2 className="w-3 h-3 animate-spin text-chocolate" />
                      {subtitleJobs[video.id].step || 'Procesando…'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4"
          onChange={handleVideoUpload}
          className="hidden"
        />
        <input
          ref={subtitleInputRef}
          type="file"
          accept=".vtt,.srt,text/vtt"
          onChange={handleSubtitleUpload}
          className="hidden"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploadingVideo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-parchment bg-chocolate rounded-lg hover:bg-chocolate/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploadingVideo ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploadingVideo
              ? videoUploadProgress >= 100
                ? 'Procesando…'
                : `Subiendo ${videoUploadProgress}%`
              : 'Subir video (MP4)'}
          </button>
          <button
            type="button"
            onClick={() => setModuleForm(prev => ({
              ...prev,
              videos: [...prev.videos, { url: '', title: '', durationInput: '', duration: 0, order: prev.videos.length }],
            }))}
            disabled={uploadingVideo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-chocolate bg-chocolate-50 rounded-lg hover:bg-chocolate-100/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar URL (YouTube, Vimeo…)
          </button>
          <span className="text-[11px] text-ink-light/70">MP4 hasta 1,5 GB</span>
        </div>
        {uploadingVideo && (
          <div className="mt-2 space-y-1">
            <div
              role="progressbar"
              aria-valuenow={videoUploadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 w-full overflow-hidden rounded-full bg-chocolate-100/30"
            >
              <div
                className="h-full bg-chocolate transition-[width] duration-150 ease-out"
                style={{ width: `${videoUploadProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-ink-light/80">
              {videoUploadProgress >= 100
                ? 'Subida completa. El servidor está guardando el archivo…'
                : `Subiendo al servidor: ${videoUploadProgress}%`}
            </p>
          </div>
        )}
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

      {/* External resource links */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Recursos externos (enlaces)</label>
        <p className="text-xs text-ink-light mb-3">
          Enlaces a material externo que el estudiante puede consultar o descargar. El título se
          muestra como enlace (la URL queda oculta) y la descripción aparece al pasar el mouse.
        </p>
        {moduleForm.links.length > 0 && (
          <div className="space-y-3 mb-3">
            {moduleForm.links.map((link, li) => (
              <div key={link.id ?? li} className="p-3 bg-parchment rounded-lg border border-chocolate-100/20 space-y-2">
                <div className="flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-chocolate shrink-0" />
                  <input
                    type="text"
                    value={link.title}
                    onChange={e => handleUpdateLink(li, 'title', e.target.value)}
                    placeholder="Título del enlace (ej. Fallo CSJN — texto completo)"
                    className="flex-1 px-3 py-1.5 text-sm bg-cream border border-chocolate-100/30 rounded-lg text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(li)}
                    className="p-1 rounded text-ink-light hover:text-error transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <input
                  type="url"
                  value={link.url}
                  onChange={e => handleUpdateLink(li, 'url', e.target.value)}
                  placeholder="https://…"
                  className="w-full px-3 py-1.5 text-sm bg-cream border border-chocolate-100/30 rounded-lg text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate"
                />
                <input
                  type="text"
                  value={link.description ?? ''}
                  onChange={e => handleUpdateLink(li, 'description', e.target.value)}
                  placeholder="Descripción (opcional, se muestra al pasar el mouse)"
                  className="w-full px-3 py-1.5 text-sm bg-cream border border-chocolate-100/30 rounded-lg text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate"
                />
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={handleAddLink}
          className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg"
        >
          <Link2 className="w-3 h-3" />
          Agregar enlace
        </button>
      </div>

      {/* Flashcards */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <label className="block text-sm font-medium text-ink">Tarjetas de estudio (flashcards)</label>
          {moduleForm.flashcards.length > 0 && (
            <span className="text-xs text-ink-light tabular-nums">
              {moduleForm.flashcards.length} tarjeta{moduleForm.flashcards.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p className="text-xs text-ink-light mb-3">
          Tarjetas pregunta/respuesta que el estudiante puede repasar (opcional, no afectan la
          finalización del módulo). Cargalas a mano o importá un CSV de dos columnas
          (pregunta, respuesta) — por ejemplo el que exporta NotebookLM.
        </p>
        {moduleForm.flashcards.length > 0 && (
          <div className="space-y-3 mb-3">
            {moduleForm.flashcards.map((card, ci) => (
              <div key={card.id ?? ci} className="p-3 bg-parchment rounded-lg border border-chocolate-100/20 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 text-xs text-ink-light tabular-nums shrink-0">{ci + 1}.</span>
                  <textarea
                    value={card.question}
                    onChange={e => handleUpdateFlashcard(ci, 'question', e.target.value)}
                    placeholder="Pregunta (frente de la tarjeta)"
                    rows={2}
                    className="flex-1 px-3 py-1.5 text-sm bg-cream border border-chocolate-100/30 rounded-lg text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate resize-y"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveFlashcard(ci)}
                    className="mt-1 p-1 rounded text-ink-light hover:text-error transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  value={card.answer}
                  onChange={e => handleUpdateFlashcard(ci, 'answer', e.target.value)}
                  placeholder="Respuesta (dorso de la tarjeta)"
                  rows={2}
                  className="w-full px-3 py-1.5 text-sm bg-cream border border-chocolate-100/30 rounded-lg text-ink placeholder:text-ink-light/60 focus:outline-none focus:border-chocolate resize-y"
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleAddFlashcard}
            className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg"
          >
            <Plus className="w-3 h-3" />
            Agregar tarjeta
          </button>
          <input
            ref={flashcardCsvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFlashcardCsvUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => flashcardCsvInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 btn-ghost btn-sm rounded-lg"
          >
            <Upload className="w-3 h-3" />
            Importar CSV
          </button>
        </div>
      </div>

      {/* English translation of the module's content */}
      <EnglishSection dense onAutoTranslate={handleAutoTranslateModule} translating={translating}>
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            value={moduleForm.translations?.en?.title ?? ''}
            onChange={e => setModuleEn('title', e.target.value)}
            placeholder={`Título en inglés — ES: ${moduleForm.title || '(sin título)'}`}
            className={`${INPUT} text-xs`}
          />
          <textarea
            value={moduleForm.translations?.en?.description ?? ''}
            onChange={e => setModuleEn('description', e.target.value)}
            placeholder="Descripción en inglés"
            rows={2}
            className={`${INPUT} text-xs resize-none`}
          />
        </div>
        {moduleForm.videos.some(v => v.title.trim()) && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-ink-light uppercase tracking-wide">Títulos de videos</p>
            {moduleForm.videos.map((video, vi) =>
              video.title.trim() ? (
                <input
                  key={video.id ?? vi}
                  type="text"
                  value={video.translations?.en?.title ?? ''}
                  onChange={e => setVideoEnTitle(vi, e.target.value)}
                  placeholder={`EN — ${video.title}`}
                  className={`${INPUT} text-xs`}
                />
              ) : null,
            )}
          </div>
        )}
        {moduleForm.links.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-ink-light uppercase tracking-wide">Enlaces</p>
            {moduleForm.links.map((link, li) => (
              <div key={link.id ?? li} className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <input
                  type="text"
                  value={link.translations?.en?.title ?? ''}
                  onChange={e => setLinkEn(li, 'title', e.target.value)}
                  placeholder={`Título EN — ${link.title || '(enlace)'}`}
                  className={`${INPUT} text-xs`}
                />
                <input
                  type="text"
                  value={link.translations?.en?.description ?? ''}
                  onChange={e => setLinkEn(li, 'description', e.target.value)}
                  placeholder="Descripción EN (opcional)"
                  className={`${INPUT} text-xs`}
                />
              </div>
            ))}
          </div>
        )}
        {moduleForm.flashcards.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-ink-light uppercase tracking-wide">Tarjetas de estudio</p>
            {moduleForm.flashcards.map((card, ci) => (
              <div key={card.id ?? ci} className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                <textarea
                  value={card.translations?.en?.question ?? ''}
                  onChange={e => setFlashcardEn(ci, 'question', e.target.value)}
                  placeholder={`Pregunta EN — ${card.question.slice(0, 60) || `tarjeta ${ci + 1}`}`}
                  rows={2}
                  className={`${INPUT} text-xs resize-y`}
                />
                <textarea
                  value={card.translations?.en?.answer ?? ''}
                  onChange={e => setFlashcardEn(ci, 'answer', e.target.value)}
                  placeholder="Respuesta EN"
                  rows={2}
                  className={`${INPUT} text-xs resize-y`}
                />
              </div>
            ))}
          </div>
        )}
      </EnglishSection>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Precio (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                    <input
                      type="number"
                      value={formData.priceUsd ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, priceUsd: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="Sin venta internacional"
                      min={0}
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
                      value={formData.discountPriceUsd ?? ''}
                      onChange={e => setFormData(prev => ({ ...prev, discountPriceUsd: e.target.value ? Number(e.target.value) : undefined }))}
                      placeholder="Opcional"
                      min={0}
                      className={`${INPUT} pl-9`}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-ink-light">
                Precio fijo en dólares para compradores internacionales (Lemon Squeezy). Si se deja vacío, el curso no se vende en USD.
              </p>
              {formData.discountPrice && formData.price > 0 && formData.discountPrice < formData.price && (
                <p className="text-sm text-success font-medium">
                  Descuento: {Math.round((1 - formData.discountPrice / formData.price) * 100)}% OFF
                </p>
              )}
            </div>
          </div>

          {/* Section 5: Prerrequisitos */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Prerrequisitos</h2>

            {/* Correlativas (course-to-course prereqs, enforced at exam time) */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-ink mb-1">Cursos correlativos requeridos</label>
              <p className="text-xs text-ink-light mb-2">
                El alumno deberá completar estos cursos antes de poder rendir el examen de este curso.
                No bloquea la compra ni la visualización del contenido.
              </p>
              {courses.filter(c => c.id !== editingCourse?.id).length === 0 ? (
                <p className="text-sm text-ink-light italic">No hay otros cursos disponibles para marcar como correlativos.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-chocolate-100/30 rounded-xl p-3 bg-cream/50">
                  {courses
                    .filter(c => c.id !== editingCourse?.id)
                    .map(course => {
                      const checked = formData.prerequisiteCourseIds.includes(course.id);
                      return (
                        <div
                          key={course.id}
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            prerequisiteCourseIds: checked
                              ? prev.prerequisiteCourseIds.filter(id => id !== course.id)
                              : [...prev.prerequisiteCourseIds, course.id],
                          }))}
                          className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                            checked
                              ? 'bg-chocolate-50 border border-chocolate/20'
                              : 'hover:bg-cream-dark/30 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="w-4 h-4 rounded accent-chocolate pointer-events-none"
                          />
                          <span className="text-sm text-ink flex-1">{course.title}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <label className="block text-sm font-medium text-ink mb-2">Otros prerrequisitos (texto libre)</label>
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

          {/* Section 7.5: Traducción al inglés */}
          <div>
            <h2 className="font-display text-base font-semibold text-ink border-b border-chocolate-100/20 pb-2 mb-4">Versión en inglés</h2>
            <EnglishSection onAutoTranslate={handleAutoTranslateCourse} translating={translating} defaultOpen={!!formData.translations?.en?.title}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Título (EN)</label>
                  <input
                    type="text"
                    value={formData.translations?.en?.title ?? ''}
                    onChange={e => setCourseEn('title', e.target.value)}
                    placeholder={formData.title || 'Course title'}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Categoría (EN)</label>
                  <input
                    type="text"
                    value={formData.translations?.en?.category ?? ''}
                    onChange={e => setCourseEn('category', e.target.value)}
                    placeholder={formData.category || 'Category'}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Duración (EN)</label>
                  <input
                    type="text"
                    value={formData.translations?.en?.duration ?? ''}
                    onChange={e => setCourseEn('duration', e.target.value)}
                    placeholder={formData.duration || 'e.g. 6 weeks'}
                    className={INPUT}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Resumen (EN)</label>
                  <textarea
                    value={formData.translations?.en?.summary ?? ''}
                    onChange={e => setCourseEn('summary', e.target.value)}
                    rows={2}
                    className={`${INPUT} resize-none`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Descripción (EN)</label>
                  <textarea
                    value={formData.translations?.en?.description ?? ''}
                    onChange={e => setCourseEn('description', e.target.value)}
                    rows={4}
                    className={`${INPUT} resize-y`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Garantía de devolución (EN)</label>
                  <input
                    type="text"
                    value={formData.translations?.en?.moneyBackGuarantee ?? ''}
                    onChange={e => setCourseEn('moneyBackGuarantee', e.target.value)}
                    placeholder={formData.moneyBackGuarantee || 'e.g. 30-day money-back guarantee'}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Prerrequisitos (EN)
                    <span className="text-xs text-ink-light font-normal ml-1">— uno por línea</span>
                  </label>
                  <textarea
                    value={(formData.translations?.en?.prerequisites ?? []).join('\n')}
                    onChange={e => setCourseEn('prerequisites', e.target.value.split('\n'))}
                    rows={3}
                    className={`${INPUT} resize-y`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Contenidos del curso (EN)
                    <span className="text-xs text-ink-light font-normal ml-1">— uno por línea</span>
                  </label>
                  <textarea
                    value={(formData.translations?.en?.tableOfContents ?? []).join('\n')}
                    onChange={e => setCourseEn('tableOfContents', e.target.value.split('\n'))}
                    rows={4}
                    className={`${INPUT} resize-y`}
                  />
                </div>
              </div>
            </EnglishSection>
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
                <div className="p-4 bg-cream-dark/50 rounded-xl space-y-4">
                  {/* Mode toggles */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.testConfig.timed}
                        onChange={e => setFormData(prev => ({ ...prev, testConfig: { ...prev.testConfig, timed: e.target.checked } }))}
                        className="w-4 h-4 rounded accent-chocolate"
                      />
                      <span className="text-sm text-ink font-medium">Con límite de tiempo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.testConfig.showExplanations}
                        onChange={e => setFormData(prev => ({ ...prev, testConfig: { ...prev.testConfig, showExplanations: e.target.checked } }))}
                        className="w-4 h-4 rounded accent-chocolate"
                      />
                      <span className="text-sm text-ink font-medium">Modo explicaciones (corrección inmediata)</span>
                    </label>
                  </div>

                  {formData.testConfig.showExplanations && (
                    <p className="text-xs text-ink-light">
                      El alumno verá si cada respuesta es correcta apenas la elija, junto con una explicación por opción. Cargá las explicaciones en cada pregunta, más abajo.
                    </p>
                  )}

                  {/* Numeric config */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-ink mb-1">Preguntas</label>
                      <div className={`${INPUT} bg-cream-dark text-ink-light`}>
                        {questions.length} pregunta{questions.length !== 1 ? 's' : ''} agregada{questions.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {formData.testConfig.timed && (
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
                    )}
                    <div>
                      <label className="block text-xs font-medium text-ink mb-1">Reintentos</label>
                      <input
                        type="number"
                        value={formData.testConfig.maxRetries}
                        onChange={e => setFormData(prev => ({ ...prev, testConfig: { ...prev.testConfig, maxRetries: Number(e.target.value) } }))}
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
                          <div key={i} className="space-y-1.5">
                            <div className="flex items-center gap-2">
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
                            {formData.testConfig.showExplanations && (
                              <textarea
                                value={questionForm.explanations[i] ?? ''}
                                onChange={e => handleUpdateExplanation(i, e.target.value)}
                                placeholder={`Explicación de la opción ${String.fromCharCode(65 + i)} (por qué es correcta o incorrecta)`}
                                rows={2}
                                className={`${INPUT} ml-6 w-[calc(100%-1.5rem)] resize-none text-xs py-2`}
                              />
                            )}
                          </div>
                        ))}
                      </div>

                      {/* English version of the question */}
                      <EnglishSection dense onAutoTranslate={handleAutoTranslateQuestion} translating={translating}>
                        <textarea
                          value={questionForm.enQuestion}
                          onChange={e => setQuestionForm(prev => ({ ...prev, enQuestion: e.target.value }))}
                          placeholder={`Pregunta en inglés — ES: ${questionForm.question.slice(0, 80) || '(sin pregunta)'}`}
                          rows={2}
                          className={`${INPUT} text-xs resize-none`}
                        />
                        <div className="space-y-1.5">
                          {questionForm.options.map((opt, i) =>
                            opt.trim() ? (
                              <div key={i} className="space-y-1">
                                <input
                                  type="text"
                                  value={questionForm.enOptions[i] ?? ''}
                                  onChange={e => setQuestionForm(prev => ({
                                    ...prev,
                                    enOptions: prev.enOptions.map((o, oi) => oi === i ? e.target.value : o),
                                  }))}
                                  placeholder={`Opción ${i + 1} EN — ${opt.slice(0, 60)}`}
                                  className={`${INPUT} text-xs py-2`}
                                />
                                {formData.testConfig.showExplanations && (questionForm.explanations[i] ?? '').trim() && (
                                  <textarea
                                    value={questionForm.enExplanations[i] ?? ''}
                                    onChange={e => setQuestionForm(prev => ({
                                      ...prev,
                                      enExplanations: prev.enExplanations.map((x, xi) => xi === i ? e.target.value : x),
                                    }))}
                                    placeholder={`Explicación ${String.fromCharCode(65 + i)} EN`}
                                    rows={2}
                                    className={`${INPUT} ml-4 w-[calc(100%-1rem)] resize-none text-xs py-2`}
                                  />
                                )}
                              </div>
                            ) : null,
                          )}
                        </div>
                        <p className="text-[11px] text-ink-light/80">
                          Las opciones en inglés se guardan solo si están todas traducidas (para no mezclar idiomas en el examen).
                        </p>
                      </EnglishSection>

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
                        {mod.videos?.length ?? 0} video{(mod.videos?.length ?? 0) !== 1 ? 's' : ''}
                        {mod.materials?.length ? ` · ${mod.materials.length} material${mod.materials.length !== 1 ? 'es' : ''}` : ''}
                        {mod.links?.length ? ` · ${mod.links.length} enlace${mod.links.length !== 1 ? 's' : ''}` : ''}
                        {mod.flashcards?.length ? ` · ${mod.flashcards.length} tarjeta${mod.flashcards.length !== 1 ? 's' : ''}` : ''}
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
                            {(mod.videos ?? []).length > 0 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {mod.videos.map(v => (
                                  <ModuleVideoPreview key={v.id} video={v} />
                                ))}
                              </div>
                            )}
                            {(mod.materials ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {mod.materials.map(mat => (
                                  <span key={mat.id} className="inline-flex items-center gap-1 text-xs bg-parchment text-ink px-2 py-0.5 rounded-full">
                                    <FileText className="w-3 h-3" />
                                    {mat.name}
                                  </span>
                                ))}
                              </div>
                            )}
                            {(mod.links ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {(mod.links ?? []).map((link, li) => (
                                  <span key={link.id ?? li} className="inline-flex items-center gap-1 text-xs bg-parchment text-ink px-2 py-0.5 rounded-full">
                                    <Link2 className="w-3 h-3" />
                                    {link.title}
                                  </span>
                                ))}
                              </div>
                            )}
                            {(mod.flashcards ?? []).length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 text-xs bg-parchment text-ink px-2 py-0.5 rounded-full">
                                  <Layers className="w-3 h-3" />
                                  {mod.flashcards!.length} tarjeta{mod.flashcards!.length !== 1 ? 's' : ''} de estudio
                                </span>
                              </div>
                            )}
                            {(mod.videos ?? []).length === 0 && (mod.materials ?? []).length === 0 && (mod.links ?? []).length === 0 && (mod.flashcards ?? []).length === 0 && (
                              <p className="text-xs italic">Sin videos, materiales, enlaces ni tarjetas</p>
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
