import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List as ListIcon,
  CalendarDays,
  ArrowUpDown,
  Search,
  FilterX,
  Play,
  Clock,
  Sparkles,
} from 'lucide-react';
import { YouTubeVideo, ViewMode, SortOrder } from '../types/youtube';
import { VideoCard } from './VideoCard';
import { formatDateOnlyRu } from '../services/youtubeApi';

interface VideoListProps {
  videos: YouTubeVideo[];
  isLoading: boolean;
  onPlayVideo: (video: YouTubeVideo) => void;
  bookmarks: string[];
  onToggleBookmark: (video: YouTubeVideo) => void;
  onResetTimeRange: () => void;
  channelTitle?: string;
}

export const VideoList: React.FC<VideoListProps> = ({
  videos,
  isLoading,
  onPlayVideo,
  bookmarks,
  onToggleBookmark,
  onResetTimeRange,
  channelTitle,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [searchFilter, setSearchFilter] = useState('');

  // Client-side text filter & sort
  const processedVideos = useMemo(() => {
    let result = [...videos];

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      result = result.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.description && v.description.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
      }
      if (sortOrder === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortOrder === 'views') {
        const parseViews = (views?: string | number) => {
          if (!views) return 0;
          if (typeof views === 'number') return views;
          const clean = views.replace(/\s+/g, '').replace(/,/g, '.');
          if (clean.includes('M')) return parseFloat(clean) * 1_000_000;
          if (clean.includes('K')) return parseFloat(clean) * 1_000;
          return parseFloat(clean) || 0;
        };
        return parseViews(b.views) - parseViews(a.views);
      }
      return 0;
    });

    return result;
  }, [videos, searchFilter, sortOrder]);

  // Grouping for timeline view
  const groupedByDate = useMemo(() => {
    const groups: { [key: string]: YouTubeVideo[] } = {};
    for (const v of processedVideos) {
      const dateKey = v.publishedAt ? v.publishedAt.slice(0, 10) : 'Неизвестно';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(v);
    }
    return groups;
  }, [processedVideos]);

  return (
    <div className="space-y-4">
      {/* Control Bar: View Switcher, Sort, In-result Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-slate-400">Вид отображения:</span>
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Сетка</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Список</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Хронология</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap flex-1 md:justify-end">
          {/* Quick search input within results */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Фильтр по названию..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="newest">Сначала новые по дате</option>
              <option value="oldest">Сначала старые по дате</option>
              <option value="views">По просмотрам</option>
              <option value="title">По названию (А-Я)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden animate-pulse"
            >
              <div className="aspect-video bg-slate-800" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-slate-800 rounded w-1/3" />
                <div className="h-4 bg-slate-800 rounded w-full" />
                <div className="h-4 bg-slate-800 rounded w-4/5" />
                <div className="pt-2 flex justify-between">
                  <div className="h-7 bg-slate-800 rounded w-24" />
                  <div className="h-7 bg-slate-800 rounded w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && processedVideos.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center mx-auto mb-3">
            <FilterX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            Нет видео в выбранном диапазоне времени
          </h3>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            В аккаунте {channelTitle ? `«${channelTitle}»` : ''} не найдено публикаций за
            указанный временной промежуток{searchFilter ? ` с фильтром "${searchFilter}"` : ''}.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={onResetTimeRange}
              className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              Показать все видео канала
            </button>
            {searchFilter && (
              <button
                onClick={() => setSearchFilter('')}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
              >
                Очистить поиск по названию
              </button>
            )}
          </div>
        </div>
      )}

      {/* Render Videos according to View Mode */}
      {!isLoading && processedVideos.length > 0 && (
        <>
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {processedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={onPlayVideo}
                  isBookmarked={bookmarks.includes(video.id)}
                  onToggleBookmark={onToggleBookmark}
                  viewMode="grid"
                />
              ))}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-3">
              {processedVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={onPlayVideo}
                  isBookmarked={bookmarks.includes(video.id)}
                  onToggleBookmark={onToggleBookmark}
                  viewMode="list"
                />
              ))}
            </div>
          )}

          {viewMode === 'timeline' && (
            <div className="space-y-8 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-800 ml-2">
              {Object.entries(groupedByDate).map(([dateStr, vids]) => (
                <div key={dateStr} className="relative pl-10 space-y-3">
                  {/* Timeline point */}
                  <div className="absolute left-3.5 top-1 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border-4 border-slate-900 shadow" />
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white font-mono">
                      {formatDateOnlyRu(dateStr)}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({vids.length} {vids.length === 1 ? 'видео' : 'видео'})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vids.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onPlay={onPlayVideo}
                        isBookmarked={bookmarks.includes(video.id)}
                        onToggleBookmark={onToggleBookmark}
                        viewMode="grid"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
