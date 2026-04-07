import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { type LanguageModel } from "ai";
import { getModel } from "@/lib/models";

export function resolveModel(modelId: string): LanguageModel {
  const model = getModel(modelId);
  if (!model) {
    // Fallback to Claude Sonnet
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropic("claude-sonnet-4-6");
  }

  if (model.provider === "openai") {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai(model.modelId);
  }

  const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic(model.modelId);
}
