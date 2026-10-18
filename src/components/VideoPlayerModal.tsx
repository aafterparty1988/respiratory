import React, { useEffect } from 'react';
import { X, ExternalLink, Calendar, Eye, Clock, Bookmark, Star } from 'lucide-react';
import { YouTubeVideo } from '../types/youtube';
import { formatDateRu, getRelativeTimeRu } from '../services/youtubeApi';

interface VideoPlayerModalProps {
  video: YouTubeVideo | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (video: YouTubeVideo) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  isBookmarked,
  onToggleBookmark,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!video) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate">
              {video.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{video.channelTitle}</span>
              <span>·</span>
              <span className="text-red-400 font-mono">
                {formatDateRu(video.publishedAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleBookmark(video)}
              className={`p-2 rounded-lg border transition-colors ${
                isBookmarked
                  ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title={isBookmarked ? 'Удалить из закладок' : 'В закладки'}
            >
              <Star
                className={`w-4 h-4 ${
                  isBookmarked ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Открыть на YouTube"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Закрыть (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe Player */}
        <div className="relative aspect-video bg-black w-full shrink-0">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Video metadata and description */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Calendar className="w-4 h-4 text-red-500" />
                Опубликовано: <strong className="text-white font-mono">{formatDateRu(video.publishedAt)}</strong>
              </span>
              <span className="text-slate-500">({getRelativeTimeRu(video.publishedAt)})</span>
            </div>

            {video.views && (
              <span className="flex items-center gap-1.5 text-slate-300">
                <Eye className="w-4 h-4 text-slate-400" />
                {video.views} просмотров
              </span>
            )}
          </div>

          {video.description && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Описание видео
              </h4>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                {video.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
