import { streamText, generateObject, type LanguageModel } from "ai";
import { type ZodSchema } from "zod";

export async function streamAgentResponse({
  model,
  system,
  messages,
}: {
  model: LanguageModel;
  system: string;
  messages: { role: "user" | "assistant" | "system"; content: string }[];
}) {
  return streamText({
    model,
    system,
    messages,
  });
}

export async function generateAgentObject<T>({
  model,
  system,
  prompt,
  schema,
}: {
  model: LanguageModel;
  system: string;
  prompt: string;
  schema: ZodSchema<T>;
}) {
  return generateObject({
    model,
    system,
    prompt,
    schema,
  });
}
