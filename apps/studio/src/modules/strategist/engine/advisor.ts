import { generateText, type LanguageModel } from "ai";
import { createAnthropicClient, createOpenAIClient } from "@ai-system/ai-clients";
import { getModel } from "@/lib/models";
import { STRATEGIST_PROMPT } from "./prompts";

function resolveModel(modelId?: string): LanguageModel {
  const resolved = modelId ? getModel(modelId) : undefined;
  if (resolved?.provider === "openai") {
    const openai = createOpenAIClient();
    return openai(resolved.modelId);
  }
  const anthropic = createAnthropicClient();
  return anthropic(resolved?.modelId || "claude-sonnet-4-6");
}

export async function chat(params: {
  userMessage: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  modelId?: string;
}): Promise<string> {
  const { userMessage, conversationHistory, modelId } = params;
  const model = resolveModel(modelId);

  // Keep last 20 messages for context but don't blow token budget
  const recentHistory = conversationHistory.slice(-20).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  recentHistory.push({ role: "user", content: userMessage });

  const retryChat = async (attempt = 1): Promise<string> => {
    try {
      const { text } = await generateText({
        model,
        system: STRATEGIST_PROMPT,
        maxTokens: 4000,
        messages: recentHistory,
      });
      return text;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable = msg.includes("rate limit") || msg.includes("429") || msg.includes("Overloaded") || msg.includes("ECONNRESET");
      if (isRetryable && attempt <= 3) {
        await new Promise((r) => setTimeout(r, attempt * 15_000));
        return retryChat(attempt + 1);
      }
      throw err;
    }
  };

  return retryChat();
}
