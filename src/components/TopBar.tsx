import React from 'react';
import { Youtube, Key, Download, Bookmark, Clock } from 'lucide-react';

interface TopBarProps {
  onOpenApiKeyModal: () => void;
  onOpenExportModal: () => void;
  onOpenFavoritesModal: () => void;
  favoritesCount: number;
  activeSection: string;
  setActiveSection: (section: string) => void;
  hasApiKey: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenApiKeyModal,
  onOpenExportModal,
  onOpenFavoritesModal,
  favoritesCount,
  activeSection,
  setActiveSection,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow-sm shadow-red-900/30">
            <Youtube className="w-5 h-5 fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white font-['Plus_Jakarta_Sans']">
              YouTube TimeVault
            </span>
            <span className="text-[11px] text-slate-400 font-mono -mt-0.5">
              Хронологический навигатор
            </span>
          </div>
        </div>

        {/* Zone 2: Clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveSection('browser')}
            className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeSection === 'browser'
                ? 'text-white border-red-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            Навигатор видео
          </button>
          <button
            onClick={() => setActiveSection('timeline')}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeSection === 'timeline'
                ? 'text-white border-red-500'
                : 'text-slate-400 border-transparent hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Временная шкала
          </button>
          <button
            onClick={onOpenFavoritesModal}
            className="flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 py-1 text-slate-400 hover:text-slate-200"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Избранное ({favoritesCount})
          </button>
        </nav>

        {/* Zone 3: Primary action button & Settings */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenApiKeyModal}
            title={hasApiKey ? 'YouTube API v3 подключен' : 'Настроить YouTube API v3 (опционально)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
              hasApiKey
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/40'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasApiKey ? 'API активен' : 'API ключ'}</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-500 active:bg-red-700 shadow-sm shadow-red-950 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Экспорт</span>
          </button>
        </div>
      </div>
    </header>
  );
};
