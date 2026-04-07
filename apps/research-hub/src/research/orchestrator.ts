import { generateText, type LanguageModel } from "ai";
import { createAnthropicClient, createOpenAIClient } from "@ai-system/ai-clients";
import { REPORT_WRITER_PROMPT, PLANNER_PROMPT, FOLLOW_UP_SYSTEM_PROMPT } from "./prompts";
import { getModel } from "@/lib/models";
import { perplexitySearch } from "./tools/perplexity-search";
import { serperSearch } from "./tools/serper-search";
import { serpApiSearch } from "./tools/serpapi-search";
import { youtubeSearch } from "./tools/youtube-search";
import { firecrawlScrape } from "./tools/firecrawl-scrape";
import { apifyActorRun } from "./tools/apify-actor";
import { getAvailableTools } from "./tool-registry";
import type { ResearchReport, ResearchSSEEvent, ReportSection } from "@ai-system/shared-types";

type EmitFn = (event: ResearchSSEEvent) => void;

export function resolveResearchModel(modelId?: string): LanguageModel {
  const resolved = modelId ? getModel(modelId) : undefined;
  if (resolved?.provider === "openai") {
    const openai = createOpenAIClient();
    return openai(resolved.modelId);
  }
  const anthropic = createAnthropicClient();
  return anthropic(resolved?.modelId || "claude-sonnet-4-6");
}

// ---- Types for tool results ----

interface ToolResultEntry {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
  status: "success" | "error";
  error?: string;
}

interface SavedToolData {
  results: ToolResultEntry[];
  completedAt: string;
}

// ---- Pass 1: Plan which tools to call ----

interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
}

async function planToolCalls(query: string, modelId?: string): Promise<ToolCall[]> {
  const model = resolveResearchModel(modelId);
  const availableToolNames = Object.keys(getAvailableTools());

  const { text } = await generateText({
    model,
    maxTokens: 1000,
    system: PLANNER_PROMPT,
    messages: [
      {
        role: "user",
        content: `Available tools: ${availableToolNames.join(", ")}\n\nQuery: ${query}`,
      },
    ],
  });

  // Parse the tool calls from Claude's response
  try {
    const jsonStr = text.match(/\[[\s\S]*\]/)?.[0];
    if (jsonStr) {
      const calls = JSON.parse(jsonStr) as ToolCall[];
      // Filter to only available tools
      return calls.filter((c) => availableToolNames.includes(c.tool));
    }
  } catch {
    // Fallback
  }

  // Default plan if parsing fails
  const plan: ToolCall[] = [];
  if (availableToolNames.includes("serper_search")) {
    plan.push({ tool: "serper_search", args: { query } });
    plan.push({ tool: "serper_search", args: { query: `${query} competitors trends 2026` } });
  }
  if (availableToolNames.includes("youtube_search")) {
    plan.push({ tool: "youtube_search", args: { query } });
  }
  return plan;
}

// ---- Pass 1: Execute tools (no Claude, just fetch calls) ----

type ToolExecutor = (args: Record<string, unknown>) => Promise<unknown>;

const toolExecutors: Record<string, { executor: ToolExecutor; envKey: string }> = {
  perplexity_search: {
    executor: (args) => perplexitySearch(args as { query: string; focus?: "internet" | "academic" | "news" }),
    envKey: "PERPLEXITY_API_KEY",
  },
  serper_search: {
    executor: (args) => serperSearch(args as { query: string; numResults?: number }),
    envKey: "SERPER_API_KEY",
  },
  serpapi_search: {
    executor: (args) => serpApiSearch(args as { query: string; numResults?: number }),
    envKey: "SERPAPI_API_KEY",
  },
  youtube_search: {
    executor: (args) => youtubeSearch(args as { query: string; maxResults?: number }),
    envKey: "YOUTUBE_API_KEY",
  },
  firecrawl_scrape: {
    executor: (args) => firecrawlScrape(args as { url: string }),
    envKey: "FIRECRAWL_API_KEY",
  },
  apify_actor_run: {
    executor: (args) => apifyActorRun(args as { actorId: string; input: Record<string, unknown> }),
    envKey: "APIFY_API_KEY",
  },
};

