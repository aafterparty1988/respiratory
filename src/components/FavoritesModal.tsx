import React, { useState } from 'react';
import { X, Star, Bookmark, Play, Trash2, ExternalLink } from 'lucide-react';
import { YouTubeVideo, YouTubeChannel } from '../types/youtube';
import { formatDateRu } from '../services/youtubeApi';

interface FavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedChannels: YouTubeChannel[];
  bookmarkedVideos: YouTubeVideo[];
  onSelectChannel: (channelId: string) => void;
  onPlayVideo: (video: YouTubeVideo) => void;
  onRemoveBookmark: (videoId: string) => void;
  onRemoveSavedChannel: (channelId: string) => void;
}

export const FavoritesModal: React.FC<FavoritesModalProps> = ({
  isOpen,
  onClose,
  savedChannels,
  bookmarkedVideos,
  onSelectChannel,
  onPlayVideo,
  onRemoveBookmark,
  onRemoveSavedChannel,
}) => {
  const [tab, setTab] = useState<'videos' | 'channels'>('videos');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-600/30">
              <Star className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Избранное</h3>
              <p className="text-xs text-slate-400">
                Сохраненные каналы и отмеченные видео
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-5 pt-3 border-b border-slate-800 flex gap-4 text-xs font-medium">
          <button
            onClick={() => setTab('videos')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'videos'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Сохраненные видео ({bookmarkedVideos.length})</span>
          </button>
          <button
            onClick={() => setTab('channels')}
            className={`pb-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
              tab === 'channels'
                ? 'border-red-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Любимые каналы ({savedChannels.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {tab === 'videos' && (
            <>
              {bookmarkedVideos.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Вы пока не сохранили ни одного видео. Нажмите на значок звездочки на карточке любого видео!
                </div>
              ) : (
                bookmarkedVideos.map((video) => (
                  <div
                    key={video.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        referrerPolicy="no-referrer"
                        className="w-20 aspect-video rounded object-cover shrink-0 cursor-pointer"
                        onClick={() => {
                          onPlayVideo(video);
                          onClose();
                        }}
                      />
                      <div className="min-w-0">
                        <h4
                          onClick={() => {
                            onPlayVideo(video);
                            onClose();
                          }}
                          className="text-xs font-semibold text-white hover:text-red-400 transition-colors truncate cursor-pointer"
                        >
                          {video.title}
                        </h4>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                          <span>{video.channelTitle}</span>
                          <span>·</span>
                          <span className="text-red-400">{formatDateRu(video.publishedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onPlayVideo(video);
                          onClose();
                        }}
                        className="p-1.5 text-white bg-red-600 hover:bg-red-500 rounded-md transition-colors"
                        title="Смотреть"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => onRemoveBookmark(video.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Удалить из избранного"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'channels' && (
            <>
              {savedChannels.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Нет сохраненных каналов. Нажмите «Сохранить канал» в блоке выбора аккаунта.
                </div>
              ) : (
                savedChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      onClick={() => {
                        onSelectChannel(channel.id);
                        onClose();
                      }}
                    >
                      <img
                        src={channel.avatar}
                        alt={channel.title}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-700"
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-white truncate hover:text-red-400 transition-colors">
                          {channel.title}
                        </h4>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {channel.handle} {channel.subscriberCount ? `· ${channel.subscriberCount} подписчиков` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          onSelectChannel(channel.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors"
                      >
                        Открыть
                      </button>
                      <button
                        onClick={() => onRemoveSavedChannel(channel.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Удалить из списка"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
