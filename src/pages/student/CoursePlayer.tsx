import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play, CheckCircle2, Lock, FileText, Download,
  ChevronLeft, BookOpen, ArrowRight,
} from 'lucide-react';
import { getCourse, getEnrollment } from '@/data/mock';
import RoleSwitcher from '@/components/layout/RoleSwitcher';

export default function CoursePlayer() {
  const { id } = useParams<{ id: string }>();
  const course = getCourse(id ?? '');
  const enrollment = getEnrollment(id ?? '');
  const [activeModuleId, setActiveModuleId] = useState<string>(
    course?.modules[0]?.id ?? ''
  );

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl text-ink">Curso no encontrado</h1>
      </div>
    );
  }

  const activeModule = course.modules.find(m => m.id === activeModuleId) ?? course.modules[0];
  const isCompleted = (modId: string) => enrollment?.completedModules.includes(modId) ?? false;
  const fileIcon: Record<string, string> = { pdf: 'PDF', docx: 'DOC', pptx: 'PPT', xlsx: 'XLS' };

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <div className="bg-parchment border-b border-chocolate-100/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/mi-panel" className="text-ink-light hover:text-chocolate transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-display text-lg font-bold text-ink">{course.title}</h1>
              <p className="text-xs text-ink-light">
                {enrollment ? `${enrollment.progress}% completado` : 'No inscripto'}
              </p>
            </div>
          </div>
          {course.hasTest && enrollment && enrollment.progress === 100 && (
            <Link
              to={`/examen/${course.id}`}
              className="inline-flex items-center gap-1.5 btn-primary btn-sm rounded-lg"
            >
              Rendir examen
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        {/* Video + Content area */}
        <div className="flex-1 p-4 lg:p-6">
          {/* Video player */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-ink mb-6">
            {activeModule.isFree || enrollment ? (
              <div className="w-full h-full flex items-center justify-center bg-ink/90">
                <div className="text-center text-cream">
                  <div className="w-20 h-20 rounded-full bg-cream/10 flex items-center justify-center mx-auto mb-4">
                    <Play className="w-10 h-10 text-cream ml-1" />
                  </div>
                  <p className="font-display text-lg font-semibold">{activeModule.title}</p>
                  {activeModule.videoDuration && (
                    <p className="text-sm text-cream-dark/60 mt-1">Duración: {activeModule.videoDuration}</p>
                  )}
                  <p className="text-xs text-cream-dark/40 mt-3">(Reproductor de video — Demo)</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-ink/80">
                <div className="text-center text-cream">
                  <Lock className="w-12 h-12 text-cream/30 mx-auto mb-3" />
                  <p className="font-display text-lg">Contenido bloqueado</p>
                  <p className="text-sm text-cream-dark/60 mt-1">Inscribite para acceder a este módulo</p>
                </div>
              </div>
            )}
            {/* Overlay to prevent right-click on real video */}
            <div
              className="absolute inset-0"
              onContextMenu={e => e.preventDefault()}
              style={{ pointerEvents: 'none' }}
            />
          </div>

          {/* Module description */}
          <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20 mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                activeModule.isFree ? 'bg-success-light text-success' : 'bg-chocolate-50 text-chocolate'
              }`}>
                {activeModule.number}
              </span>
              <h2 className="font-display text-xl font-bold text-ink">{activeModule.title}</h2>
            </div>
            <p className="text-sm text-ink-light leading-relaxed">{activeModule.description}</p>
          </div>

          {/* Materials */}
          {activeModule.materials.length > 0 && (
            <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20">
              <h3 className="font-display text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Material descargable
              </h3>
              <div className="space-y-2">
                {activeModule.materials.map(mat => (
                  <div key={mat.id} className="flex items-center justify-between p-3 rounded-lg bg-cream-dark/50 hover:bg-cream-dark transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-chocolate bg-chocolate-50 px-2 py-1 rounded">
                        {fileIcon[mat.type] || mat.type.toUpperCase()}
                      </span>
                      <span className="text-sm text-ink">{mat.name}</span>
                      <span className="text-xs text-ink-light">{mat.size}</span>
                    </div>
                    <button className="p-2 text-chocolate hover:text-chocolate-dark transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Module sidebar */}
        <div className="w-full lg:w-80 bg-parchment border-l border-chocolate-100/30 lg:min-h-[calc(100vh-8rem)]">
          <div className="p-4">
            <h3 className="font-display text-sm font-semibold text-ink uppercase tracking-wider mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              Módulos
            </h3>
            <div className="space-y-1">
              {course.modules.map(mod => {
                const active = mod.id === activeModuleId;
                const completed = isCompleted(mod.id);
                return (
                  <button
                    key={mod.id}
                    onClick={() => setActiveModuleId(mod.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all text-sm ${
                      active
                        ? 'bg-chocolate-50 border border-chocolate/20'
                        : 'hover:bg-cream-dark/50'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    ) : mod.isFree ? (
                      <Play className="w-5 h-5 text-chocolate shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-ink-light/50 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${active ? 'text-chocolate' : 'text-ink'}`}>
                        {mod.title}
                      </p>
                      <p className="text-xs text-ink-light">
                        {mod.videoDuration || 'Sin video'}
                        {mod.isFree && ' · Gratis'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress */}
          {enrollment && (
            <div className="p-4 mx-4 mb-4 rounded-xl bg-chocolate-50 border border-chocolate-100/30">
              <div className="flex justify-between text-xs text-ink-light mb-1.5">
                <span>Tu progreso</span>
                <span className="font-semibold">{enrollment.progress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-chocolate-100/30">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${enrollment.progress}%`,
                    background: 'linear-gradient(90deg, var(--color-chocolate), var(--color-gold))',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
      <RoleSwitcher />
    </div>
  );
}
