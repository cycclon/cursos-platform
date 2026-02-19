import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Play, CheckCircle2, Lock, FileText, Download,
  ChevronLeft, BookOpen, ArrowRight, ChevronRight,
} from 'lucide-react';
import { coursesService } from '@/services/courses';
import { enrollmentsService } from '@/services/enrollments';
import VideoPlayer from '@/components/ui/VideoPlayer';
import { useToast } from '@/context/ToastContext';
import { formatDuration } from '@/utils/video';
import type { ModuleProgressEntry, ModuleVideo } from '@/types';

// Helper to get the effective videos list (handles legacy single videoUrl)
function getModuleVideos(mod: { videos?: ModuleVideo[]; videoUrl?: string; videoDuration?: string; title?: string }): ModuleVideo[] {
  if (mod.videos && mod.videos.length > 0) return mod.videos;
  if (mod.videoUrl) {
    return [{
      id: 'legacy-0',
      url: mod.videoUrl,
      title: mod.title || '',
      duration: 0,
      order: 0,
    }];
  }
  return [];
}

// Helper to extract module progress entry (handles legacy number format)
function getModuleProgressEntry(
  enrollment: { moduleProgress?: Record<string, ModuleProgressEntry | number> } | undefined,
  moduleId: string,
): ModuleProgressEntry | null {
  if (!enrollment?.moduleProgress) return null;
  const entry = enrollment.moduleProgress[moduleId];
  if (!entry || typeof entry === 'number') return null;
  return entry;
}

