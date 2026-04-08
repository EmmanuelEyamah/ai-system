import { serperSearch } from "@/modules/research/engine/tools/serper-search";
import { youtubeSearch } from "@/modules/research/engine/tools/youtube-search";

export interface TrendItem {
  platform: string;
  title: string;
  url: string;
  author?: string;
  engagement: {
    views?: number;
    likes?: number;
    comments?: number;
    upvotes?: number;
    shares?: number;
    reactions?: number;
  };
  postedAt?: string;
  snippet?: string;
  trendScore: number;
}

function calcTrendScore(engagement: TrendItem["engagement"], postedAt?: string): number {
  const total = (engagement.views || 0) + (engagement.likes || 0) * 10 + (engagement.comments || 0) * 5 + (engagement.upvotes || 0) * 3 + (engagement.reactions || 0) * 8 + (engagement.shares || 0) * 6;
  if (!postedAt) return Math.min(Math.round(Math.log10(total + 1) * 20), 100);
  const hoursAgo = Math.max(1, (Date.now() - new Date(postedAt).getTime()) / 3600000);
  const velocity = total / hoursAgo;
  return Math.min(Math.round(Math.log10(velocity + 1) * 30), 100);
}

// --- YouTube (real data via API — best quality) ---
export async function searchYouTube(query: string): Promise<TrendItem[]> {
  if (!process.env.YOUTUBE_API_KEY) return [];
  try {
    const { videos } = await youtubeSearch({ query, maxResults: 5 });
    return videos.map((v) => {
      const engagement = { views: parseInt(v.viewCount) || 0 };
      return {
        platform: "youtube",
        title: v.title,
        url: `https://youtube.com/watch?v=${v.videoId}`,
        author: v.channelTitle,
        engagement,
        postedAt: v.publishedAt,
        snippet: v.description?.slice(0, 150),
        trendScore: calcTrendScore(engagement, v.publishedAt),
      };
    });
  } catch { return []; }
}

// --- Serper site-specific search (works for all platforms) ---
async function serperSiteSearch(query: string, site: string, platform: string): Promise<TrendItem[]> {
  if (!process.env.SERPER_API_KEY) return [];
  try {
    const { results } = await serperSearch({ query: `${query} site:${site}`, numResults: 5 });
    return results.map((r) => {
      // Try to extract engagement hints from snippets
      const likeMatch = r.snippet?.match(/([\d,.]+[KMk]?)\s*(likes?|reactions?|❤)/i);
      const commentMatch = r.snippet?.match(/([\d,.]+[KMk]?)\s*(comments?|replies)/i);
      const viewMatch = r.snippet?.match(/([\d,.]+[KMk]?)\s*(views?|plays?)/i);

      const parseNum = (s?: string) => {
        if (!s) return 0;
        const clean = s.replace(/,/g, "");
        if (clean.endsWith("K") || clean.endsWith("k")) return parseFloat(clean) * 1000;
        if (clean.endsWith("M") || clean.endsWith("m")) return parseFloat(clean) * 1000000;
        return parseInt(clean) || 0;
      };

      const engagement: TrendItem["engagement"] = {};
      if (likeMatch) engagement.likes = parseNum(likeMatch[1]);
      if (commentMatch) engagement.comments = parseNum(commentMatch[1]);
      if (viewMatch) engagement.views = parseNum(viewMatch[1]);

      // Extract author from URL patterns
      let author: string | undefined;
      if (platform === "linkedin") {
        const authorMatch = r.link?.match(/linkedin\.com\/posts\/([^-_]+)/);
        if (authorMatch) author = authorMatch[1].replace(/-/g, " ");
      }
      if (platform === "twitter") {
        const authorMatch = r.link?.match(/(?:twitter|x)\.com\/([^/]+)/);
        if (authorMatch && authorMatch[1] !== "search") author = `@${authorMatch[1]}`;
      }
      if (platform === "instagram") {
        const authorMatch = r.link?.match(/instagram\.com\/([^/]+)/);
        if (authorMatch && !["p", "reel", "explore"].includes(authorMatch[1])) author = `@${authorMatch[1]}`;
      }
      if (platform === "tiktok") {
        const authorMatch = r.link?.match(/tiktok\.com\/@([^/]+)/);
        if (authorMatch) author = `@${authorMatch[1]}`;
      }

      return {
        platform,
        title: r.title,
        url: r.link,
        author,
        engagement,
        snippet: r.snippet?.slice(0, 150),
        trendScore: calcTrendScore(engagement),
      };
    });
  } catch { return []; }
}

// --- Platform-specific searchers ---

export async function searchReddit(query: string): Promise<TrendItem[]> {
  return serperSiteSearch(query, "reddit.com", "reddit");
}

export async function searchWeb(query: string): Promise<TrendItem[]> {
  if (!process.env.SERPER_API_KEY) return [];
  try {
    const { results } = await serperSearch({ query: `${query} trending ${new Date().getFullYear()}`, numResults: 5 });
    return results.map((r) => ({
      platform: "web", title: r.title, url: r.link, snippet: r.snippet?.slice(0, 150),
      engagement: {}, trendScore: 50,
    }));
  } catch { return []; }
}

