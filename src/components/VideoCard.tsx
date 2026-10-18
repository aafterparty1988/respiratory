import React, { useState } from 'react';
import { Play, ExternalLink, Copy, Check, Star, Clock, Eye } from 'lucide-react';
import { YouTubeVideo } from '../types/youtube';
import { formatDateRu, getRelativeTimeRu } from '../services/youtubeApi';

interface VideoCardProps {
  video: YouTubeVideo;
  onPlay: (video: YouTubeVideo) => void;
  isBookmarked: boolean;
  onToggleBookmark: (video: YouTubeVideo) => void;
  viewMode?: 'grid' | 'list';
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onPlay,
  isBookmarked,
  onToggleBookmark,
  viewMode = 'grid',
}) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(video.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe fallback thumbnail URLs if high quality isn't available
  const thumbnailSrc = imgError
    ? `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`
    : video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  if (viewMode === 'list') {
    return (
      <div className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all flex flex-col sm:flex-row gap-4">
        {/* Thumbnail on left */}
        <div
          onClick={() => onPlay(video)}
          className="relative w-full sm:w-64 aspect-video bg-slate-950 rounded-lg overflow-hidden shrink-0 cursor-pointer shadow-sm"
        >
          <img
            src={thumbnailSrc}
            alt={video.title}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          </div>
          {video.duration && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-[11px] font-mono text-white rounded">
              {video.duration}
            </span>
          )}
        </div>

        {/* Content on right */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3
                onClick={() => onPlay(video)}
                className="text-base font-semibold text-white group-hover:text-red-400 transition-colors cursor-pointer line-clamp-2"
              >
                {video.title}
              </h3>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(video);
                  }}
                  title={isBookmarked ? 'Удалить из закладок' : 'В закладки'}
                  className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition-colors"
                >
                  <Star
                    className={`w-4 h-4 ${
                      isBookmarked ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                </button>
                <button
                  onClick={handleCopyLink}
                  title="Копировать ссылку на видео"
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Publication Date & Info */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1 text-red-400 font-mono font-medium">
                <Clock className="w-3.5 h-3.5" />
                {formatDateRu(video.publishedAt)}
              </span>
              <span>·</span>
              <span>{getRelativeTimeRu(video.publishedAt)}</span>
              {video.views && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    {video.views} просмотров
                  </span>
                </>
              )}
            </div>

            {video.description && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {video.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800/80">
            <button
              onClick={() => onPlay(video)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Смотреть</span>
            </button>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <span>YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl overflow-hidden flex flex-col transition-all shadow-sm">
      {/* Thumbnail */}
      <div
        onClick={() => onPlay(video)}
        className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer"
      >
        <img
          src={thumbnailSrc}
          alt={video.title}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="w-11 h-11 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
        {video.duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-[11px] font-mono text-white rounded">
            {video.duration}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Exact Date & Time badge */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-red-400 font-mono text-[11px] font-medium">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              {formatDateRu(video.publishedAt)}
            </span>
            <span className="text-[11px] text-slate-500">
              {getRelativeTimeRu(video.publishedAt)}
            </span>
          </div>

          <h3
            onClick={() => onPlay(video)}
            className="text-sm font-semibold text-white group-hover:text-red-400 transition-colors cursor-pointer line-clamp-2 leading-snug"
          >
            {video.title}
          </h3>

          {video.views && (
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-2">
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>{video.views} просмотров</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-800/80">
          <button
            onClick={() => onPlay(video)}
            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Смотреть</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(video);
              }}
              title={isBookmarked ? 'Удалить из закладок' : 'В закладки'}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-md transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  isBookmarked ? 'fill-amber-400 text-amber-400' : ''
                }`}
              />
            </button>
            <button
              onClick={handleCopyLink}
              title="Копировать ссылку"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              title="Открыть на YouTube"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