export default function CoursePlayer() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesService.getCourses,
  });

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ['enrollments'],
    queryFn: enrollmentsService.getEnrollments,
  });

  // Debounced invalidation — only re-fetch enrollment data every 30s max
  const lastInvalidateRef = useRef(0);
  const invalidateEnrollments = useCallback(() => {
    const now = Date.now();
    if (now - lastInvalidateRef.current > 30_000) {
      lastInvalidateRef.current = now;
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    }
  }, [queryClient]);

  const saveVideoProgressMutation = useMutation({
    mutationFn: (data: {
      courseId: string; moduleId: string; videoId: string;
      watchedSeconds: number; maxReachedSeconds: number;
      duration: number; lastPosition: number;
    }) => enrollmentsService.saveVideoProgress(data.courseId, {
      moduleId: data.moduleId,
      videoId: data.videoId,
      watchedSeconds: data.watchedSeconds,
      maxReachedSeconds: data.maxReachedSeconds,
      duration: data.duration,
      lastPosition: data.lastPosition,
    }),
    onSuccess: () => {
      invalidateEnrollments();
    },
    onError: (error) => {
      console.error('[CoursePlayer] Save progress error:', error);
      toast.error('Error al guardar el progreso del video.');
    },
    retry: false,
  });

  const course = courses.find(c => c.id === id);
  const enrollment = enrollments.find(e => e.courseId === id);

  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);

  // Local real-time progress state (updates from VideoPlayer without server round-trips)
  const [liveProgress, setLiveProgress] = useState<{
    watchedSeconds: number;
    duration: number;
    currentPosition: number;
  } | null>(null);

  // Ref to hold latest progress for beforeunload
  const latestProgressRef = useRef<{
    courseId: string; moduleId: string; videoId: string;
    watchedSeconds: number; maxReachedSeconds: number;
    duration: number; lastPosition: number;
  } | null>(null);

  // Set initial module + video when course loads
  useEffect(() => {
    if (course && course.modules.length > 0 && !activeModuleId) {
      const lastWatched = enrollment?.lastWatchedModule;
      let targetModuleId = course.modules[0].id;

      if (lastWatched && course.modules.some(m => m.id === lastWatched)) {
        targetModuleId = lastWatched;
      }

      setActiveModuleId(targetModuleId);

      // Resume to last video within module
      const progressEntry = getModuleProgressEntry(enrollment, targetModuleId);
      let targetVideoId: string | undefined;
      if (progressEntry?.lastVideoId) {
        const mod = course.modules.find(m => m.id === targetModuleId);
        const videos = mod ? getModuleVideos(mod) : [];
        const idx = videos.findIndex(v => v.id === progressEntry.lastVideoId);
        if (idx >= 0) {
          setActiveVideoIndex(idx);
          targetVideoId = progressEntry.lastVideoId;
        }
      }

      // Seed progress bar from saved data immediately
      if (targetVideoId) {
        const vp = progressEntry?.videos?.[targetVideoId];
        if (vp && vp.duration > 0) {
          setLiveProgress({
            watchedSeconds: vp.watchedSeconds,
            duration: vp.duration,
            currentPosition: vp.lastPosition,
          });
        }
      }
    }
  }, [course, enrollment, activeModuleId]);

  const activeModule = course?.modules.find(m => m.id === activeModuleId);
  const moduleVideos = activeModule ? getModuleVideos(activeModule) : [];
  const activeVideo = moduleVideos[activeVideoIndex];

  // Get video progress for resume
  const progressEntry = getModuleProgressEntry(enrollment, activeModuleId);
  const videoProgress = activeVideo && progressEntry?.videos?.[activeVideo.id];

  // Seed liveProgress from server data for a given module/video
  const seedLiveProgress = useCallback((moduleId: string, vidId?: string) => {
    const entry = getModuleProgressEntry(enrollment, moduleId);
    const vp = vidId ? entry?.videos?.[vidId] : undefined;
    if (vp && vp.duration > 0) {
      setLiveProgress({
        watchedSeconds: vp.watchedSeconds,
        duration: vp.duration,
        currentPosition: vp.lastPosition,
      });
    } else {
      setLiveProgress(null);
    }
  }, [enrollment]);

  // Handle module change — reset video index and try to resume
  const handleModuleChange = useCallback((moduleId: string) => {
    setActiveModuleId(moduleId);
    const entry = getModuleProgressEntry(enrollment, moduleId);
    if (entry?.lastVideoId) {
      const mod = course?.modules.find(m => m.id === moduleId);
      const videos = mod ? getModuleVideos(mod) : [];
      const idx = videos.findIndex(v => v.id === entry.lastVideoId);
      setActiveVideoIndex(idx >= 0 ? idx : 0);
      seedLiveProgress(moduleId, entry.lastVideoId);
    } else {
      setActiveVideoIndex(0);
      seedLiveProgress(moduleId);
    }
  }, [enrollment, course, seedLiveProgress]);

  // Progress update from VideoPlayer
  const handleProgressUpdate = useCallback((data: {
    watchedSeconds: number; maxReachedSeconds: number;
    duration: number; currentPosition: number;
  }) => {
    // Always update local state for real-time UI feedback
    setLiveProgress({
      watchedSeconds: data.watchedSeconds,
      duration: data.duration,
      currentPosition: data.currentPosition,
    });

    if (!course || !activeModuleId || !activeVideo || !enrollment) return;

    const payload = {
      courseId: course.id,
      moduleId: activeModuleId,
      videoId: activeVideo.id,
      watchedSeconds: data.watchedSeconds,
      maxReachedSeconds: data.maxReachedSeconds,
      duration: data.duration,
      lastPosition: data.currentPosition,
    };

    latestProgressRef.current = payload;
    saveVideoProgressMutation.mutate(payload);
  }, [course, activeModuleId, activeVideo, enrollment, saveVideoProgressMutation]);

  // Video ended — auto-advance to next video or complete module
  const handleVideoEnded = useCallback(() => {
    if (!activeModule || !course || !enrollment) return;

    // Check if there are more videos in this module
    if (activeVideoIndex < moduleVideos.length - 1) {
      const nextVideo = moduleVideos[activeVideoIndex + 1];
      setActiveVideoIndex(activeVideoIndex + 1);
      seedLiveProgress(activeModuleId, nextVideo?.id);
    } else {
      // Last video — force refresh to pick up completion status
      lastInvalidateRef.current = 0; // reset debounce
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      toast.success('¡Módulo completado!');
    }
  }, [activeModule, activeModuleId, activeVideoIndex, moduleVideos, course, enrollment, queryClient, toast, seedLiveProgress]);

  // Save progress on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = latestProgressRef.current;
      if (!data) return;

      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const url = `${apiBase}/enrollments/${data.courseId}/save-video-progress`;

      try {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          keepalive: true,
          body: JSON.stringify({
            moduleId: data.moduleId,
            videoId: data.videoId,
            watchedSeconds: data.watchedSeconds,
            maxReachedSeconds: data.maxReachedSeconds,
            duration: data.duration,
            lastPosition: data.lastPosition,
          }),
        });
      } catch {
        // Best effort
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Calculate module progress percentage from server data
  const getModulePercent = (moduleId: string): number => {
    const entry = getModuleProgressEntry(enrollment, moduleId);
    if (!entry?.videos) return 0;
    const videos = Object.values(entry.videos);
    const totalReached = videos.reduce((s, v) => s + v.maxReachedSeconds, 0);
    const totalDuration = videos.reduce((s, v) => s + v.duration, 0);
    if (totalDuration <= 0) return 0;
    return Math.min(100, Math.round((totalReached / totalDuration) * 100));
  };

  // Live progress for the currently playing video (based on playback position)
  const liveVideoPercent = liveProgress && liveProgress.duration > 0
    ? Math.min(100, Math.round((liveProgress.currentPosition / liveProgress.duration) * 100))
    : null;

  const isLoading = loadingCourses || loadingEnrollments;

  if (isLoading || !course) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="bg-parchment border-b border-chocolate-100/30 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="h-5 w-5 bg-chocolate-50 rounded animate-pulse" />
            <div>
              <div className="h-5 w-48 bg-chocolate-50 rounded animate-pulse" />
              <div className="h-3 w-24 bg-chocolate-50 rounded animate-pulse mt-1" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
          <div className="flex-1 p-4 lg:p-6">
            <div className="aspect-video rounded-xl bg-parchment animate-pulse mb-6" />
            <div className="bg-parchment rounded-xl p-6 h-32 animate-pulse" />
          </div>
          <div className="w-full lg:w-80 bg-parchment border-l border-chocolate-100/30 p-4">
            <div className="space-y-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="h-14 bg-chocolate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="relative aspect-video rounded-xl overflow-hidden bg-ink mb-2">
            {activeModule && activeVideo && (activeModule.isFree || enrollment) ? (
              <VideoPlayer
                key={`${activeModuleId}-${activeVideo.id}`}
                url={activeVideo.url}
                videoId={activeVideo.id}
                initialPosition={videoProgress?.lastPosition ?? 0}
                maxAllowedPosition={videoProgress?.maxReachedSeconds ?? 0}
                initialWatchedSeconds={videoProgress?.watchedSeconds ?? 0}
                onProgressUpdate={handleProgressUpdate}
                onVideoEnded={handleVideoEnded}
              />
            ) : activeModule && !activeVideo ? (
              <div className="w-full h-full flex items-center justify-center bg-ink/90">
                <div className="text-center text-cream">
                  <Play className="w-12 h-12 text-cream/30 mx-auto mb-3" />
                  <p className="text-cream-dark/60">Este módulo no tiene videos</p>
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
          </div>

          {/* Live video progress bar */}
          {activeVideo && liveVideoPercent !== null && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-light">
                  Progreso del video: {liveVideoPercent}%
                  {liveProgress && liveProgress.duration > 0 && (
                    <> · {formatDuration(liveProgress.currentPosition)} / {formatDuration(liveProgress.duration)}</>
                  )}
                </span>
                {liveVideoPercent >= 95 && (
                  <span className="text-xs text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completado
                  </span>
                )}
              </div>
              <div className="w-full h-1.5 rounded-full bg-chocolate-100/20">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${liveVideoPercent}%`,
                    background: liveVideoPercent >= 95
                      ? 'var(--color-success)'
                      : 'linear-gradient(90deg, var(--color-chocolate), var(--color-gold))',
                  }}
                />
              </div>
            </div>
          )}

          {/* Video playlist (when module has multiple videos) */}
          {activeModule && moduleVideos.length > 1 && (activeModule.isFree || enrollment) && (
            <div className="bg-parchment rounded-xl border border-chocolate-100/20 mb-4 overflow-hidden">
              <div className="px-4 py-3 border-b border-chocolate-100/15">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Play className="w-4 h-4 text-gold" />
                  Videos del módulo
                  <span className="text-xs text-ink-light font-normal">
                    ({activeVideoIndex + 1} de {moduleVideos.length})
                  </span>
                </h3>
              </div>
              <div className="divide-y divide-chocolate-100/10">
                {moduleVideos.map((video, idx) => {
                  const isActive = idx === activeVideoIndex;
                  const vp = progressEntry?.videos?.[video.id];
                  const isVideoCompleted = vp?.completed ?? false;

                  return (
                    <button
                      key={video.id}
                      onClick={() => {
                        setActiveVideoIndex(idx);
                        seedLiveProgress(activeModuleId, video.id);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors text-sm ${
                        isActive
                          ? 'bg-chocolate-50/70'
                          : 'hover:bg-cream-dark/40'
                      }`}
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold">
                        {isVideoCompleted ? (
                          <CheckCircle2 className="w-4.5 h-4.5 text-success" />
                        ) : isActive ? (
                          <span className="w-2 h-2 rounded-full bg-chocolate animate-pulse" />
                        ) : (
                          <span className="text-ink-light">{idx + 1}</span>
                        )}
                      </span>
                      <span className={`flex-1 truncate ${isActive ? 'text-chocolate font-medium' : 'text-ink'}`}>
                        {video.title || `Video ${idx + 1}`}
                      </span>
                      {video.duration > 0 && (
                        <span className="text-xs text-ink-light shrink-0">
                          {formatDuration(video.duration)}
                        </span>
                      )}
                      {vp && vp.duration > 0 && !isVideoCompleted && (
                        <div className="w-12 h-1 rounded-full bg-chocolate-100/30 shrink-0">
                          <div
                            className="h-full rounded-full bg-chocolate"
                            style={{ width: `${Math.min(100, Math.round((vp.watchedSeconds / vp.duration) * 100))}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Module description */}
          {activeModule && (
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
          )}

          {/* Materials */}
          {activeModule && activeModule.materials.length > 0 && (
            <div className="bg-parchment rounded-xl p-6 border border-chocolate-100/20">
              <h3 className="font-display text-lg font-semibold text-ink mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold" />
                Material descargable
              </h3>
              <div className="space-y-2">
                {activeModule.materials.map((mat, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-cream-dark/50 hover:bg-cream-dark transition-colors">
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
                const videos = getModuleVideos(mod);
                const modPercent = active && liveVideoPercent !== null
                  ? liveVideoPercent // Use live data for the active module
                  : getModulePercent(mod.id); // Use server data for others

                return (
                  <button
                    key={mod.id}
                    onClick={() => handleModuleChange(mod.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all text-sm ${
                      active
                        ? 'bg-chocolate-50 border border-chocolate/20'
                        : 'hover:bg-cream-dark/50'
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    ) : mod.isFree || enrollment ? (
                      <Play className="w-5 h-5 text-chocolate shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-ink-light/50 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${active ? 'text-chocolate' : 'text-ink'}`}>
                        {mod.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-ink-light">
                          {videos.length > 0
                            ? `${videos.length} video${videos.length > 1 ? 's' : ''}`
                            : 'Sin video'}
                          {mod.isFree && ' · Gratis'}
                        </p>
                        {modPercent > 0 && !completed && (
                          <div className="flex items-center gap-1">
                            <div className="w-10 h-1 rounded-full bg-chocolate-100/30">
                              <div
                                className="h-full rounded-full bg-chocolate transition-all duration-300"
                                style={{ width: `${modPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-ink-light">{modPercent}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {active && <ChevronRight className="w-4 h-4 text-chocolate/50 shrink-0" />}
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
                  className="h-full rounded-full transition-all duration-500"
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
    </div>
  );
}
