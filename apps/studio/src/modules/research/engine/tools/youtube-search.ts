export interface YouTubeVideo {
  videoId: string;
  title: string;
  channelTitle: string;
  viewCount: string;
  publishedAt: string;
  description: string;
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[];
}

export async function youtubeSearch(params: {
  query: string;
  maxResults?: number;
}): Promise<YouTubeSearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return { videos: [] };
  }

  const maxResults = Math.min(params.maxResults || 5, 8);

  // Step 1: Search for videos
  const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
  searchUrl.searchParams.set("key", apiKey);
  searchUrl.searchParams.set("part", "snippet");
  searchUrl.searchParams.set("q", params.query);
  searchUrl.searchParams.set("type", "video");
  searchUrl.searchParams.set("maxResults", String(maxResults));

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    const text = await searchRes.text();
    throw new Error(`YouTube Search error ${searchRes.status}: ${text}`);
  }

  const searchData = await searchRes.json();
  const videoIds = (searchData.items || [])
    .map((item: { id: { videoId: string } }) => item.id.videoId)
    .filter(Boolean);

  if (videoIds.length === 0) return { videos: [] };

  // Step 2: Get video statistics
  const statsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  statsUrl.searchParams.set("key", apiKey);
  statsUrl.searchParams.set("part", "statistics,snippet");
  statsUrl.searchParams.set("id", videoIds.join(","));

  const statsRes = await fetch(statsUrl.toString());
  if (!statsRes.ok) {
    const text = await statsRes.text();
    throw new Error(`YouTube Videos error ${statsRes.status}: ${text}`);
  }

  const statsData = await statsRes.json();
  const videos: YouTubeVideo[] = (statsData.items || []).map(
    (item: {
      id: string;
      snippet: { title: string; channelTitle: string; publishedAt: string; description: string };
      statistics: { viewCount: string };
    }) => ({
      videoId: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      viewCount: item.statistics?.viewCount || "0",
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description?.slice(0, 150) || "",
    })
  );

  return { videos };
}
