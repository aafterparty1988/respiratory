import React from 'react';
import { BarChart3, ChevronRight } from 'lucide-react';
import { YouTubeVideo, TimeRange, TimelineBucket } from '../types/youtube';

interface TimelineScrubberProps {
  allVideos: YouTubeVideo[];
  timeRange: TimeRange;
  onSelectPeriod: (startDate: string, endDate: string, label: string) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  allVideos,
  timeRange,
  onSelectPeriod,
}) => {
  // Aggregate videos by year-month
  const bucketsMap = new Map<string, TimelineBucket>();

  for (const video of allVideos) {
    if (!video.publishedAt) continue;
    const d = new Date(video.publishedAt);
    if (isNaN(d.getTime())) continue;

    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const periodKey = `${year}-${String(month).padStart(2, '0')}`;

    const monthNames = [
      'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
      'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
    ];
    const label = `${monthNames[month - 1]} ${year}`;

    // Compute month start and end dates
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    if (!bucketsMap.has(periodKey)) {
      bucketsMap.set(periodKey, {
        periodKey,
        label,
        year,
        month,
        count: 0,
        startDate,
        endDate,
      });
    }

    bucketsMap.get(periodKey)!.count += 1;
  }

  // Sort chronologically ascending
  const buckets = Array.from(bucketsMap.values()).sort((a, b) =>
    a.periodKey.localeCompare(b.periodKey)
  );

  const maxCount = buckets.reduce((max, b) => Math.max(max, b.count), 1);

  if (buckets.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-semibold text-white">
            Хронологическая шкала активности публикаций
          </h3>
          <span className="text-xs text-slate-400">
            (нажмите на любой столбец для перехода к этому месяцу)
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          Период: {buckets[0]?.label} — {buckets[buckets.length - 1]?.label}
        </span>
      </div>

      {/* Visual Bar Chart */}
      <div className="relative pt-4 pb-2 overflow-x-auto">
        <div className="flex items-end gap-2 min-w-max h-28 px-1">
          {buckets.map((bucket) => {
            const heightPercent = Math.max(12, Math.round((bucket.count / maxCount) * 100));
            const isSelected =
              timeRange.startDate <= bucket.endDate &&
              timeRange.endDate >= bucket.startDate &&
              (timeRange.startDate || timeRange.endDate);

            return (
              <button
                key={bucket.periodKey}
                onClick={() =>
                  onSelectPeriod(bucket.startDate, bucket.endDate, bucket.label)
                }
                className="group flex flex-col items-center focus:outline-none"
                title={`${bucket.label}: ${bucket.count} видео (кликните для фильтрации)`}
              >
                {/* Count tooltip on hover */}
                <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1 tabular-nums">
                  {bucket.count}
                </span>

                {/* Vertical Bar */}
                <div className="w-8 sm:w-10 bg-slate-800 rounded-t flex items-end justify-center p-0.5 group-hover:bg-slate-700 transition-colors h-20">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t transition-all ${
                      isSelected
                        ? 'bg-red-500 shadow-sm shadow-red-900/50'
                        : 'bg-red-700/60 group-hover:bg-red-500'
                    }`}
                  />
                </div>

                {/* Period label */}
                <span
                  className={`text-[10px] font-mono mt-1.5 whitespace-nowrap transition-colors ${
                    isSelected ? 'text-white font-semibold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {bucket.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
