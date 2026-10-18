import { YouTubeChannel, YouTubeVideo } from '../types/youtube';

export async function fetchPopularChannels(): Promise<YouTubeChannel[]> {
  try {
    const res = await fetch('/api/youtube/popular-channels');
    if (!res.ok) throw new Error('Не удалось загрузить популярные каналы');
    const data = await res.json();
    return data.channels || [];
  } catch (err) {
    console.error('fetchPopularChannels error:', err);
    return [];
  }
}

export async function resolveChannel(query: string): Promise<YouTubeChannel | null> {
  try {
    const res = await fetch(`/api/youtube/resolve?query=${encodeURIComponent(query)}`);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Ошибка разрешения канала');
    }
    const data = await res.json();
    return data.channel || null;
  } catch (err) {
    console.error('resolveChannel error:', err);
    throw err;
  }
}

export async function fetchChannelVideos(params: {
  channelId: string;
  channelTitle?: string;
  channelHandle?: string;
  publishedAfter?: string;
  publishedBefore?: string;
  apiKey?: string;
}): Promise<{ videos: YouTubeVideo[]; totalFound: number; totalRaw: number }> {
  const queryParams = new URLSearchParams();
  queryParams.set('channelId', params.channelId);
  if (params.channelTitle) queryParams.set('channelTitle', params.channelTitle);
  if (params.channelHandle) queryParams.set('channelHandle', params.channelHandle);
  if (params.publishedAfter) queryParams.set('publishedAfter', params.publishedAfter);
  if (params.publishedBefore) queryParams.set('publishedBefore', params.publishedBefore);
  if (params.apiKey) queryParams.set('apiKey', params.apiKey);

  const res = await fetch(`/api/youtube/videos?${queryParams.toString()}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Ошибка загрузки видео');
  }
  const data = await res.json();
  return {
    videos: data.videos || [],
    totalFound: data.totalFound || 0,
    totalRaw: data.totalRaw || 0,
  };
}

export function formatDateRu(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateOnlyRu(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getRelativeTimeRu(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'только что';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} мин. назад`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} ч. назад`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays} дн. назад`;
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return `${diffMonths} мес. назад`;
    const diffYears = Math.floor(diffMonths / 12);
    return `${diffYears} г. назад`;
  } catch {
    return '';
  }
}

export function exportVideosToCsv(videos: YouTubeVideo[], channelTitle: string) {
  const header = ['ID', 'Название', 'Дата публикации', 'Ссылка', 'Просмотры', 'Длительность'];
  const rows = videos.map((v) => [
    `"${v.id}"`,
    `"${(v.title || '').replace(/"/g, '""')}"`,
    `"${v.publishedAt}"`,
    `"${v.url}"`,
    `"${v.views || ''}"`,
    `"${v.duration || ''}"`,
  ]);

  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `youtube_${channelTitle.replace(/\s+/g, '_')}_videos.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportVideosToJson(videos: YouTubeVideo[], channelTitle: string) {
  const jsonContent = JSON.stringify(videos, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `youtube_${channelTitle.replace(/\s+/g, '_')}_videos.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
