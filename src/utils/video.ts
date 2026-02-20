export type VideoProvider = 'youtube' | 'vimeo' | 'prezi' | 'direct';

/**
 * Detects the video provider from a URL
 */
export function getVideoProvider(url: string): VideoProvider {
  if (!url) return 'direct';

  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  const vimeoRegex = /^(https?:\/\/)?(www\.)?vimeo\.com\/.+$/;
  const preziRegex = /^(https?:\/\/)?(www\.)?prezi\.com\/.+$/;

  if (youtubeRegex.test(url)) return 'youtube';
  if (vimeoRegex.test(url)) return 'vimeo';
  if (preziRegex.test(url)) return 'prezi';

  return 'direct';
}

/**
 * Gets the embed URL for a Prezi presentation
 * Accepts URLs like:
 *   https://prezi.com/p/PRESENTATION_ID/
 *   https://prezi.com/p/embed/PRESENTATION_ID/
 *   https://prezi.com/v/PRESENTATION_ID/
 */
export function getPreziEmbedUrl(url: string): string {
  if (!url) return '';
  // Already an embed URL
  if (url.includes('/p/embed/')) return url;
  // Extract ID from /p/ID/ or /v/ID/ patterns
  const match = url.match(/prezi\.com\/(?:p|v)\/([^/]+)/);
  if (match) return `https://prezi.com/p/embed/${match[1]}/`;
  return '';
}

/**
 * Extracts video ID from a YouTube or Vimeo URL
 */
export function getVideoId(url: string, provider: VideoProvider): string {
  if (!url) return '';

  if (provider === 'youtube') {
    // Handle various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
  }

  if (provider === 'vimeo') {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (match) return match[1];
  }

  return '';
}

/**
 * Gets the embed URL for YouTube
 */
export function getYouTubeEmbedUrl(url: string): string {
  const videoId = getVideoId(url, 'youtube');
  if (!videoId) return '';

  // Add enablejsapi=1 for progress tracking
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0`;
}

/**
 * Gets the embed URL for Vimeo
 */
export function getVimeoEmbedUrl(url: string): string {
  const videoId = getVideoId(url, 'vimeo');
  if (!videoId) return '';

  // Add api=1 for progress tracking
  return `https://player.vimeo.com/video/${videoId}?api=1&byline=0&portrait=0`;
}

/**
 * Parses duration strings like "45 min", "1h 30min", "1:30:00" to seconds
 */
export function parseDurationString(s?: string): number {
  if (!s) return 0;
  // Try "HH:MM:SS" or "MM:SS" format
  const colonMatch = s.match(/^(\d+):(\d+)(?::(\d+))?$/);
  if (colonMatch) {
    if (colonMatch[3]) {
      return parseInt(colonMatch[1]) * 3600 + parseInt(colonMatch[2]) * 60 + parseInt(colonMatch[3]);
    }
    return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);
  }
  // Try "Xh Ymin" format
  const hours = s.match(/(\d+)\s*h/)?.[1];
  const mins = s.match(/(\d+)\s*min/)?.[1];
  return (parseInt(hours || '0') * 3600) + (parseInt(mins || '0') * 60);
}

/**
 * Formats seconds to "MM:SS" display string
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
