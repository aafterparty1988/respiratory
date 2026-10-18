import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileCode, Copy, Check } from 'lucide-react';
import { YouTubeVideo, TimeRange } from '../types/youtube';
import { exportVideosToCsv, exportVideosToJson, formatDateRu } from '../services/youtubeApi';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: YouTubeVideo[];
  channelTitle: string;
  timeRange: TimeRange;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videos,
  channelTitle,
  timeRange,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    const lines = videos.map(
      (v, idx) =>
        `${idx + 1}. [${v.title}](${v.url}) — *${formatDateRu(v.publishedAt)}*`
    );
    const text = `# Видео канала ${channelTitle}\nПериод: ${timeRange.startDate || 'начало'} - ${timeRange.endDate || 'настоящее'}\nВсего: ${videos.length}\n\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center border border-red-800/40">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Экспорт выборки видео</h3>
              <p className="text-xs text-slate-400">
                {videos.length} видео за выбранный диапазон дат
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

        <div className="mt-5 space-y-4">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400">Канал:</span>
              <span className="text-white font-medium">{channelTitle}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-slate-400">Диапазон времени:</span>
              <span className="font-mono text-white">
                {timeRange.startDate || 'Все время'} {timeRange.endDate ? `— ${timeRange.endDate}` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Количество видео:</span>
              <span className="font-mono font-bold text-red-400">{videos.length}</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => {
                exportVideosToCsv(videos, channelTitle);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Скачать Excel / CSV</h4>
                  <p className="text-xs text-slate-400">Таблица с названиями, ссылками, датами и просмотрами</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                exportVideosToJson(videos, channelTitle);
                onClose();
              }}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-400 flex items-center justify-center">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Скачать JSON</h4>
                  <p className="text-xs text-slate-400">Полный структурированный массив объектов</p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-xl transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-950/60 border border-purple-800 text-purple-400 flex items-center justify-center">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Копировать список (Markdown)</h4>
                  <p className="text-xs text-slate-400">Для вставки в Notion, Telegram, заметки или отчеты</p>
                </div>
              </div>
              {copiedMd ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
