import { useEffect, useRef, useCallback, useState } from 'react';
import { Play, CheckCircle2 } from 'lucide-react';
import { getVideoProvider, getPreziEmbedUrl } from '@/utils/video';

const SAVE_INTERVAL_MS = 10_000; // Report progress every 10 seconds
const TICK_INTERVAL_MS = 1_000;  // Internal tracking tick
const MAX_DELTA_S = 3;           // Max delta to count as real playback
const SEEK_TOLERANCE = 2;        // Seconds tolerance for skip prevention

interface ProgressData {
  watchedSeconds: number;
  maxReachedSeconds: number;
  duration: number;
  currentPosition: number;
}

interface VideoPlayerProps {
  url: string;
  videoId: string;
  initialPosition?: number;
  maxAllowedPosition?: number;
  initialWatchedSeconds?: number;
  onProgressUpdate?: (data: ProgressData) => void;
  onVideoEnded?: () => void;
}

export default function VideoPlayer({
  url,
  videoId,
  initialPosition = 0,
  maxAllowedPosition = 0,
  initialWatchedSeconds = 0,
  onProgressUpdate,
  onVideoEnded,
}: VideoPlayerProps) {
  const provider = getVideoProvider(url);
  const [hasCompleted, setHasCompleted] = useState(false);

  // Tracking refs
  const watchedSecondsRef = useRef(0);
  const maxReachedRef = useRef(maxAllowedPosition);
  const durationRef = useRef(0);
  const lastTickRef = useRef(0);
  const lastReportRef = useRef(0);
  const isPlayingRef = useRef(false);
  const currentPositionRef = useRef(0);
  const completedRef = useRef(false);

  // DOM refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ytPlayerRef = useRef<unknown>(null);
  const ytWrapperRef = useRef<HTMLDivElement | null>(null);
  const containerIdRef = useRef(`yt-player-${videoId}-${Date.now()}`);

  // Ref for initialPosition so YouTube effect doesn't re-run when enrollment loads
  const initialPositionRef = useRef(initialPosition);
  initialPositionRef.current = initialPosition;

  // Track whether we've already applied resume for this video
  const resumeAppliedRef = useRef(false);

  // Stable callback refs
  const onProgressUpdateRef = useRef(onProgressUpdate);
  const onVideoEndedRef = useRef(onVideoEnded);
  onProgressUpdateRef.current = onProgressUpdate;
  onVideoEndedRef.current = onVideoEnded;

  // Ref for initialWatchedSeconds so we can read it without re-running effects
  const initialWatchedSecondsRef = useRef(initialWatchedSeconds);
  initialWatchedSecondsRef.current = initialWatchedSeconds;

  // Reset state when video changes (url/videoId only, NOT initialPosition)
  useEffect(() => {
    watchedSecondsRef.current = initialWatchedSecondsRef.current;
    maxReachedRef.current = maxAllowedPosition;
    durationRef.current = 0;
    lastTickRef.current = 0;
    lastReportRef.current = 0;
    isPlayingRef.current = false;
    currentPositionRef.current = initialPosition;
    completedRef.current = false;
    resumeAppliedRef.current = false;
    setHasCompleted(false);
  }, [url, videoId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update maxReached when maxAllowedPosition changes (enrollment loads)
  useEffect(() => {
    if (maxAllowedPosition > maxReachedRef.current) {
      maxReachedRef.current = maxAllowedPosition;
    }
  }, [maxAllowedPosition]);

  const reportProgress = useCallback(() => {
    onProgressUpdateRef.current?.({
      watchedSeconds: watchedSecondsRef.current,
      maxReachedSeconds: maxReachedRef.current,
      duration: durationRef.current,
      currentPosition: currentPositionRef.current,
    });
    lastReportRef.current = Date.now();
  }, []);

  const checkCompletion = useCallback(() => {
    if (completedRef.current || durationRef.current <= 0) return;
    const ratio = maxReachedRef.current / durationRef.current;
    if (ratio >= 0.95) {
      completedRef.current = true;
      setHasCompleted(true);
      reportProgress();
      onVideoEndedRef.current?.();
    }
  }, [reportProgress]);

  // ─── HTML5 <video> ───
  useEffect(() => {
    if (provider !== 'direct' || !url) return;
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      durationRef.current = video.duration;
      if (initialPosition > 0) {
        video.currentTime = Math.min(initialPosition, maxReachedRef.current || initialPosition);
      }
    };

    const handlePlay = () => {
      isPlayingRef.current = true;
      lastTickRef.current = Date.now();
    };

    const handlePause = () => {
      isPlayingRef.current = false;
      reportProgress();
    };

    const handleSeeking = () => {
      // Skip prevention: snap back if seeking past maxReached
      if (video.currentTime > maxReachedRef.current + SEEK_TOLERANCE) {
        video.currentTime = maxReachedRef.current;
      }
    };

    const handleTimeUpdate = () => {
      const now = Date.now();
      currentPositionRef.current = video.currentTime;

      // Advance maxReached only through natural playback
      if (video.currentTime <= maxReachedRef.current + SEEK_TOLERANCE) {
        maxReachedRef.current = Math.max(maxReachedRef.current, video.currentTime);
      }

      // Accumulate watched time only during real playback
      if (isPlayingRef.current && lastTickRef.current > 0) {
        const delta = (now - lastTickRef.current) / 1000;
        if (delta > 0 && delta < MAX_DELTA_S) {
          watchedSecondsRef.current += delta;
        }
      }
      lastTickRef.current = now;

      // Periodic reporting
      if (now - lastReportRef.current >= SAVE_INTERVAL_MS) {
        reportProgress();
      }

      checkCompletion();
    };

    const handleEnded = () => {
      isPlayingRef.current = false;
      reportProgress();
      if (!completedRef.current) {
        onVideoEndedRef.current?.();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeking', handleSeeking);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeking', handleSeeking);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [provider, url, initialPosition, reportProgress, checkCompletion]);

  // ─── YouTube IFrame API ───
  // YouTube replaces our <div> with an <iframe>. When the effect re-runs,
  // player.destroy() removes the iframe — but React doesn't know the div is
  // gone. We use a wrapper ref and manually recreate the inner div on cleanup.
  //
  // IMPORTANT: initialPosition is read from a ref, NOT from deps. This prevents
  // the player from being destroyed and recreated when enrollment data loads.
  useEffect(() => {
    if (provider !== 'youtube' || !url) return;

    const videoIdMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    )?.[1];
    if (!videoIdMatch) return;

    // Load API script if needed
    if (!document.getElementById('youtube-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    // Generate a fresh container ID for this player instance
    const containerId = `yt-player-${videoId}-${Date.now()}`;
    containerIdRef.current = containerId;

    // Ensure the wrapper has a div with the right ID
    const wrapper = ytWrapperRef.current;
    if (wrapper) {
      wrapper.innerHTML = '';
      const div = document.createElement('div');
      div.id = containerId;
      div.style.width = '100%';
      div.style.height = '100%';
      wrapper.appendChild(div);
    }

    let player: unknown = null;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    let destroyed = false;

    // Time-based estimation: tracks position without relying on API
    let estimatedPosition = initialPositionRef.current;

    const safeCall = <T,>(fn: () => T): T | null => {
      try { return fn(); } catch { return null; }
    };

    const initPlayer = () => {
      if (destroyed) return;
      const yt = (window as unknown as { YT?: { Player: new (id: string, config: object) => unknown } }).YT;
      if (!yt) return;

      // Check the container div still exists
      if (!document.getElementById(containerId)) return;

      const startSec = Math.floor(initialPositionRef.current);

      player = new yt.Player(containerId, {
        videoId: videoIdMatch,
        playerVars: {
          enablejsapi: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
          start: startSec > 0 ? startSec : undefined,
        },
        events: {
          onReady: (event: { target: unknown }) => {
            if (destroyed) return;
            // Try to read duration
            const dur = safeCall(() => (event.target as { getDuration?: () => number }).getDuration?.());
            if (dur && dur > 0) durationRef.current = dur;

            // Mark resume as applied (start param handled it)
            if (startSec > 0) {
              resumeAppliedRef.current = true;
              estimatedPosition = startSec;
            }
          },
          onStateChange: (event: { data: number }) => {
            if (destroyed) return;

            // Try to sync estimated position from API
            const ct = safeCall(() => (player as { getCurrentTime?: () => number }).getCurrentTime?.());
            if (ct && ct > 0) estimatedPosition = ct;

            // 1 = playing
            if (event.data === 1) {
              isPlayingRef.current = true;
              lastTickRef.current = Date.now();
            }
            // 2 = paused
            if (event.data === 2) {
              isPlayingRef.current = false;
              reportProgress();
            }
            // 0 = ended
            if (event.data === 0) {
              isPlayingRef.current = false;
              reportProgress();
              if (!completedRef.current) {
                onVideoEndedRef.current?.();
              }
            }
          },
        },
      });

      ytPlayerRef.current = player;

      // Progress tracking via polling — time-based with optional API sync
      progressInterval = setInterval(() => {
        if (destroyed || !isPlayingRef.current) return;

        const now = Date.now();
        const delta = (now - lastTickRef.current) / 1000;

        // Try to read duration if we don't have it yet
        if (durationRef.current <= 0) {
          const dur = safeCall(() => (player as { getDuration?: () => number }).getDuration?.());
          if (dur && dur > 0) durationRef.current = dur;
        }

        // Try to read current time from API for accuracy
        const apiTime = safeCall(() => (player as { getCurrentTime?: () => number }).getCurrentTime?.());
        if (apiTime && apiTime > 0) {
          estimatedPosition = apiTime;
        } else if (delta > 0 && delta < MAX_DELTA_S) {
          // Fallback: advance estimated position by elapsed wall-clock time
          estimatedPosition += delta;
        }

        currentPositionRef.current = estimatedPosition;

        // Advance maxReached (no seekTo skip prevention for YouTube)
        if (estimatedPosition > 0) {
          maxReachedRef.current = Math.max(maxReachedRef.current, estimatedPosition);
        }

        // Accumulate real watch time
        if (delta > 0 && delta < MAX_DELTA_S) {
          watchedSecondsRef.current += delta;
        }

        lastTickRef.current = now;

        // Periodic reporting
        if (now - lastReportRef.current >= SAVE_INTERVAL_MS) {
          reportProgress();
        }

        checkCompletion();
      }, TICK_INTERVAL_MS);
    };

    // Wait for YouTube API to load
    const yt = (window as unknown as { YT?: { Player: unknown } }).YT;
    if (yt?.Player) {
      initPlayer();
    } else {
      const checkInterval = setInterval(() => {
        const ytCheck = (window as unknown as { YT?: { Player: unknown } }).YT;
        if (ytCheck?.Player) {
          clearInterval(checkInterval);
          initPlayer();
        }
      }, 100);

      return () => {
        destroyed = true;
        clearInterval(checkInterval);
        if (progressInterval) clearInterval(progressInterval);
      };
    }

    return () => {
      destroyed = true;
      if (progressInterval) clearInterval(progressInterval);
      const p = player as { destroy?: () => void };
      try { p?.destroy?.(); } catch { /* ignore */ }
      ytPlayerRef.current = null;

      // Recreate the container div inside the wrapper so it's ready for the
      // next player instance (YouTube's destroy removes the iframe/div).
      if (wrapper) {
        wrapper.innerHTML = '';
        const div = document.createElement('div');
        div.id = containerId;
        div.style.width = '100%';
        div.style.height = '100%';
        wrapper.appendChild(div);
      }
    };
    // NOTE: initialPosition is intentionally excluded — read from ref to avoid
    // destroying/recreating the player when enrollment data loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, url, videoId, reportProgress, checkCompletion]);

  // ─── YouTube late resume ───
  // When enrollment loads after the player is already created, try to seek once.
  useEffect(() => {
    if (provider !== 'youtube') return;
    if (initialPosition <= 0 || resumeAppliedRef.current) return;

    const p = ytPlayerRef.current as {
      seekTo?: (s: number, b: boolean) => void;
      getPlayerState?: () => number;
    } | null;
    if (!p?.seekTo) return;

    resumeAppliedRef.current = true;
    try {
      p.seekTo(Math.floor(initialPosition), true);
    } catch {
      // Cross-origin — ignore, video continues from wherever it is
    }
  }, [provider, initialPosition]);

  // No URL — empty state
  if (!url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-ink/90">
        <div className="text-center text-cream">
          <div className="w-20 h-20 rounded-full bg-cream/10 flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-cream ml-1" />
          </div>
          <p className="text-cream-dark/60">Este módulo no tiene video</p>
        </div>
      </div>
    );
  }

  // Prezi embed — no progress tracking, just an iframe
  if (provider === 'prezi') {
    const embedUrl = getPreziEmbedUrl(url);
    return (
      <div className="w-full h-full bg-ink">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; fullscreen"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-cream-dark/60">URL de Prezi no válida</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-ink relative">
      {provider === 'youtube' && (
        <div ref={ytWrapperRef} className="w-full h-full" />
      )}

      {provider === 'direct' && (
        <video
          ref={videoRef}
          src={url}
          className="w-full h-full object-contain"
          controls
          controlsList="noplaybackrate"
        />
      )}

      {hasCompleted && (
        <div className="absolute top-4 right-4 bg-success text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 z-10 shadow-lg">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Completado
        </div>
      )}
    </div>
  );
}
