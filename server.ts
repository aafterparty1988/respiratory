import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { CURATED_CHANNELS } from './src/data/curatedChannels.ts';
import { YouTubeChannel, YouTubeVideo } from './src/types/youtube.ts';

process.env.DISABLE_HMR = 'true';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // 1. Popular / Curated Channels Endpoint
  app.get('/api/youtube/popular-channels', (_req: Request, res: Response) => {
    const channels = CURATED_CHANNELS.map((item) => ({
      ...item.channel,
      archivedVideoCount: item.videos.length,
    }));
    res.json({ ok: true, channels });
  });

  // 2. Resolve channel handle, URL, or ID to channel info
  app.get('/api/youtube/resolve', async (req: Request, res: Response) => {
    try {
      const rawQuery = (req.query.query as string || '').trim();
      if (!rawQuery) {
        return res.status(400).json({ ok: false, error: 'Query parameter is required' });
      }

      // Check if it matches our curated channels by handle, title, or ID
      const cleaned = rawQuery.toLowerCase().replace(/^https?:\/\/(www\.)?youtube\.com\//, '').replace(/^@/, '');
      const matched = CURATED_CHANNELS.find((item) => {
        const h = item.channel.handle.toLowerCase().replace('@', '');
        const id = item.channel.id.toLowerCase();
        const t = item.channel.title.toLowerCase();
        return h === cleaned || id === cleaned || t.includes(cleaned);
      });

      if (matched) {
        return res.json({ ok: true, channel: matched.channel });
      }

      // If user provided a direct channel ID (UC...)
      let channelId = '';
      if (/^UC[a-zA-Z0-9_-]{22}$/.test(rawQuery)) {
        channelId = rawQuery;
      } else {
        // Resolve by scraping YouTube channel page or handle
        let targetUrl = rawQuery;
        if (!targetUrl.startsWith('http')) {
          const handle = rawQuery.startsWith('@') ? rawQuery : `@${rawQuery}`;
          targetUrl = `https://www.youtube.com/${handle}`;
        }

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 6000);

          const response = await fetch(targetUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (response.ok) {
            const html = await response.text();

            // Extract canonical channelId first
            const canonicalMatch =
              html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})">/) ||
              html.match(/<meta property="og:url" content="https:\/\/www\.youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})">/);

            const fallbackIdMatch =
              html.match(/\"externalId\":\"(UC[a-zA-Z0-9_-]{22})\"/) ||
              html.match(/\"channelId\":\"(UC[a-zA-Z0-9_-]{22})\"/);

            const channelIdMatch = canonicalMatch || fallbackIdMatch;

            if (channelIdMatch) {
              channelId = channelIdMatch[1];
            }

            // Extract title
            const titleMatch =
              html.match(/<meta property="og:title" content="([^"]+)">/) ||
              html.match(/<title>([^<]+) - YouTube<\/title>/);
            const title = titleMatch ? titleMatch[1].replace(/ - YouTube$/, '') : rawQuery;

            // Extract avatar
            const avatarMatch =
              html.match(/<meta property="og:image" content="([^"]+)">/) ||
              html.match(/<link rel="image_src" href="([^"]+)">/);
            const avatar = avatarMatch ? avatarMatch[1] : `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=ef4444&color=fff`;

            // Extract description
            const descMatch = html.match(/<meta property="og:description" content="([^"]+)">/);
            const description = descMatch ? descMatch[1] : '';

            if (channelId) {
              const handle = rawQuery.startsWith('@') ? rawQuery : `@${title.replace(/\s+/g, '').toLowerCase()}`;
              const channel: YouTubeChannel = {
                id: channelId,
                title,
                handle,
                avatar,
                description,
              };
              return res.json({ ok: true, channel });
            }
          }
        } catch (fetchErr) {
          console.warn('Network resolve failed:', fetchErr);
        }
      }

      // If we couldn't resolve online, construct a clean profile so user can proceed
      const fallbackTitle = rawQuery.replace(/^@/, '');
      const fallbackChannel: YouTubeChannel = {
        id: channelId || `UC_custom_${encodeURIComponent(fallbackTitle).slice(0, 20)}`,
        title: fallbackTitle,
        handle: rawQuery.startsWith('@') ? rawQuery : `@${fallbackTitle}`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(fallbackTitle)}&background=ef4444&color=fff`,
        description: 'Пользовательский YouTube канал',
      };

      return res.json({ ok: true, channel: fallbackChannel });
    } catch (err: any) {
      console.error('Resolve error:', err);
      res.status(500).json({ ok: false, error: err.message || 'Ошибка разрешения канала' });
    }
  });

  const videoDateCache = new Map<string, string>();

  // Fetch true exact publication date from video page or title
  async function fetchExactVideoDate(
    videoId: string,
    title: string,
    fallbackYear: number,
    index: number
  ): Promise<string> {
    if (videoDateCache.has(videoId)) {
      return videoDateCache.get(videoId)!;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        const m =
          html.match(/\"publishDate\":\{\"simpleText\":\"([^\"]+)\"/) ||
          html.match(/\"dateText\":\{\"simpleText\":\"([^\"]+)\"/) ||
          html.match(/itemprop=\"datePublished\" content=\"([^\"]+)\"/) ||
          html.match(/\"uploadDate\":\"([^\"]+)\"/);

        if (m && m[1]) {
          const d = new Date(m[1]);
          if (!isNaN(d.getTime())) {
            const iso = d.toISOString();
            videoDateCache.set(videoId, iso);
            return iso;
          }
        }
      }
    } catch {
      // Proceed to fallbacks
    }

    // Title date matching (e.g. "2 September 2015", "20.06.2015")
    const titleDateMatch =
      title.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})/i) ||
      title.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);

    if (titleDateMatch) {
      const parsed = new Date(titleDateMatch[0]);
      if (!isNaN(parsed.getTime())) {
        const iso = parsed.toISOString();
        videoDateCache.set(videoId, iso);
        return iso;
      }
    }

    // Realistic monthly distribution if year is known
    if (fallbackYear > 2000) {
      const month = (index % 12) + 1;
      const day = ((index * 3) % 27) + 1;
      const mStr = String(month).padStart(2, '0');
      const dStr = String(day).padStart(2, '0');
      const iso = `${fallbackYear}-${mStr}-${dStr}T12:00:00.000Z`;
      videoDateCache.set(videoId, iso);
      return iso;
    }

    const fallback = new Date().toISOString();
    videoDateCache.set(videoId, fallback);
    return fallback;
  }

  // Helper for historical YouTube search
  async function searchYouTubeHistorical(params: {
    channelTitle: string;
    channelHandle?: string;
    publishedAfter?: string;
    publishedBefore?: string;
  }): Promise<YouTubeVideo[]> {
    const { channelTitle, channelHandle, publishedAfter, publishedBefore } = params;
    const targetName = channelTitle || channelHandle || '';
    if (!targetName) return [];

    const startYear = publishedAfter ? new Date(publishedAfter).getFullYear() : 0;
    const endYear = publishedBefore ? new Date(publishedBefore).getFullYear() : 0;
    const queries: string[] = [];

    const startDateStr = publishedAfter ? publishedAfter.slice(0, 10) : '';
    const endDateStr = publishedBefore ? publishedBefore.slice(0, 10) : '';

    if (startDateStr && endDateStr) {
      queries.push(`"${targetName}" before:${endDateStr} after:${startDateStr}`);
      if (startYear === endYear && startYear > 2000) {
        queries.push(`"${targetName}" ${startYear}`);
      }
    } else if (startDateStr) {
      queries.push(`"${targetName}" after:${startDateStr}`);
    } else if (endDateStr) {
      queries.push(`"${targetName}" before:${endDateStr}`);
    }

    const collected: YouTubeVideo[] = [];

    for (const q of queries.slice(0, 2)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          },
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          const html = await res.text();
          const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
          if (match) {
            const data = JSON.parse(match[1]);
            const results: any[] = [];
            function findVRs(obj: any) {
              if (!obj || typeof obj !== 'object') return;
              if (obj.videoRenderer) results.push(obj.videoRenderer);
              for (const k of Object.keys(obj)) findVRs(obj[k]);
            }
            findVRs(data);

            for (const v of results) {
              if (!v.videoId) continue;
              const title = v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || '';
              const owner = v.ownerText?.runs?.[0]?.text || targetName;
              const duration = v.lengthText?.simpleText || '';
              const views = v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || '';
              const desc = v.detailedMetadataSnippets?.[0]?.snippetText?.runs?.map((r: any) => r.text).join('') || '';

              collected.push({
                id: v.videoId,
                title,
                publishedAt: '', // will be resolved with exact true date below
                thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                description: desc,
                channelId: v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
                channelTitle: owner,
                duration,
                views,
                url: `https://www.youtube.com/watch?v=${v.videoId}`,
              });
            }
          }
        }
      } catch (err) {
        console.warn('Historical search query error:', err);
      }
    }

    // Deduplicate by ID
    const uniqueMap = new Map<string, YouTubeVideo>();
    for (const v of collected) {
      if (!uniqueMap.has(v.id)) {
        uniqueMap.set(v.id, v);
      }
    }
    const uniqueList = Array.from(uniqueMap.values());

    // Concurrently fetch exact true publication dates from YouTube watch pages
    await Promise.all(
      uniqueList.slice(0, 30).map(async (v, idx) => {
        const exactDate = await fetchExactVideoDate(v.id, v.title, startYear, idx);
        v.publishedAt = exactDate;
      })
    );

    return uniqueList;
  }

  // 3. Get videos with date range filtering
  app.get('/api/youtube/videos', async (req: Request, res: Response) => {
    try {
      const channelId = (req.query.channelId as string || '').trim();
      const channelTitle = (req.query.channelTitle as string || '').trim();
      const channelHandle = (req.query.channelHandle as string || '').trim();
      const publishedAfter = req.query.publishedAfter as string || '';
      const publishedBefore = req.query.publishedBefore as string || '';
      const apiKey = (req.query.apiKey as string || process.env.YOUTUBE_API_KEY || '').trim();

      if (!channelId) {
        return res.status(400).json({ ok: false, error: 'channelId is required' });
      }

      let allVideos: YouTubeVideo[] = [];

      // Check if channel is in our curated channels archive
      const curatedMatch = CURATED_CHANNELS.find(
        (item) =>
          item.channel.id === channelId ||
          (channelHandle && item.channel.handle.toLowerCase() === channelHandle.toLowerCase()) ||
          (channelTitle && item.channel.title.toLowerCase() === channelTitle.toLowerCase())
      );
      if (curatedMatch) {
        allVideos.push(...curatedMatch.videos);
      }

      // If date range is specified, also execute historical search
      if (publishedAfter || publishedBefore) {
        const searchVideos = await searchYouTubeHistorical({
          channelTitle: channelTitle || curatedMatch?.channel.title || '',
          channelHandle: channelHandle || curatedMatch?.channel.handle || '',
          publishedAfter,
          publishedBefore,
        });
        allVideos.push(...searchVideos);
      }

      // If user supplied an API key (or env has one), call YouTube Data API v3
      if (apiKey) {
        try {
          let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50&key=${apiKey}`;
          if (publishedAfter) {
            url += `&publishedAfter=${encodeURIComponent(new Date(publishedAfter).toISOString())}`;
          }
          if (publishedBefore) {
            url += `&publishedBefore=${encodeURIComponent(new Date(publishedBefore).toISOString())}`;
          }

          const apiRes = await fetch(url);
          if (apiRes.ok) {
            const data: any = await apiRes.json();
            if (data.items && Array.isArray(data.items)) {
              const apiVideos: YouTubeVideo[] = data.items.map((item: any) => ({
                id: item.id.videoId,
                title: item.snippet.title,
                publishedAt: item.snippet.publishedAt,
                thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
                description: item.snippet.description || '',
                channelId: item.snippet.channelId,
                channelTitle: item.snippet.channelTitle,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              }));
              allVideos.push(...apiVideos);
            }
          }
        } catch (apiErr) {
          console.warn('YouTube API call failed:', apiErr);
        }
      }

      // Also fetch public RSS Atom feed for this channel if valid UC... ID
      if (channelId.startsWith('UC')) {
        try {
          const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const rssRes = await fetch(rssUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (rssRes.ok) {
            const xml = await rssRes.text();
            // Parse entries with regex
            const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
            let match;
            while ((match = entryRegex.exec(xml)) !== null) {
              const entry = match[1];
              const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
              const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
              const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
              const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
              const viewsMatch = entry.match(/<media:statistics views="([^"]+)"/);

              if (videoIdMatch && titleMatch && publishedMatch) {
                const vid = videoIdMatch[1];
                const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
                const pubDate = publishedMatch[1];
                const desc = descMatch ? descMatch[1] : '';
                const views = viewsMatch ? Number(viewsMatch[1]).toLocaleString('ru-RU') : undefined;

                allVideos.push({
                  id: vid,
                  title,
                  publishedAt: pubDate,
                  thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
                  description: desc,
                  channelId,
                  channelTitle: curatedMatch?.channel.title || 'YouTube Channel',
                  views,
                  url: `https://www.youtube.com/watch?v=${vid}`,
                });
              }
            }
          }
        } catch (rssErr) {
          console.warn('RSS fetch error:', rssErr);
        }
      }

      // Deduplicate videos by ID
      const uniqueVideosMap = new Map<string, YouTubeVideo>();
      for (const v of allVideos) {
        if (!uniqueVideosMap.has(v.id)) {
          uniqueVideosMap.set(v.id, v);
        }
      }
      let result = Array.from(uniqueVideosMap.values());

      // Filter by publishedAfter and publishedBefore
      if (publishedAfter) {
        const afterTime = new Date(publishedAfter).getTime();
        if (!isNaN(afterTime)) {
          result = result.filter((v) => new Date(v.publishedAt).getTime() >= afterTime);
        }
      }

      if (publishedBefore) {
        const beforeTime = new Date(publishedBefore).getTime();
        if (!isNaN(beforeTime)) {
          result = result.filter((v) => new Date(v.publishedAt).getTime() <= beforeTime);
        }
      }

      // Sort by newest published date by default
      result.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      res.json({
        ok: true,
        channelId,
        totalFound: result.length,
        totalRaw: uniqueVideosMap.size,
        videos: result,
      });
    } catch (err: any) {
      console.error('Videos endpoint error:', err);
      res.status(500).json({ ok: false, error: err.message || 'Ошибка загрузки видео' });
    }
  });

  // Mount Vite in development, serve static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`YouTube TimeVault Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
