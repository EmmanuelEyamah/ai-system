import { generateText, type LanguageModel } from "ai";
import { createAnthropicClient, createOpenAIClient } from "@ai-system/ai-clients";
import { getModel } from "@/lib/models";
import { CRITIC_CONVERSATION_PROMPT, CRITIC_VERDICT_PROMPT } from "./prompts";
import { perplexitySearch } from "@/modules/research/engine/tools/perplexity-search";
import { serperSearch } from "@/modules/research/engine/tools/serper-search";
import { youtubeSearch } from "@/modules/research/engine/tools/youtube-search";
import { firecrawlScrape } from "@/modules/research/engine/tools/firecrawl-scrape";

type EmitFn = (event: { type: string; payload: Record<string, unknown> }) => void;

function resolveModel(modelId?: string): LanguageModel {
  const resolved = modelId ? getModel(modelId) : undefined;
  if (resolved?.provider === "openai") {
    const openai = createOpenAIClient();
    return openai(resolved.modelId);
  }
  const anthropic = createAnthropicClient();
  return anthropic(resolved?.modelId || "claude-sonnet-4-6");
}

// --- Conversation phase (same pattern as prompt-studio) ---

const SUMMARY_DETECTED = "---READY---";

export async function handleConversation(params: {
  userMessage: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  modelId?: string;
}): Promise<{ type: "chat" | "summary"; message: string; showConfirmButtons: boolean }> {
  const { userMessage, conversationHistory, modelId } = params;
  const model = resolveModel(modelId);

  const messages = conversationHistory
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.replace(/---SUMMARY---[\s\S]*---READY---/g, "").trim(),
    }))
    .filter((m) => m.content);

  messages.push({ role: "user", content: userMessage });

  const { text } = await generateText({
    model,
    system: CRITIC_CONVERSATION_PROMPT,
    messages,
    maxTokens: 1000,
  });

  const hasSummary = text.includes(SUMMARY_DETECTED);

  if (hasSummary) {
    const summaryMatch = text.match(/---SUMMARY---([\s\S]*?)---READY---/);
    const summary = summaryMatch ? summaryMatch[1].trim() : "";
    const beforeSummary = text.split("---SUMMARY---")[0].trim();

    const displayMessage = beforeSummary
      ? `${beforeSummary}\n\nHere's what I understand about your idea:\n\n${summary}`
      : `Here's what I understand about your idea:\n\n${summary}`;

    return { type: "summary", message: displayMessage, showConfirmButtons: true };
  }

  return { type: "chat", message: text, showConfirmButtons: false };
}

// --- Research + Critique phase ---

interface ToolResult {
  tool: string;
  data: unknown;
}

async function gatherResearch(ideaSummary: string, emitEvent: EmitFn): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  // Build search queries from the idea summary
  const searches: { tool: string; fn: () => Promise<unknown> }[] = [];

  if (process.env.SERPER_API_KEY) {
    searches.push({
      tool: "serper_search",
      fn: () => serperSearch({ query: ideaSummary.slice(0, 100), numResults: 5 }),
    });
    searches.push({
      tool: "serper_search",
      fn: () => serperSearch({ query: `${ideaSummary.slice(0, 60)} competitors market`, numResults: 5 }),
    });
  }

  if (process.env.YOUTUBE_API_KEY) {
    searches.push({
      tool: "youtube_search",
      fn: () => youtubeSearch({ query: ideaSummary.slice(0, 80), maxResults: 3 }),
    });
  }

  if (process.env.PERPLEXITY_API_KEY) {
    searches.push({
      tool: "perplexity_search",
      fn: () => perplexitySearch({ query: ideaSummary.slice(0, 100) }),
    });
  }

  // Run all searches in parallel
  emitEvent({ type: "status", payload: { message: "Researching your idea..." } });

  const searchResults = await Promise.allSettled(
    searches.map(async (s) => {
      emitEvent({ type: "tool_start", payload: { tool: s.tool } });
      const data = await s.fn();
      emitEvent({ type: "tool_done", payload: { tool: s.tool } });
      return { tool: s.tool, data };
    })
  );

  for (const r of searchResults) {
    if (r.status === "fulfilled") results.push(r.value);
  }

  // Scrape top 2 URLs from search results
  if (process.env.FIRECRAWL_API_KEY) {
    const urls: string[] = [];
    for (const r of results) {
      if (r.tool === "serper_search") {
        const data = r.data as { results?: { link: string }[] };
        for (const item of (data.results || []).slice(0, 1)) {
          if (item.link && urls.length < 2) urls.push(item.link);
        }
      }
    }

    if (urls.length > 0) {
      emitEvent({ type: "status", payload: { message: `Scraping ${urls.length} source${urls.length > 1 ? "s" : ""}...` } });
      const scrapeResults = await Promise.allSettled(
        urls.map(async (url) => {
          emitEvent({ type: "tool_start", payload: { tool: "firecrawl_scrape" } });
          const data = await firecrawlScrape({ url });
          emitEvent({ type: "tool_done", payload: { tool: "firecrawl_scrape" } });
          return { tool: "firecrawl_scrape", data };
        })
      );
      for (const r of scrapeResults) {
        if (r.status === "fulfilled") results.push(r.value);
      }
    }
  }

  return results;
}

