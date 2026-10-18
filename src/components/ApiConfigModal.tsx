import React, { useState } from 'react';
import { X, Key, ShieldCheck, HelpCircle, ExternalLink, Check } from 'lucide-react';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [val, setVal] = useState(apiKey);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(val.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setVal('');
    onSaveApiKey('');
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
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
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">YouTube Data API v3</h3>
              <p className="text-xs text-slate-400">Опциональный персональный ключ API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 font-medium text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Приложение готово к работе сразу!</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              По умолчанию приложение использует публичные RSS-ленты YouTube и встроенный архив каналов с полной историей.
              Если вам требуется выполнять глубокий исторический поиск по любым произвольным каналам без ограничений, вы можете указать свой ключ Google Cloud YouTube API v3.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              API Ключ (хранится только в вашем браузере):
            </label>
            <input
              type="password"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 text-xs font-mono bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <span>Как получить ключ бесплатно</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <div className="flex items-center gap-2">
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-red-400 transition-colors"
                >
                  Удалить ключ
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Сохранено!</span>
                  </>
                ) : (
                  <span>Сохранить настройки</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
