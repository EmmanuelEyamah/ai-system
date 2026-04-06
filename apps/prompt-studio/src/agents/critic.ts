import { generateText } from "ai";
import { CRITIC_SYSTEM_PROMPT, buildCriticPrompt } from "./prompts";
import { resolveModel } from "./model-resolver";
import type { PromptOutput, CriticResult } from "./types";

const JSON_INSTRUCTION = `

CRITICAL: Respond with ONLY a valid JSON object. No markdown, no code fences.

The JSON must have this structure:
{
  "overallFeedback": "your overall assessment",
  "overallScore": 8.5,
  "recommendation": "which prompt to use and why",
  "prompts": [
    {
      "variant": "best",
      "modelTarget": "universal",
      "content": "the improved prompt text",
      "explanation": "what was improved",
      "score": 8.5
    }
  ]
}

Output ONLY the JSON object.`;

export async function critique(
  prompts: PromptOutput[],
  modelId: string
): Promise<CriticResult> {
  const model = resolveModel(modelId);

  const promptsText = prompts
    .map(
      (p, i) =>
        `--- Prompt ${i + 1} ---\nVariant: ${p.variant}\nTarget: ${p.modelTarget}\n\n${p.content}\n\nExplanation: ${p.explanation}`
    )
    .join("\n\n");

  try {
    const { text } = await generateText({
      model,
      system: CRITIC_SYSTEM_PROMPT + JSON_INSTRUCTION,
      prompt: buildCriticPrompt(promptsText),
    });

    const parsed = extractJSON(text);

    if (parsed && parsed.prompts && parsed.prompts.length > 0) {
      return {
        agent: "critic",
        content: parsed.recommendation || "Use the highest-scored prompt variant.",
        feedback: parsed.overallFeedback || "Review complete.",
        overallScore: parsed.overallScore || 7.5,
        prompts: parsed.prompts.map((p: { variant?: string; modelTarget?: string; content?: string; explanation?: string; score?: number }) => ({
          variant: (p.variant || "best") as PromptOutput["variant"],
          modelTarget: (p.modelTarget || "universal") as PromptOutput["modelTarget"],
          content: p.content || "",
          explanation: p.explanation || "",
          score: p.score || 7.5,
        })),
      };
    }
  } catch (err) {
    console.error("Critic error:", err);
  }

  // Fallback: return prompts as-is with default scores
  return {
    agent: "critic",
    content: "Use the 'Best Prompt' variant for the most reliable results.",
    feedback: "Prompts generated successfully.",
    overallScore: 7.5,
    prompts: prompts.map((p) => ({
      ...p,
      score: 7.5,
    })),
  };
}

function extractJSON(text: string): { overallFeedback?: string; overallScore?: number; recommendation?: string; prompts?: { variant: string; modelTarget: string; content: string; explanation: string; score: number }[] } | null {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/gm, "").replace(/\n?```$/gm, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try finding JSON object
    const startIdx = cleaned.indexOf("{");
    if (startIdx !== -1) {
      let depth = 0;
      for (let i = startIdx; i < cleaned.length; i++) {
        if (cleaned[i] === "{") depth++;
        if (cleaned[i] === "}") depth--;
        if (depth === 0) {
          try {
            return JSON.parse(cleaned.substring(startIdx, i + 1));
          } catch {
            break;
          }
        }
      }
    }
    return null;
  }
}
