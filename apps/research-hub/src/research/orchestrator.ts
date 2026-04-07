import { generateText, type LanguageModel } from "ai";
import { createAnthropicClient, createOpenAIClient } from "@ai-system/ai-clients";
import { getAvailableTools } from "./tool-registry";
import { RESEARCH_SYSTEM_PROMPT, FOLLOW_UP_SYSTEM_PROMPT } from "./prompts";
import { getModel } from "@/lib/models";
import type { ResearchReport, ResearchSSEEvent, ReportSection } from "@ai-system/shared-types";

type EmitFn = (event: ResearchSSEEvent) => void;

export function resolveResearchModel(modelId?: string): LanguageModel {
  const resolved = modelId ? getModel(modelId) : undefined;

  if (resolved?.provider === "openai") {
    const openai = createOpenAIClient();
    return openai(resolved.modelId);
  }

  // Default to Anthropic
  const anthropic = createAnthropicClient();
  return anthropic(resolved?.modelId || "claude-sonnet-4-6");
}

export async function orchestrateResearch(params: {
  query: string;
  sessionId: string;
  modelId?: string;
  emitEvent: EmitFn;
}): Promise<ResearchReport> {
  const { query, sessionId, modelId, emitEvent } = params;
  const model = resolveResearchModel(modelId);

  emitEvent({ type: "status", payload: { message: "Starting research..." } });

  const tools = getAvailableTools();

  const runGenerate = async (attempt = 1): Promise<{ text: string; steps: any[] }> => {
    try {
      return await generateText({
        model,
        system: RESEARCH_SYSTEM_PROMPT,
        maxTokens: 8000,
        messages: [
          {
            role: "user",
            content: `Research this topic and produce a structured report:\n\n${query}`,
          },
        ],
        tools,
        maxSteps: 6,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onStepFinish: ({ toolCalls, toolResults }: any) => {
          if (toolCalls) {
            for (const call of toolCalls) {
              emitEvent({
                type: "tool_start",
                payload: {
                  tool: call.toolName,
                  query: JSON.stringify(call.args).slice(0, 100),
                },
              });
            }
          }
          if (toolResults) {
            for (const result of toolResults) {
              emitEvent({
                type: "tool_done",
                payload: {
                  tool: result.toolName,
                  durationMs: 0,
                  resultPreview: JSON.stringify(result.result).slice(0, 150),
                },
              });
            }
          }
        },
      }) as { text: string; steps: any[] };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes("rate limit") || msg.includes("429") || msg.includes("Overloaded") || msg.includes("529") || msg.includes("overloaded");

      if (isRetryable && attempt <= 3) {
        const waitSec = attempt * 15;
        emitEvent({
          type: "status",
          payload: { message: `API busy — retrying in ${waitSec}s (attempt ${attempt}/3)...` },
        });
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        return runGenerate(attempt + 1);
      }
      throw err;
    }
  };

  const { text, steps } = await runGenerate();

  emitEvent({ type: "status", payload: { message: "Synthesizing research into structured report..." } });

  const report = parseReport(text, query);

  // Track which tools were used
  const toolsUsed = new Set<string>();
  for (const step of steps as any[]) {
    if (step.toolCalls) {
      for (const call of step.toolCalls) {
        toolsUsed.add(call.toolName);
      }
    }
  }

  return report;
}

export async function handleFollowUp(params: {
  question: string;
  existingReport: ResearchReport;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  modelId?: string;
}): Promise<string> {
  const { question, existingReport, conversationHistory, modelId } = params;
  const model = resolveResearchModel(modelId);

  // Compress report context — send section titles + first 100 chars of each, not full content
  const reportSummary = existingReport.sections
    .map((s) => `- **${s.title}**: ${s.content.slice(0, 100).replace(/\n/g, " ")}...`)
    .join("\n");
  const reportContext = `Research on: "${existingReport.query}"\n\nSummary: ${existingReport.summary}\n\nSections:\n${reportSummary}`;

  // Only include last 4 messages to keep context tight
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

function buildReport(parsed: Record<string, unknown>, query: string): ResearchReport {
  const sections = Array.isArray(parsed.sections) ? parsed.sections : [];
  return {
    query,
    summary: typeof parsed.summary === "string" ? parsed.summary : "",
    sections: sections
      .filter((s: Record<string, unknown>) => s && typeof s.content === "string" && s.content.length > 20)
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
  // Try as-is first
  try {
    return JSON.parse(jsonStr);
  } catch {
    // ignore
  }

  // JSON might be truncated — try to repair by closing open structures
  // Find the last complete section object (ends with })
  const lastCompleteSection = jsonStr.lastIndexOf("}");
  if (lastCompleteSection === -1) return null;

  const trimmed = jsonStr.slice(0, lastCompleteSection + 1);

  // Try closing the sections array and root object
  const repairs = [
    trimmed + "]}",      // close sections array + root
    trimmed + "\n]}",
    trimmed + "\n]\n}",
    trimmed,             // maybe it's already complete
  ];

  for (const attempt of repairs) {
    try {
      return JSON.parse(attempt);
    } catch {
      // try next
    }
  }

  return null;
}

function extractJSON(text: string): string | null {
  // Strategy 1: Find ```json ... ``` code fence
  const fenceStart = text.indexOf("```json");
  if (fenceStart !== -1) {
    const jsonStart = text.indexOf("\n", fenceStart) + 1;
    const fenceEnd = text.indexOf("```", jsonStart);
    // If closing fence found, use it; otherwise take everything after ```json
    const jsonStr = fenceEnd !== -1
      ? text.slice(jsonStart, fenceEnd)
      : text.slice(jsonStart);
    return jsonStr.trim();
  }

  // Strategy 2: Find {"summary" pattern
  const summaryStart = text.search(/\{\s*"summary"/);
  if (summaryStart !== -1) {
    return text.slice(summaryStart).trim();
  }

  // Strategy 3: Find first { that looks like JSON
  const braceStart = text.indexOf("{");
  if (braceStart !== -1) {
    return text.slice(braceStart).trim();
  }

  return null;
}

function parseReport(text: string, query: string): ResearchReport {
  const jsonStr = extractJSON(text);

  if (jsonStr) {
    const parsed = tryParseJSON(jsonStr);
    if (parsed && (parsed.summary || parsed.sections)) {
      return buildReport(parsed, query);
    }
  }

  // Fallback: treat the text as markdown content (strip JSON fragments)
  const cleanText = text
    .replace(/```json[\s\S]*?(?:```|$)/g, "")
    .replace(/^\s*(Excellent|Great|Perfect|Let me|I now have).*$/gm, "")
    .trim();

  return {
    query,
    summary: "",
    sections: [
      {
        id: "full_report",
        title: "Research Report",
        content: cleanText || text,
        sources: [],
        order: 1,
      },
    ],
    generatedAt: new Date().toISOString(),
  };
}
