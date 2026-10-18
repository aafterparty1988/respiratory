import React from 'react';
import { Calendar, RotateCcw, Clock, ArrowRight } from 'lucide-react';
import { TimeRange } from '../types/youtube';

interface TimeRangeFilterProps {
  timeRange: TimeRange;
  onChangeTimeRange: (newRange: TimeRange) => void;
  onResetTimeRange: () => void;
  filteredCount: number;
  totalRawCount: number;
}

export const TimeRangeFilter: React.FC<TimeRangeFilterProps> = ({
  timeRange,
  onChangeTimeRange,
  onResetTimeRange,
  filteredCount,
  totalRawCount,
}) => {
  const currentYear = new Date().getFullYear();

  const handlePreset = (presetKey: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let start = '';
    let end = '';

    switch (presetKey) {
      case 'all':
        onResetTimeRange();
        return;
      case 'last30': {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        start = d.toISOString().split('T')[0];
        end = todayStr;
        break;
      }
      case 'last90': {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        start = d.toISOString().split('T')[0];
        end = todayStr;
        break;
      }
      case 'lastYear': {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        start = d.toISOString().split('T')[0];
        end = todayStr;
        break;
      }
      default:
        if (/^\d{4}$/.test(presetKey)) {
          start = `${presetKey}-01-01`;
          end = `${presetKey}-12-31`;
        }
        break;
    }

    if (start && end) {
      onChangeTimeRange({
        startDate: start,
        startTime: '00:00',
        endDate: end,
        endTime: '23:59',
        preset: presetKey,
      });
    }
  };

  const isRangeActive = !!(timeRange.startDate || timeRange.endDate);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 text-slate-100 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <span>2. Диапазон времени публикации</span>
            {isRangeActive && (
              <span className="text-xs font-mono font-normal text-red-400 bg-red-950/60 border border-red-900 px-2 py-0.5 rounded">
                Фильтр активен
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Укажите точные даты и время или выберите быстрый временной интервал
          </p>
        </div>

        {/* Status count */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            Найдено:{' '}
            <span className="font-semibold text-white font-mono tabular-nums">
              {filteredCount}
            </span>{' '}
            из <span className="font-mono tabular-nums text-slate-400">{totalRawCount}</span> видео
          </div>

          {isRangeActive && (
            <button
              onClick={onResetTimeRange}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Сбросить временной фильтр"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Сбросить</span>
            </button>
          )}
        </div>
      </div>

      {/* Exact Date & Time Picker Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-lg mb-4">
        {/* Start Date */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Дата публикации ОТ:
          </label>
          <input
            type="date"
            value={timeRange.startDate}
            onChange={(e) =>
              onChangeTimeRange({
                ...timeRange,
                startDate: e.target.value,
                preset: 'custom',
              })
            }
            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Start Time */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Время ОТ:
          </label>
          <input
            type="time"
            value={timeRange.startTime}
            onChange={(e) =>
              onChangeTimeRange({
                ...timeRange,
                startTime: e.target.value,
                preset: 'custom',
              })
            }
            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Дата публикации ДО:
          </label>
          <input
            type="date"
            value={timeRange.endDate}
            onChange={(e) =>
              onChangeTimeRange({
                ...timeRange,
                endDate: e.target.value,
                preset: 'custom',
              })
            }
            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* End Time */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Время ДО:
          </label>
          <input
            type="time"
            value={timeRange.endTime}
            onChange={(e) =>
              onChangeTimeRange({
                ...timeRange,
                endTime: e.target.value,
                preset: 'custom',
              })
            }
            className="w-full px-2.5 py-1.5 text-xs font-mono bg-slate-900 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Summary preview */}
        <div className="flex flex-col justify-end">
          <div className="text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800 leading-tight">
            {isRangeActive ? (
              <div className="flex items-center gap-1">
                <span className="text-white font-mono font-medium truncate">
                  {timeRange.startDate || 'начало'}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="text-white font-mono font-medium truncate">
                  {timeRange.endDate || 'настоящее'}
                </span>
              </div>
            ) : (
              <span className="text-slate-500 italic">Показаны все видео</span>
            )}
          </div>
        </div>
      </div>

      {timeRange.startDate && timeRange.endDate && timeRange.startDate > timeRange.endDate && (
        <div className="mb-3 p-2 bg-amber-950/60 border border-amber-800 rounded-lg text-xs text-amber-200">
          Внимание: дата начала ({timeRange.startDate}) позже даты окончания ({timeRange.endDate}). Пожалуйста, скорректируйте интервал.
        </div>
      )}

      {/* Quick Interval Preset Buttons */}
      <div className="flex items-center flex-wrap gap-1.5 pt-1 text-xs">
        <span className="text-slate-400 font-medium mr-1 shrink-0">Быстрые периоды:</span>

        <button
          onClick={() => handlePreset('all')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            !isRangeActive
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
          }`}
        >
          Все время
        </button>

        <button
          onClick={() => handlePreset('last30')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            timeRange.preset === 'last30'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
          }`}
        >
          30 дней
        </button>

        <button
          onClick={() => handlePreset('last90')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            timeRange.preset === 'last90'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
          }`}
        >
          90 дней
        </button>

        <button
          onClick={() => handlePreset('lastYear')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            timeRange.preset === 'lastYear'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
          }`}
        >
          1 год
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

        {['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014'].map((year) => {
          const isYearActive = timeRange.preset === year;
          return (
            <button
              key={year}
              onClick={() => handlePreset(year)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-medium transition-colors ${
                isYearActive
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-slate-700'
              }`}
            >
              {year}
            </button>
          );
        })}

        {/* Extended year select dropdown */}
        <select
          value={/^\d{4}$/.test(timeRange.preset || '') ? timeRange.preset : ''}
          onChange={(e) => {
            if (e.target.value) handlePreset(e.target.value);
          }}
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-red-500"
          aria-label="Выбрать другой год"
        >
          <option value="" disabled>
            Другой год...
          </option>
          {Array.from({ length: 21 }, (_, i) => String(2026 - i)).map((y) => (
            <option key={y} value={y}>
              {y} год
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