async function executeToolCall(
  call: ToolCall,
  emitEvent: EmitFn
): Promise<ToolResultEntry> {
  const entry = toolExecutors[call.tool];
  if (!entry || !process.env[entry.envKey]) {
    return { tool: call.tool, args: call.args, result: null, status: "error", error: "Tool not available" };
  }

  emitEvent({
    type: "tool_start",
    payload: { tool: call.tool as never, query: JSON.stringify(call.args).slice(0, 100) },
  });

  const start = Date.now();
  try {
    const result = await entry.executor(call.args);
    const durationMs = Date.now() - start;

    emitEvent({
      type: "tool_done",
      payload: {
        tool: call.tool as never,
        durationMs,
        resultPreview: JSON.stringify(result).slice(0, 150),
      },
    });

    return { tool: call.tool, args: call.args, result, status: "success" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    emitEvent({
      type: "tool_error",
      payload: { tool: call.tool as never, error },
    });
    return { tool: call.tool, args: call.args, result: null, status: "error", error };
  }
}

// Execute tools — run in batches of parallel calls
async function executeTools(
  calls: ToolCall[],
  existingResults: ToolResultEntry[],
  emitEvent: EmitFn
): Promise<ToolResultEntry[]> {
  const results = [...existingResults];

  // Skip tools that already succeeded
  const completedKeys = new Set(
    existingResults
      .filter((r) => r.status === "success")
      .map((r) => `${r.tool}:${JSON.stringify(r.args)}`)
  );

  const pendingCalls = calls.filter(
    (c) => !completedKeys.has(`${c.tool}:${JSON.stringify(c.args)}`)
  );

  if (pendingCalls.length === 0) {
    emitEvent({ type: "status", payload: { message: "All tools already completed, writing report..." } });
    return results;
  }

  emitEvent({
    type: "status",
    payload: { message: `Running ${pendingCalls.length} tool${pendingCalls.length > 1 ? "s" : ""}...` },
  });

  // Run all pending tools in parallel
  const newResults = await Promise.all(
    pendingCalls.map((call) => executeToolCall(call, emitEvent))
  );

  results.push(...newResults);

  // Check if any search results have URLs worth scraping
  const scrapeCalls: ToolCall[] = [];
  if (process.env.FIRECRAWL_API_KEY) {
    for (const r of newResults) {
      if (r.status === "success" && r.tool === "serper_search") {
        const data = r.result as { results?: { link: string }[] };
        const urls = (data.results || [])
          .slice(0, 2)
          .map((item) => item.link)
          .filter(Boolean);
        for (const url of urls) {
          const key = `firecrawl_scrape:${JSON.stringify({ url })}`;
          if (!completedKeys.has(key) && scrapeCalls.length < 3) {
            scrapeCalls.push({ tool: "firecrawl_scrape", args: { url } });
          }
        }
      }
    }
  }

  if (scrapeCalls.length > 0) {
    emitEvent({
      type: "status",
      payload: { message: `Scraping ${scrapeCalls.length} page${scrapeCalls.length > 1 ? "s" : ""} for details...` },
    });
    const scrapeResults = await Promise.all(
      scrapeCalls.map((call) => executeToolCall(call, emitEvent))
    );
    results.push(...scrapeResults);
  }

  return results;
}

// ---- Pass 2: Write report from collected data (one Claude call) ----

function compressToolData(results: ToolResultEntry[]): string {
  const sections: string[] = [];

  for (const r of results) {
    if (r.status !== "success" || !r.result) continue;

    if (r.tool === "serper_search") {
      const data = r.result as { results?: { title: string; link: string; snippet: string }[] };
      const items = (data.results || []).map((item) =>
        `- [${item.title}](${item.link}): ${item.snippet}`
      ).join("\n");
      sections.push(`## Web Search: "${(r.args as { query: string }).query}"\n${items}`);
    }

    if (r.tool === "serpapi_search") {
      const data = r.result as { results?: { title: string; link: string; snippet: string }[] };
      const items = (data.results || []).map((item) =>
        `- [${item.title}](${item.link}): ${item.snippet}`
      ).join("\n");
      sections.push(`## Web Search (SerpAPI): "${(r.args as { query: string }).query}"\n${items}`);
    }

    if (r.tool === "perplexity_search") {
      const data = r.result as { answer: string; citations?: { url: string; title: string }[] };
      sections.push(`## AI Search: "${(r.args as { query: string }).query}"\n${data.answer}`);
    }

    if (r.tool === "youtube_search") {
      const data = r.result as { videos?: { title: string; channelTitle: string; viewCount: string; videoId: string; description: string }[] };
      const items = (data.videos || []).map((v) =>
        `- **${v.title}** by ${v.channelTitle} (${Number(v.viewCount).toLocaleString()} views) — https://youtube.com/watch?v=${v.videoId}\n  ${v.description}`
      ).join("\n");
      sections.push(`## YouTube Videos\n${items}`);
    }

    if (r.tool === "firecrawl_scrape") {
      const data = r.result as { markdown: string; metadata?: { title: string } };
      const title = data.metadata?.title || (r.args as { url: string }).url;
      sections.push(`## Scraped: ${title}\n${data.markdown}`);
    }

    if (r.tool === "apify_actor_run") {
      const data = r.result as { items?: unknown[] };
      sections.push(`## Apify Data\n${JSON.stringify(data.items?.slice(0, 5), null, 2)}`);
    }
  }

  return sections.join("\n\n---\n\n");
}

async function writeReport(
  query: string,
  toolData: string,
  modelId?: string
): Promise<{ text: string }> {
  const model = resolveResearchModel(modelId);

  const retryWrite = async (attempt = 1): Promise<{ text: string }> => {
    try {
      return await generateText({
        model,
        system: REPORT_WRITER_PROMPT,
        maxTokens: 8000,
        messages: [
          {
            role: "user",
            content: `Query: ${query}\n\n---\n\nResearch Data:\n\n${toolData}`,
          },
        ],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes("rate limit") || msg.includes("429") || msg.includes("Overloaded") || msg.includes("529") || msg.includes("overloaded");
      if (isRetryable && attempt <= 3) {
        await new Promise((r) => setTimeout(r, attempt * 20_000));
        return retryWrite(attempt + 1);
      }
      throw err;
    }
  };

  return retryWrite();
}

// ---- Main orchestrator ----

export async function orchestrateResearch(params: {
  query: string;
  sessionId: string;
  modelId?: string;
  savedToolData?: SavedToolData | null;
  emitEvent: EmitFn;
  saveToolResults?: (data: SavedToolData) => Promise<void>;
}): Promise<{ report: ResearchReport; toolData: SavedToolData }> {
  const { query, sessionId, modelId, savedToolData, emitEvent, saveToolResults } = params;

  // --- Pass 1: Plan + Execute Tools ---
  const existingResults = savedToolData?.results || [];

  if (existingResults.length > 0) {
    emitEvent({
      type: "status",
      payload: { message: `Resuming — ${existingResults.filter((r) => r.status === "success").length} tools already done` },
    });
  }

  emitEvent({ type: "status", payload: { message: "Planning research strategy..." } });

  // Ask Claude what tools to call (tiny call, ~1k tokens)
  const toolCalls = await planToolCalls(query, modelId);

  // Execute tools (NO Claude involved, just API calls)
  const allResults = await executeTools(toolCalls, existingResults, emitEvent);

  const toolDataObj: SavedToolData = {
    results: allResults,
    completedAt: new Date().toISOString(),
  };

  // Save tool results to DB so retry can resume
  if (saveToolResults) {
    await saveToolResults(toolDataObj).catch(() => {});
  }

  // --- Pass 2: Write Report (ONE Claude call) ---
  emitEvent({ type: "status", payload: { message: "Writing report from research data..." } });

  const compressed = compressToolData(allResults);
  const { text } = await writeReport(query, compressed, modelId);
  const report = parseReport(text, query);

  return { report, toolData: toolDataObj };
}

// ---- Follow-up ----

export async function handleFollowUp(params: {
  question: string;
  existingReport: ResearchReport;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  modelId?: string;
}): Promise<string> {
  const { question, existingReport, conversationHistory, modelId } = params;
  const model = resolveResearchModel(modelId);

  const reportSummary = existingReport.sections
    .map((s) => `- **${s.title}**: ${s.content.slice(0, 100).replace(/\n/g, " ")}...`)
    .join("\n");
  const reportContext = `Research on: "${existingReport.query}"\n\nSummary: ${existingReport.summary}\n\nSections:\n${reportSummary}`;

  const recentHistory = conversationHistory.slice(-4);

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: reportContext },
    ...recentHistory,
    { role: "user", content: question },
  ];

  const { text } = await generateText({
    model,
    system: FOLLOW_UP_SYSTEM_PROMPT,
    maxTokens: 4000,
    messages,
    tools: getAvailableTools(),
    maxSteps: 2,
  });

  return text;
}

// ---- Report Parsing (unchanged) ----

function buildReport(parsed: Record<string, unknown>, query: string): ResearchReport {
  const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
  return {
    query,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    sections: sections
      .filter((s: Record<string, unknown>) => s && typeof s.content === "string" && (s.content as string).length > 20)
      .map((s: Record<string, unknown>, i: number) => ({
        id: (s.id as string) || `section_${i}`,
        title: (s.title as string) || `Section ${i + 1}`,
        content: s.content as string,
        sources: Array.isArray(s.sources) ? s.sources : [],
        order: typeof s.order === "number" ? s.order : i + 1,
      })),
    generatedAt: new Date().toISOString(),
  };
}

function tryParseJSON(jsonStr: string): Record<string, unknown> | null {
  try { return JSON.parse(jsonStr); } catch {}
  const lastBrace = jsonStr.lastIndexOf("}");
  if (lastBrace === -1) return null;
  const trimmed = jsonStr.slice(0, lastBrace + 1);
  for (const fix of [trimmed + "]}", trimmed + "\n]}", trimmed]) {
    try { return JSON.parse(fix); } catch {}
  }
  return null;
}

function extractJSON(text: string): string | null {
  const fenceStart = text.indexOf("```json");
  if (fenceStart !== -1) {
    const jsonStart = text.indexOf("\n", fenceStart) + 1;
    const fenceEnd = text.indexOf("```", jsonStart);
    return (fenceEnd !== -1 ? text.slice(jsonStart, fenceEnd) : text.slice(jsonStart)).trim();
  }
  const summaryStart = text.search(/\{\s*"summary"/);
  if (summaryStart !== -1) return text.slice(summaryStart).trim();
  const braceStart = text.indexOf("{");
  if (braceStart !== -1) return text.slice(braceStart).trim();
  return null;
}

function parseReport(text: string, query: string): ResearchReport {
  const jsonStr = extractJSON(text);
  if (jsonStr) {
    const parsed = tryParseJSON(jsonStr);
    if (parsed && (parsed.summary || parsed.sections)) return buildReport(parsed, query);
  }
  const cleanText = text
    .replace(/```json[\s\S]*?(?:```|$)/g, "")
    .replace(/^\s*(Excellent|Great|Perfect|Let me|I now have).*$/gm, "")
    .trim();
  return {
    query, summary: "",
    sections: [{ id: "full_report", title: "Research Report", content: cleanText || text, sources: [], order: 1 }],
    generatedAt: new Date().toISOString(),
  };
}
