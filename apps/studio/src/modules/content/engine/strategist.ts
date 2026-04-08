import { generateText, type LanguageModel } from "ai";
import { createAnthropicClient, createOpenAIClient } from "@ai-system/ai-clients";
import { getModel } from "@/lib/models";
import { quickResearch } from "@/lib/auto-research";
import { CONTENT_STRATEGIST_PROMPT, CONTENT_GENERATOR_PROMPT, CONTENT_REPURPOSE_PROMPT, CONTENT_FEEDBACK_PROMPT } from "./prompts";

function resolveModel(modelId?: string): LanguageModel {
  const resolved = modelId ? getModel(modelId) : undefined;
  if (resolved?.provider === "openai") {
    const openai = createOpenAIClient();
    return openai(resolved.modelId);
  }
  const anthropic = createAnthropicClient();
  return anthropic(resolved?.modelId || "claude-sonnet-4-6");
}

const SUMMARY_DETECTED = "---READY---";

// --- Conversation phase ---
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
    system: CONTENT_STRATEGIST_PROMPT,
    messages,
    maxTokens: 1500,
  });

  const hasSummary = text.includes(SUMMARY_DETECTED);

  if (hasSummary) {
    const summaryMatch = text.match(/---SUMMARY---([\s\S]*?)---READY---/);
    const summary = summaryMatch ? summaryMatch[1].trim() : "";
    const beforeSummary = text.split("---SUMMARY---")[0].trim();
    const displayMessage = beforeSummary
      ? `${beforeSummary}\n\nHere's the content brief:\n\n${summary}`
      : `Here's the content brief:\n\n${summary}`;
    return { type: "summary", message: displayMessage, showConfirmButtons: true };
  }

  return { type: "chat", message: text, showConfirmButtons: false };
}

// --- Generate content (one Claude call) ---
export async function generateContent(params: {
  briefSummary: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  folderContext?: string;
  modelId?: string;
}): Promise<Record<string, unknown>> {
  const { briefSummary, conversationHistory, folderContext, modelId } = params;
  const model = resolveModel(modelId);

  const context = conversationHistory.map((m) => `${m.role}: ${m.content}`).join("\n");

  // Auto-research for better content
  let researchData = "";
  try {
    researchData = await quickResearch(briefSummary.slice(0, 100));
  } catch {}

  const userContent = [
    `## Content Brief\n${briefSummary}`,
    `## Conversation Context\n${context}`,
    folderContext ? `## Reference Data (from folders/research)\n${folderContext}` : "",
    researchData ? `## Auto-Research (live data)\n${researchData}` : "",
  ].filter(Boolean).join("\n\n---\n\n");

  const retryGenerate = async (attempt = 1): Promise<string> => {
    try {
      const { text } = await generateText({
        model,
        system: CONTENT_GENERATOR_PROMPT,
        maxTokens: 8000,
        messages: [{ role: "user", content: userContent }],
      });
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes("rate limit") || msg.includes("429") || msg.includes("Overloaded") || msg.includes("ECONNRESET");
      if (isRetryable && attempt <= 3) {
        await new Promise((r) => setTimeout(r, attempt * 15_000));
        return retryGenerate(attempt + 1);
      }
      throw err;
    }
  };

  const text = await retryGenerate();

  // Parse JSON
  let content: Record<string, unknown> = {};
  const jsonMatch = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
  if (jsonMatch) {
    try { content = JSON.parse(jsonMatch[1].trim()); } catch {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      if (start !== -1 && end > start) try { content = JSON.parse(text.slice(start, end + 1)); } catch {}
    }
  }
  if (!content.posts) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) try { content = JSON.parse(text.slice(start, end + 1)); } catch {}
  }

  return content;
}

// --- Repurpose a post for another platform ---
export async function repurposePost(params: {
  originalPost: Record<string, unknown>;
  targetPlatform: string;
  modelId?: string;
}): Promise<Record<string, unknown>> {
  const { originalPost, targetPlatform, modelId } = params;
  const model = resolveModel(modelId);

  const { text } = await generateText({
    model,
    system: CONTENT_REPURPOSE_PROMPT,
    maxTokens: 3000,
    messages: [{
      role: "user",
      content: `Original post:\n${JSON.stringify(originalPost, null, 2)}\n\nRepurpose for: ${targetPlatform}`,
    }],
  });

  let result: Record<string, unknown> = {};
  const jsonMatch = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
  if (jsonMatch) {
    try { result = JSON.parse(jsonMatch[1].trim()); } catch {}
  }
  if (!result.platform) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end > start) try { result = JSON.parse(text.slice(start, end + 1)); } catch {}
  }

  return result;
}

// --- Feedback analysis ---
export async function analyzeFeedback(params: {
  postContent: string;
  feedback: string;
  modelId?: string;
}): Promise<string> {
  const { postContent, feedback, modelId } = params;
  const model = resolveModel(modelId);

  const { text } = await generateText({
    model,
    system: CONTENT_FEEDBACK_PROMPT,
    maxTokens: 2000,
    messages: [{
      role: "user",
      content: `Post that was published:\n${postContent}\n\nPerformance feedback:\n${feedback}`,
    }],
  });

  return text;
}
