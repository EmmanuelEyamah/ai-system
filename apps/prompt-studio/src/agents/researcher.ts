import { generateText } from "ai";
import { RESEARCHER_SYSTEM_PROMPT, buildResearcherPrompt } from "./prompts";
import { resolveModel } from "./model-resolver";
import type { AgentResult } from "./types";

export async function research(
  userInput: string,
  taskType: string,
  modelId: string
): Promise<AgentResult> {
  const model = resolveModel(modelId);

  const { text } = await generateText({
    model,
    system: RESEARCHER_SYSTEM_PROMPT,
    prompt: buildResearcherPrompt(userInput, taskType),
  });

  return {
    agent: "researcher",
    content: text,
  };
}