function compressResearchData(results: ToolResult[]): string {
  const sections: string[] = [];

  for (const r of results) {
    if (r.tool === "serper_search") {
      const data = r.data as { results?: { title: string; link: string; snippet: string }[] };
      const items = (data.results || []).map((i) => `- [${i.title}](${i.link}): ${i.snippet}`).join("\n");
      sections.push(`## Web Search\n${items}`);
    }
    if (r.tool === "youtube_search") {
      const data = r.data as { videos?: { title: string; channelTitle: string; viewCount: string; videoId: string }[] };
      const items = (data.videos || []).map((v) =>
        `- **${v.title}** by ${v.channelTitle} (${Number(v.viewCount).toLocaleString()} views)`
      ).join("\n");
      sections.push(`## YouTube\n${items}`);
    }
    if (r.tool === "perplexity_search") {
      const data = r.data as { answer: string };
      sections.push(`## AI Overview\n${data.answer}`);
    }
    if (r.tool === "firecrawl_scrape") {
      const data = r.data as { markdown: string; metadata?: { title: string } };
      sections.push(`## Scraped: ${data.metadata?.title || "Page"}\n${data.markdown}`);
    }
  }

  return sections.join("\n\n---\n\n");
}

export async function generateVerdict(params: {
  ideaSummary: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  modelId?: string;
  savedToolResults?: ToolResult[] | null;
  emitEvent: EmitFn;
  saveToolResults?: (results: ToolResult[]) => Promise<void>;
}): Promise<{ verdict: Record<string, unknown>; toolResults: ToolResult[] }> {
  const { ideaSummary, conversationHistory, modelId, savedToolResults, emitEvent, saveToolResults } = params;

  // Pass 1: Research (zero Claude tokens) — skip if we have saved results
  let toolResults: ToolResult[];
  if (savedToolResults && savedToolResults.length > 0) {
    emitEvent({ type: "status", payload: { message: `Resuming — ${savedToolResults.length} tools already done` } });
    toolResults = savedToolResults;
  } else {
    toolResults = await gatherResearch(ideaSummary, emitEvent);
    // Save results to DB so retry skips this step
    if (saveToolResults) {
      await saveToolResults(toolResults).catch(() => {});
    }
  }

  // Pass 2: Generate verdict (one Claude call)
  emitEvent({ type: "status", payload: { message: "Analyzing and writing verdict..." } });

  const compressed = compressResearchData(toolResults);
  const context = conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n");

  const model = resolveModel(modelId);

  const retryGenerate = async (attempt = 1): Promise<string> => {
    try {
      const { text } = await generateText({
        model,
        system: CRITIC_VERDICT_PROMPT,
        maxTokens: 8000,
        messages: [
          {
            role: "user",
            content: `## Idea Context (from conversation)\n${context}\n\n## Idea Summary\n${ideaSummary}\n\n---\n\n## Research Data\n${compressed}`,
          },
        ],
      });
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes("rate limit") || msg.includes("429") || msg.includes("Overloaded") || msg.includes("overloaded") || msg.includes("ECONNRESET") || msg.includes("ETIMEDOUT") || msg.includes("ECONNREFUSED") || msg.includes("fetch failed") || msg.includes("network") || msg.includes("529");
      if (isRetryable && attempt <= 3) {
        const waitSec = attempt * 15;
        emitEvent({ type: "status", payload: { message: `Connection error — retrying in ${waitSec}s (${attempt}/3)...` } });
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        return retryGenerate(attempt + 1);
      }
      throw err;
    }
  };

  const text = await retryGenerate();

  // Parse verdict JSON
  let verdict: Record<string, unknown> = {};
  const jsonMatch = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
  if (jsonMatch) {
    try {
      verdict = JSON.parse(jsonMatch[1].trim());
    } catch {
      // Try repair
      const raw = jsonMatch[1].trim();
      const lastBrace = raw.lastIndexOf("}");
      if (lastBrace !== -1) {
        try { verdict = JSON.parse(raw.slice(0, lastBrace + 1)); } catch {}
      }
    }
  }

  if (!verdict.viabilityScore) {
    // Fallback — find any JSON
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try { verdict = JSON.parse(text.slice(start, end + 1)); } catch {}
    }
  }

  return { verdict, toolResults };
}
