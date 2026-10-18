import React, { useState } from 'react';
import { Search, ExternalLink, Star, Sparkles, Loader2, Check } from 'lucide-react';
import { YouTubeChannel } from '../types/youtube';

interface ChannelSelectorProps {
  currentChannel: YouTubeChannel | null;
  onSelectChannel: (query: string) => Promise<void>;
  popularChannels: YouTubeChannel[];
  savedChannels: YouTubeChannel[];
  onToggleSaveChannel: (channel: YouTubeChannel) => void;
  isLoading: boolean;
}

export const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  currentChannel,
  onSelectChannel,
  popularChannels,
  savedChannels,
  onToggleSaveChannel,
  isLoading,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isCurrentSaved = currentChannel
    ? savedChannels.some((c) => c.id === currentChannel.id)
    : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    setErrorMsg('');
    setIsSearching(true);
    try {
      await onSelectChannel(query);
      setInputValue('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Канал не найден. Попробуйте указать ссылку или @handle.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 text-slate-100 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>1. Выбор YouTube-аккаунта</span>
            <span className="text-xs font-normal text-slate-400">
              (любой @handle, ссылка на канал или ID)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Введите аккаунт, видео которого хотите просмотреть за интересующий период
          </p>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full lg:w-96">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder="@veritasium, @mkbhd, ссылка..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isSearching || isLoading}
            className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Поиск...</span>
              </>
            ) : (
              <span>Найти</span>
            )}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="mb-4 p-2.5 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-200">
          {errorMsg}
        </div>
      )}

      {/* Popular quick picks */}
      <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-800/80 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Популярные каналы:
        </span>
        {popularChannels.map((ch) => {
          const isSelected = currentChannel?.id === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-red-950 border border-red-700 text-red-200 shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <img
                src={ch.avatar}
                alt={ch.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                className="w-4 h-4 rounded-full object-cover"
              />
              <span className="truncate max-w-[120px]">{ch.title}</span>
              {isSelected && <Check className="w-3 h-3 text-red-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Active channel profile badge */}
      {currentChannel && (
        <div className="mt-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={currentChannel.avatar}
              alt={currentChannel.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  currentChannel.title
                )}&background=ef4444&color=fff`;
              }}
              className="w-12 h-12 rounded-full border border-slate-700 object-cover shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-base">
                  {currentChannel.title}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {currentChannel.handle}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                {currentChannel.subscriberCount && (
                  <>
                    <span>{currentChannel.subscriberCount} подписчиков</span>
                    <span>·</span>
                  </>
                )}
                <span>ID: {currentChannel.id.slice(0, 12)}...</span>
                <span>·</span>
                <a
                  href={`https://www.youtube.com/${currentChannel.handle || `channel/${currentChannel.id}`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors"
                >
                  <span>На YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => onToggleSaveChannel(currentChannel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                isCurrentSaved
                  ? 'bg-amber-950/50 border-amber-700/80 text-amber-300 hover:bg-amber-900/50'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  isCurrentSaved ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                }`}
              />
              <span>{isCurrentSaved ? 'В избранном' : 'Сохранить канал'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
