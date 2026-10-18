export interface YouTubeChannel {
  id: string;
  title: string;
  handle: string;
  avatar: string;
  description?: string;
  subscriberCount?: string;
  videoCount?: number;
  customUrl?: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string; // ISO 8601 string
  thumbnail: string;
  description: string;
  channelId: string;
  channelTitle: string;
  duration?: string;
  views?: string | number;
  url: string;
}

export interface TimeRange {
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endDate: string;   // YYYY-MM-DD
  endTime: string;   // HH:mm
  preset?: string;
}

export type ViewMode = 'grid' | 'list' | 'timeline';
export type SortOrder = 'newest' | 'oldest' | 'views' | 'title';

export interface TimelineBucket {
  periodKey: string; // e.g. '2023-05'
  label: string;     // e.g. 'Май 2023'
  year: number;
  month: number;
  count: number;
  startDate: string;
  endDate: string;
}
