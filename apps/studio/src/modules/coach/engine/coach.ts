import { generateText, type LanguageModel } from "ai";
import { createAnthropicClient, createOpenAIClient } from "@ai-system/ai-clients";
import { getModel } from "@/lib/models";
import { PERSONA_PROMPTS, COACH_SYSTEM_PREFIX, AUTO_DETECT_PROMPT } from "./prompts";

function resolveModel(modelId?: string): LanguageModel {
  const resolved = modelId ? getModel(modelId) : undefined;
  if (resolved?.provider === "openai") {
    const openai = createOpenAIClient();
    return openai(resolved.modelId);
  }
  const anthropic = createAnthropicClient();
  return anthropic(resolved?.modelId || "claude-sonnet-4-6");
}

export type PersonaKey = "auto" | "spirituality" | "wealth" | "sales" | "communication" | "fitness" | "nutrition";

/**
 * Auto-detect which persona fits the user's message.
 */
async function detectPersona(message: string, modelId?: string): Promise<PersonaKey> {
  const model = resolveModel(modelId);
  try {
    const { text } = await generateText({
      model,
      maxTokens: 20,
      messages: [{ role: "user", content: AUTO_DETECT_PROMPT.replace("{MESSAGE}", message.slice(0, 200)) }],
    });
    const detected = text.trim().toLowerCase() as PersonaKey;
    if (PERSONA_PROMPTS[detected]) return detected;
    return "auto";
  } catch {
    return "auto";
  }
}

/**
 * Build the system prompt based on persona selection.
 * If "auto", detects from message. If multiple topics detected, blends.
 */
function buildSystemPrompt(persona: PersonaKey, detectedPersona?: PersonaKey): string {
  const activePersona = persona === "auto" ? (detectedPersona || "spirituality") : persona;

  // Check if message touches multiple domains — build a blended prompt
  const personaPrompt = PERSONA_PROMPTS[activePersona] || PERSONA_PROMPTS.spirituality;

  return `${COACH_SYSTEM_PREFIX}\n\nACTIVE PERSONA: ${activePersona.toUpperCase()}\n\n${personaPrompt}`;
}

/**
 * Main chat function for the coach.
 */
export async function chat(params: {
  userMessage: string;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  persona: PersonaKey;
  modelId?: string;
  images?: { data: string; mimeType: string }[];
}): Promise<{ response: string; detectedPersona: PersonaKey }> {
  const { userMessage, conversationHistory, persona, modelId, images } = params;
  const model = resolveModel(modelId);

  // Auto-detect persona if set to auto
  let detectedPersona: PersonaKey = persona;
  if (persona === "auto") {
    detectedPersona = await detectPersona(userMessage, modelId);
  }

  const systemPrompt = buildSystemPrompt(persona, detectedPersona);

  const recentHistory = conversationHistory.slice(-20).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  // Build user message — multimodal if images present
  if (images && images.length > 0) {
    const content: { type: string; [key: string]: unknown }[] = [];
    for (const img of images) {
      content.push({ type: "image", image: `data:${img.mimeType};base64,${img.data}` });
    }
    content.push({ type: "text", text: userMessage });
    recentHistory.push({ role: "user", content: content as never });
  } else {
    recentHistory.push({ role: "user", content: userMessage });
  }

  const retryChat = async (attempt = 1): Promise<string> => {
    try {
      const { text } = await generateText({
        model,
        system: systemPrompt,
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

  const response = await retryChat();
  return { response, detectedPersona };
}
