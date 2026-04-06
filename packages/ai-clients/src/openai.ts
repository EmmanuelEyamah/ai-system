import { createOpenAI } from "@ai-sdk/openai";

export function createOpenAIClient() {
  return createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}
