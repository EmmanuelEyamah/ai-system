import { generateText } from "ai";
import { PROMPT_BUILDER_SYSTEM_PROMPT, buildPromptBuilderPrompt } from "./prompts";
import { resolveModel } from "./model-resolver";
import type { PromptOutput } from "./types";

const FORMAT_INSTRUCTION = `

OUTPUT FORMAT — FOLLOW EXACTLY:
Respond with 5 prompt variants separated by the delimiter ===PROMPT=== on its own line.

For each prompt, use this header format on the first line:
[variant] [target]

Where variant is: best, shorter, or advanced
Where target is: universal, openai, or claude

Then the prompt text follows. Then ===EXPLANATION=== on its own line, followed by a one-line explanation.

Example structure:

best universal
(prompt text here)
===EXPLANATION===
(one line explanation)
===PROMPT===
shorter universal
(prompt text here)
===EXPLANATION===
(one line explanation)
===PROMPT===
advanced universal
(prompt text here)
===EXPLANATION===
(one line explanation)
===PROMPT===
best openai
(prompt text here)
===EXPLANATION===
(one line explanation)
===PROMPT===
best claude
(prompt text here)
===EXPLANATION===
(one line explanation)

Generate all 5 variants. Each prompt must be genuinely different and optimized for its target.`;

export async function buildPrompts(
  userInput: string,
  taskType: string,
  clarifications: string,
  researchData: string,
  modelId: string
): Promise<PromptOutput[]> {
  const model = resolveModel(modelId);
  const prompt = buildPromptBuilderPrompt(userInput, taskType, clarifications, researchData);

  const { text } = await generateText({
    model,
    system: PROMPT_BUILDER_SYSTEM_PROMPT + FORMAT_INSTRUCTION,
    prompt,
  });

  const prompts = parseDelimitedResponse(text);
  console.log("[PromptBuilder] Parsed", prompts.length, "variants");

  if (prompts.length > 0) return prompts;

  // Fallback: return as single prompt
  return [{
    variant: "best",
    modelTarget: "universal",
    content: text.trim(),
    explanation: "Universal prompt variant.",
  }];
}

function parseDelimitedResponse(text: string): PromptOutput[] {
  const validVariants = ["best", "shorter", "advanced"];
  const validTargets = ["universal", "openai", "claude"];
  const prompts: PromptOutput[] = [];

  // Split by the delimiter
  const blocks = text.split("===PROMPT===").map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const explanationSplit = block.split("===EXPLANATION===");
    const mainPart = explanationSplit[0].trim();
    const explanation = explanationSplit[1]?.trim() || "";

    // First line should be "variant target"
    const lines = mainPart.split("\n");
    const headerLine = lines[0].trim().toLowerCase();
    const content = lines.slice(1).join("\n").trim();

    if (!content || content.length < 20) continue;

    // Parse header
    let variant = "best";
    let modelTarget = "universal";

    for (const v of validVariants) {
      if (headerLine.includes(v)) { variant = v; break; }
    }
    for (const t of validTargets) {
      if (headerLine.includes(t)) { modelTarget = t; break; }
    }

    prompts.push({
      variant: variant as PromptOutput["variant"],
      modelTarget: modelTarget as PromptOutput["modelTarget"],
      content,
      explanation,
    });
  }

  return prompts;
}
