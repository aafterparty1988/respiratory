/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { ChannelSelector } from './components/ChannelSelector';
import { TimeRangeFilter } from './components/TimeRangeFilter';
import { TimelineScrubber } from './components/TimelineScrubber';
import { VideoList } from './components/VideoList';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { ApiConfigModal } from './components/ApiConfigModal';
import { ExportModal } from './components/ExportModal';
import { FavoritesModal } from './components/FavoritesModal';
import {
  fetchPopularChannels,
  resolveChannel,
  fetchChannelVideos,
} from './services/youtubeApi';
import { YouTubeChannel, YouTubeVideo, TimeRange } from './types/youtube';
import { CURATED_CHANNELS } from './data/curatedChannels';

export default function App() {
  const [popularChannels, setPopularChannels] = useState<YouTubeChannel[]>([]);
  const [currentChannel, setCurrentChannel] = useState<YouTubeChannel | null>(null);

  // Time range state
  const [timeRange, setTimeRange] = useState<TimeRange>({
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '23:59',
    preset: 'all',
  });

  // Videos state
  const [allVideos, setAllVideos] = useState<YouTubeVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<YouTubeVideo[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState<boolean>(false);

  // Modals state
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('browser');

  // Local storage state
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('yt_vault_api_key') || '';
    } catch {
      return '';
    }
  });

  const [savedChannels, setSavedChannels] = useState<YouTubeChannel[]>(() => {
    try {
      const data = localStorage.getItem('yt_vault_saved_channels');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedVideos, setBookmarkedVideos] = useState<YouTubeVideo[]>(() => {
    try {
      const data = localStorage.getItem('yt_vault_bookmarked_videos');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('yt_vault_saved_channels', JSON.stringify(savedChannels));
    } catch (e) {
      console.warn('Failed to save channels to localStorage', e);
    }
  }, [savedChannels]);

  useEffect(() => {
    try {
      localStorage.setItem('yt_vault_bookmarked_videos', JSON.stringify(bookmarkedVideos));
    } catch (e) {
      console.warn('Failed to save bookmarks to localStorage', e);
    }
  }, [bookmarkedVideos]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    try {
      localStorage.setItem('yt_vault_api_key', key);
    } catch (e) {
      console.warn('Failed to save api key to localStorage', e);
    }
  };

  // Load popular channels on start
  useEffect(() => {
    const init = async () => {
      const channels = await fetchPopularChannels();
      const initialList = channels.length > 0 ? channels : CURATED_CHANNELS.map((c) => c.channel);
      setPopularChannels(initialList);
      if (initialList.length > 0 && !currentChannel) {
        setCurrentChannel(initialList[0]);
      }
    };
    init();
  }, []);

  // Fetch videos whenever channel, apiKey, or timeRange changes
  const loadVideosForChannel = useCallback(
    async (channel: YouTubeChannel, targetRange?: TimeRange) => {
      setIsLoadingVideos(true);
      try {
        const range = targetRange !== undefined ? targetRange : timeRange;
        const publishedAfter = range.startDate
          ? `${range.startDate}T${range.startTime || '00:00'}:00Z`
          : undefined;
        const publishedBefore = range.endDate
          ? `${range.endDate}T${range.endTime || '23:59'}:59Z`
          : undefined;

        const { videos } = await fetchChannelVideos({
          channelId: channel.id,
          channelTitle: channel.title,
          channelHandle: channel.handle,
          publishedAfter,
          publishedBefore,
          apiKey,
        });

        let vids = videos;
        if (vids.length === 0) {
          const curated = CURATED_CHANNELS.find(
            (c) =>
              c.channel.id === channel.id ||
              (channel.handle && c.channel.handle.toLowerCase() === channel.handle.toLowerCase()) ||
              (channel.title && c.channel.title.toLowerCase() === channel.title.toLowerCase())
          );
          if (curated) {
            vids = curated.videos;
          }
        }

        setAllVideos(vids);
      } catch (err) {
        console.warn('Load videos failed:', err);
        const curated = CURATED_CHANNELS.find(
          (c) =>
            c.channel.id === channel.id ||
            (channel.handle && c.channel.handle.toLowerCase() === channel.handle.toLowerCase()) ||
            (channel.title && c.channel.title.toLowerCase() === channel.title.toLowerCase())
        );
        if (curated) {
          setAllVideos(curated.videos);
        } else {
          setAllVideos([]);
        }
      } finally {
        setIsLoadingVideos(false);
      }
    },
    [apiKey, timeRange]
  );

  useEffect(() => {
    if (currentChannel) {
      loadVideosForChannel(currentChannel);
    }
  }, [currentChannel]);

  // Client-side date filtering based on timeRange
  useEffect(() => {
    if (!allVideos) {
      setFilteredVideos([]);
      return;
    }

    let result = [...allVideos];

    if (timeRange.startDate) {
      const startDateTimeStr = `${timeRange.startDate}T${timeRange.startTime || '00:00'}:00`;
      const startTimeMs = new Date(startDateTimeStr).getTime();
      if (!isNaN(startTimeMs)) {
        result = result.filter((v) => {
          const vTime = new Date(v.publishedAt).getTime();
          return isNaN(vTime) || vTime >= startTimeMs;
        });
      }
    }

    if (timeRange.endDate) {
      const endDateTimeStr = `${timeRange.endDate}T${timeRange.endTime || '23:59'}:59`;
      const endTimeMs = new Date(endDateTimeStr).getTime();
      if (!isNaN(endTimeMs)) {
        result = result.filter((v) => {
          const vTime = new Date(v.publishedAt).getTime();
          return isNaN(vTime) || vTime <= endTimeMs;
        });
      }
    }

    setFilteredVideos(result);
  }, [allVideos, timeRange]);

  // Handle selecting a channel (by query, handle, ID, or clicking preset)
  const handleSelectChannel = async (query: string) => {
    const cleaned = query.toLowerCase().replace(/^https?:\/\/(www\.)?youtube\.com\//, '').replace(/^@/, '');
    const existing = popularChannels.find(
      (c) =>
        c.id.toLowerCase() === cleaned ||
        c.handle.toLowerCase().replace('@', '') === cleaned ||
        c.title.toLowerCase().includes(cleaned)
    );
    if (existing) {
      setCurrentChannel(existing);
      loadVideosForChannel(existing, timeRange);
      return;
    }

    const resolved = await resolveChannel(query);
    if (resolved) {
      setCurrentChannel(resolved);
      if (!popularChannels.some((c) => c.id === resolved.id)) {
        setPopularChannels((prev) => [resolved, ...prev]);
      }
      loadVideosForChannel(resolved, timeRange);
    } else {
      throw new Error(`Не удалось найти YouTube-канал по запросу: ${query}`);
    }
  };

  // Toggle save channel
  const handleToggleSaveChannel = (channel: YouTubeChannel) => {
    setSavedChannels((prev) => {
      const exists = prev.some((c) => c.id === channel.id);
      if (exists) {
        return prev.filter((c) => c.id !== channel.id);
      } else {
        return [...prev, channel];
      }
    });
  };

  // Toggle video bookmark
  const handleToggleBookmark = (video: YouTubeVideo) => {
    setBookmarkedVideos((prev) => {
      const exists = prev.some((v) => v.id === video.id);
      if (exists) {
        return prev.filter((v) => v.id !== video.id);
      } else {
        return [...prev, video];
      }
    });
  };

  // Handle time range change from TimeRangeFilter
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    if (currentChannel) {
      loadVideosForChannel(currentChannel, newRange);
    }
  };

  // Reset time range
  const handleResetTimeRange = () => {
    const emptyRange: TimeRange = {
      startDate: '',
      startTime: '00:00',
      endDate: '',
      endTime: '23:59',
      preset: 'all',
    };
    setTimeRange(emptyRange);
    if (currentChannel) {
      loadVideosForChannel(currentChannel, emptyRange);
    }
  };

  // Handle timeline bar click
  const handleSelectTimelinePeriod = (startDate: string, endDate: string, label: string) => {
    const periodRange: TimeRange = {
      startDate,
      startTime: '00:00',
      endDate,
      endTime: '23:59',
      preset: label,
    };
    setTimeRange(periodRange);
    if (currentChannel) {
      loadVideosForChannel(currentChannel, periodRange);
    }
  };

  const bookmarkedIds = useMemo(
    () => bookmarkedVideos.map((v) => v.id),
    [bookmarkedVideos]
  );

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans'] antialiased selection:bg-red-900 selection:text-white">
      {/* Top Navigation */}
      <TopBar
        onOpenApiKeyModal={() => setIsApiModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenFavoritesModal={() => setIsFavoritesModalOpen(true)}
        favoritesCount={bookmarkedVideos.length}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        hasApiKey={Boolean(apiKey)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Step 1: Channel Selector */}
        <ChannelSelector
          currentChannel={currentChannel}
          onSelectChannel={handleSelectChannel}
          popularChannels={popularChannels}
          savedChannels={savedChannels}
          onToggleSaveChannel={handleToggleSaveChannel}
          isLoading={isLoadingVideos}
        />

        {/* Step 2: Time Range Filter (Target requirement) */}
        <TimeRangeFilter
          timeRange={timeRange}
          onChangeTimeRange={handleTimeRangeChange}
          onResetTimeRange={handleResetTimeRange}
          filteredCount={filteredVideos.length}
          totalRawCount={allVideos.length}
        />

        {/* Interactive Publication Timeline Scrubber */}
        {(activeSection === 'timeline' || allVideos.length > 0) && (
          <TimelineScrubber
            allVideos={allVideos}
            timeRange={timeRange}
            onSelectPeriod={handleSelectTimelinePeriod}
          />
        )}

        {/* Step 3: Video Results Grid / List / Timeline */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>3. Результаты видео по времени публикации</span>
                <span className="text-xs font-mono text-red-400 bg-red-950/60 border border-red-900 px-2 py-0.5 rounded">
                  {filteredVideos.length} видео
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Названия, даты, обложки и превью в выбранном диапазоне дат
              </p>
            </div>
          </div>

          <VideoList
            videos={filteredVideos}
            isLoading={isLoadingVideos}
            onPlayVideo={setActiveVideo}
            bookmarks={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            onResetTimeRange={handleResetTimeRange}
            channelTitle={currentChannel?.title}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-200">YouTube TimeVault</span>
            <span>·</span>
            <span>Поиск и навигация по видео в заданном диапазоне времени</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Поддержка RSS и YouTube Data API v3</span>
            <span>·</span>
            <button
              onClick={() => setIsApiModalOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Настройка API
            </button>
          </div>
        </div>
      </footer>

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={activeVideo}
        onClose={() => setActiveVideo(null)}
        isBookmarked={activeVideo ? bookmarkedIds.includes(activeVideo.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />

      {/* API Key Modal */}
      <ApiConfigModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        videos={filteredVideos}
        channelTitle={currentChannel?.title || 'Канал'}
        timeRange={timeRange}
      />

      {/* Favorites Modal */}
      <FavoritesModal
        isOpen={isFavoritesModalOpen}
        onClose={() => setIsFavoritesModalOpen(false)}
        savedChannels={savedChannels}
        bookmarkedVideos={bookmarkedVideos}
        onSelectChannel={(id) => handleSelectChannel(id)}
        onPlayVideo={setActiveVideo}
        onRemoveBookmark={(id) =>
          setBookmarkedVideos((prev) => prev.filter((v) => v.id !== id))
        }
        onRemoveSavedChannel={(id) =>
          setSavedChannels((prev) => prev.filter((c) => c.id !== id))
        }
      />
    </div>
  );
}
