import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { getVideoProvider } from '@/utils/video';
import { getYouTubeEmbedUrl } from '@/utils/video';
import type { ModuleVideo } from '@/types';
import { formatDuration } from '@/utils/video';

interface ModuleVideoPreviewProps {
  video: ModuleVideo;
}

export default function ModuleVideoPreview({ video }: ModuleVideoPreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const provider = getVideoProvider(video.url);

  const toggle = () => setExpanded(e => !e);

  const displayTitle = video.title || video.url.split('/').pop()?.replace(/[^a-zA-Z0-9._-]/g, ' ').slice(0, 30) || 'Video';
  const duration = video.duration ? formatDuration(video.duration) : null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-2 text-xs bg-chocolate-50 text-chocolate px-2.5 py-1.5 rounded-full hover:bg-chocolate-100 transition-colors cursor-pointer w-full justify-start"
      >
        <Play className="w-3 h-3 shrink-0" />
        <span className="flex-1 text-left truncate">{displayTitle}</span>
        {duration && <span className="text-chocolate-light shrink-0">{duration}</span>}
      </button>
    );
  }

  return (
    <div className="relative bg-ink rounded-lg overflow-hidden">
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5 bg-gradient-to-b from-ink/80 to-transparent">
        <span className="text-xs text-cream truncate flex-1">{displayTitle}</span>
        <button
          onClick={toggle}
          className="ml-2 p-1 rounded text-cream/70 hover:text-cream transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Video content */}
      <div className="aspect-video bg-ink">
        {provider === 'youtube' ? (
          <iframe
            src={`${getYouTubeEmbedUrl(video.url)}&autoplay=1`}
            className="w-full h-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        ) : (
          // direct (R2) or other — use HTML5 video
          <video
            key={video.url}
            src={video.url}
            className="w-full h-full object-contain"
            controls
            autoPlay
            controlsList="noplaybackrate"
          />
        )}
      </div>
    </div>
  );
}
