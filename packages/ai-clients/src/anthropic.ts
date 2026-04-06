import { createAnthropic } from "@ai-sdk/anthropic";

export function createAnthropicClient() {
  return createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}