export async function searchLinkedIn(query: string): Promise<TrendItem[]> {
  return serperSiteSearch(query, "linkedin.com/posts", "linkedin");
}

export async function searchTwitter(query: string): Promise<TrendItem[]> {
  return serperSiteSearch(query, "x.com OR twitter.com", "twitter");
}

export async function searchInstagram(query: string): Promise<TrendItem[]> {
  return serperSiteSearch(query, "instagram.com", "instagram");
}

export async function searchTikTok(query: string): Promise<TrendItem[]> {
  return serperSiteSearch(query, "tiktok.com", "tiktok");
}

// --- Main search coordinator ---
export type PlatformKey = "youtube" | "reddit" | "web" | "linkedin" | "twitter" | "instagram" | "tiktok";

const platformSearchers: Record<PlatformKey, (query: string) => Promise<TrendItem[]>> = {
  youtube: searchYouTube,
  reddit: searchReddit,
  web: searchWeb,
  linkedin: searchLinkedIn,
  twitter: searchTwitter,
  instagram: searchInstagram,
  tiktok: searchTikTok,
};

// All platforms are now instant (Serper-based), YouTube uses its own API
export const INSTANT_PLATFORMS: PlatformKey[] = ["youtube", "reddit", "web", "linkedin", "twitter", "instagram", "tiktok"];
export const APIFY_PLATFORMS: PlatformKey[] = [];

export async function searchPlatform(platform: PlatformKey, query: string): Promise<TrendItem[]> {
  const searcher = platformSearchers[platform];
  if (!searcher) return [];
  return searcher(query);
}

// --- YouTube Channel search (uses YouTube Data API) ---
export async function searchYouTubeChannel(channelQuery: string): Promise<TrendItem[]> {
  if (!process.env.YOUTUBE_API_KEY) return [];
  const apiKey = process.env.YOUTUBE_API_KEY;

  try {
    // Step 1: Find the channel
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", channelQuery);
    searchUrl.searchParams.set("type", "channel");
    searchUrl.searchParams.set("maxResults", "1");

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) return [];
    const searchData = await searchRes.json();
    const channelId = searchData.items?.[0]?.id?.channelId;
    if (!channelId) return [];

    const channelName = searchData.items?.[0]?.snippet?.channelTitle || channelQuery;

    // Step 2: Get recent videos from this channel
    const videosUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    videosUrl.searchParams.set("key", apiKey);
    videosUrl.searchParams.set("part", "snippet");
    videosUrl.searchParams.set("channelId", channelId);
    videosUrl.searchParams.set("type", "video");
    videosUrl.searchParams.set("order", "date");
    videosUrl.searchParams.set("maxResults", "10");

    const videosRes = await fetch(videosUrl.toString());
    if (!videosRes.ok) return [];
    const videosData = await videosRes.json();
    const videoIds = (videosData.items || []).map((i: { id: { videoId: string } }) => i.id.videoId).filter(Boolean);
    if (videoIds.length === 0) return [];

    // Step 3: Get video statistics
    const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    statsUrl.searchParams.set("key", apiKey);
    statsUrl.searchParams.set("part", "statistics,snippet");
    statsUrl.searchParams.set("id", videoIds.join(","));

    const statsRes = await fetch(statsUrl.toString());
    if (!statsRes.ok) return [];
    const statsData = await statsRes.json();

    return (statsData.items || []).map(
      (item: {
        id: string;
        snippet: { title: string; publishedAt: string; description: string };
        statistics: { viewCount: string; likeCount: string; commentCount: string };
      }) => {
        const engagement = {
          views: parseInt(item.statistics?.viewCount) || 0,
          likes: parseInt(item.statistics?.likeCount) || 0,
          comments: parseInt(item.statistics?.commentCount) || 0,
        };
        return {
          platform: "youtube",
          title: item.snippet.title,
          url: `https://youtube.com/watch?v=${item.id}`,
          author: channelName,
          engagement,
          postedAt: item.snippet.publishedAt,
          snippet: item.snippet.description?.slice(0, 150),
          trendScore: calcTrendScore(engagement, item.snippet.publishedAt),
        };
      }
    );
  } catch { return []; }
}

// --- Account search (Serper site-specific for a person/handle) ---
export async function searchAccount(handle: string, platform: PlatformKey): Promise<TrendItem[]> {
  // Clean the handle — remove @ and URLs
  const clean = handle.replace(/^@/, "").replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "");

  const siteMap: Record<string, string> = {
    linkedin: `linkedin.com/in/${clean} OR linkedin.com/posts/${clean}`,
    twitter: `x.com/${clean} OR twitter.com/${clean}`,
    instagram: `instagram.com/${clean}`,
    tiktok: `tiktok.com/@${clean}`,
    youtube: `youtube.com/@${clean} OR youtube.com/c/${clean}`,
    reddit: `reddit.com/user/${clean}`,
    web: clean,
  };

  const site = siteMap[platform];
  if (!site) return [];

  if (platform === "youtube") {
    return searchYouTubeChannel(clean);
  }

  return serperSiteSearch(clean, site, platform);
}
