import { serperSearch } from "@/modules/research/engine/tools/serper-search";
import { youtubeSearch } from "@/modules/research/engine/tools/youtube-search";
import { firecrawlScrape } from "@/modules/research/engine/tools/firecrawl-scrape";

/**
 * Quick research — any module can call this for instant context.
 * Runs Serper + YouTube in parallel, optionally scrapes a URL.
 * Returns compressed text ready to inject into a prompt.
 * Zero Claude tokens — just API calls.
 */
export async function quickResearch(query: string, options?: {
  scrapeUrl?: string;
  skipYoutube?: boolean;
}): Promise<string> {
  const parts: string[] = [];

  const tasks: Promise<void>[] = [];

  // Serper search
  if (process.env.SERPER_API_KEY) {
    tasks.push(
      serperSearch({ query, numResults: 5 })
        .then(({ results }) => {
          if (results.length > 0) {
            parts.push(
              "## Web Search Results\n" +
              results.map((r) => `- [${r.title}](${r.link}): ${r.snippet}`).join("\n")
            );
          }
        })
        .catch(() => {})
    );
  }

  // YouTube search
  if (process.env.YOUTUBE_API_KEY && !options?.skipYoutube) {
    tasks.push(
      youtubeSearch({ query, maxResults: 3 })
        .then(({ videos }) => {
          if (videos.length > 0) {
            parts.push(
              "## YouTube Videos\n" +
              videos.map((v) => `- **${v.title}** by ${v.channelTitle} (${Number(v.viewCount).toLocaleString()} views)`).join("\n")
            );
          }
        })
        .catch(() => {})
    );
  }

  // URL scrape
  if (options?.scrapeUrl && process.env.FIRECRAWL_API_KEY) {
    tasks.push(
      firecrawlScrape({ url: options.scrapeUrl })
        .then(({ markdown, metadata }) => {
          if (markdown) {
            parts.push(`## Scraped: ${metadata.title || options.scrapeUrl}\n${markdown}`);
          }
        })
        .catch(() => {})
    );
  }

  await Promise.allSettled(tasks);

  return parts.join("\n\n---\n\n");
}

/**
 * Fetch URL content — scrapes a single URL and returns its text.
 */
export async function fetchUrlContent(url: string): Promise<string> {
  if (!process.env.FIRECRAWL_API_KEY) {
    console.log("[URL] No FIRECRAWL_API_KEY set, skipping scrape for:", url);
    return "";
  }
  try {
    console.log("[URL] Scraping:", url);
    const { markdown, metadata } = await firecrawlScrape({ url });
    console.log("[URL] Scraped:", url, "— got", markdown.length, "chars, title:", metadata.title);
    return `[Content from ${metadata.title || url}]\n${markdown}`;
  } catch (err) {
    console.error("[URL] Scrape failed for:", url, err instanceof Error ? err.message : err);
    return "";
  }
}
