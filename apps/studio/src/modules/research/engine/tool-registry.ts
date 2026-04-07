import { tool, type CoreTool } from "ai";
import { z } from "zod";
import { perplexitySearch } from "./tools/perplexity-search";
import { serperSearch } from "./tools/serper-search";
import { serpApiSearch } from "./tools/serpapi-search";
import { youtubeSearch } from "./tools/youtube-search";
import { firecrawlScrape } from "./tools/firecrawl-scrape";
import { apifyActorRun } from "./tools/apify-actor";
import type { ResearchSSEEvent } from "@ai-system/shared-types";

// All possible tools — each maps to an env key
const toolDefinitions: Record<string, { envKey: string; tool: CoreTool }> = {
  perplexity_search: {
    envKey: "PERPLEXITY_API_KEY",
    tool: tool({
      description:
        "Search the web using Perplexity AI for comprehensive, sourced answers. Best for synthesized information about topics, market data, trends, and general knowledge.",
      parameters: z.object({
        query: z.string().describe("The search query"),
        focus: z
          .enum(["internet", "academic", "news"])
          .optional()
          .describe("Search focus: internet (default), academic (papers), or news (recent events)"),
      }),
      execute: async ({ query, focus }) => perplexitySearch({ query, focus }),
    }),
  },

  serper_search: {
    envKey: "SERPER_API_KEY",
    tool: tool({
      description:
        "Search Google via Serper.dev for fast web results. Returns titles, links, and snippets. Use for broad web discovery, finding specific sources, company websites, or product pages.",
      parameters: z.object({
        query: z.string().describe("Google search query"),
        numResults: z
          .number()
          .min(1)
          .max(10)
          .optional()
          .describe("Number of results to return (default 10, max 10)"),
      }),
      execute: async ({ query, numResults }) => serperSearch({ query, numResults }),
    }),
  },

  serpapi_search: {
    envKey: "SERPAPI_API_KEY",
    tool: tool({
      description:
        "Search Google via SerpAPI for detailed web results including knowledge graph data. Use as an alternative or complement to other search tools when you need richer metadata.",
      parameters: z.object({
        query: z.string().describe("Google search query"),
        numResults: z
          .number()
          .min(1)
          .max(10)
          .optional()
          .describe("Number of results to return (default 10)"),
      }),
      execute: async ({ query, numResults }) => serpApiSearch({ query, numResults }),
    }),
  },

  youtube_search: {
    envKey: "YOUTUBE_API_KEY",
    tool: tool({
      description:
        "Search YouTube for videos related to a topic. Returns video metadata, view counts, channel info, and descriptions. Use for understanding content landscape, audience interest, and trending topics.",
      parameters: z.object({
        query: z.string().describe("YouTube search query"),
        maxResults: z
          .number()
          .min(1)
          .max(10)
          .optional()
          .describe("Number of results (default 5, max 10)"),
      }),
      execute: async ({ query, maxResults }) => youtubeSearch({ query, maxResults }),
    }),
  },

  firecrawl_scrape: {
    envKey: "FIRECRAWL_API_KEY",
    tool: tool({
      description:
        "Scrape and extract content from a specific URL. Returns clean markdown text. Use when you need detailed information from a known webpage, article, or documentation page.",
      parameters: z.object({
        url: z.string().url().describe("The URL to scrape and extract content from"),
      }),
      execute: async ({ url }) => firecrawlScrape({ url }),
    }),
  },

  apify_actor_run: {
    envKey: "APIFY_API_KEY",
    tool: tool({
      description:
        "Run an Apify actor for specialized scraping. Use for social media data, reviews, structured data extraction, or when other tools don't cover the source. Common actors: 'apify/google-search-scraper', 'apify/instagram-scraper', 'apify/twitter-scraper'.",
      parameters: z.object({
        actorId: z.string().describe("The Apify actor ID (e.g., 'apify/google-search-scraper')"),
        input: z.record(z.unknown()).describe("Input configuration for the actor"),
      }),
      execute: async ({ actorId, input }) => apifyActorRun({ actorId, input }),
    }),
  },
};

/**
 * Returns only the tools whose API keys are configured in .env.
 * Claude will only see (and can only call) tools that are actually usable.
 */
export function getAvailableTools(): Record<string, CoreTool> {
  const available: Record<string, CoreTool> = {};

  for (const [name, def] of Object.entries(toolDefinitions)) {
    if (process.env[def.envKey]) {
      available[name] = def.tool;
    }
  }

  return available;
}

/**
 * Returns the names of all configured tools (for display in the UI).
 */
export function getAvailableToolNames(): string[] {
  return Object.entries(toolDefinitions)
    .filter(([, def]) => !!process.env[def.envKey])
    .map(([name]) => name);
}
