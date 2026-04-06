import { generateObject, generateText } from "ai";
import { z } from "zod";
import { ANALYZER_SYSTEM_PROMPT, buildAnalyzerPrompt } from "./prompts";
import { resolveModel } from "./model-resolver";
import type { AnalysisResult } from "./types";

const analysisSchema = z.object({
  taskType: z.string(),
  confidence: z.number(),
  contextGaps: z.array(z.string()),
  clarifyingQuestions: z.array(z.string()),
  summary: z.string(),
});

const VALID_TASK_TYPES = [
  "writing", "coding", "research", "analysis", "marketing",
  "support", "image-generation", "automation", "summarization",
  "creative", "general",
];

export async function analyze(
  userInput: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  modelId: string
): Promise<AnalysisResult> {
  const model = resolveModel(modelId);

  const historyText = conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  try {
    const { object } = await generateObject({
      model,
      system: ANALYZER_SYSTEM_PROMPT,
      prompt: buildAnalyzerPrompt(userInput, historyText),
      schema: analysisSchema,
    });

    return {
      agent: "analyzer",
      content: object.summary,
      taskType: VALID_TASK_TYPES.includes(object.taskType) ? object.taskType as AnalysisResult["taskType"] : "general",
      confidence: Math.min(1, Math.max(0, object.confidence)),
      contextGaps: object.contextGaps || [],
      clarifyingQuestions: (object.clarifyingQuestions || []).slice(0, 3),
    };
  } catch {
    // Fallback: use generateText and parse
    const { text } = await generateText({
      model,
      system: ANALYZER_SYSTEM_PROMPT + "\n\nReturn your analysis as JSON with: taskType, confidence (0-1), contextGaps (array), clarifyingQuestions (array, max 3), summary.",
      prompt: buildAnalyzerPrompt(userInput, historyText),
    });

    try {
      const parsed = JSON.parse(text.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      return {
        agent: "analyzer",
        content: parsed.summary || "Analysis complete.",
        taskType: VALID_TASK_TYPES.includes(parsed.taskType) ? parsed.taskType : "general",
        confidence: parsed.confidence || 0.5,
        contextGaps: parsed.contextGaps || [],
        clarifyingQuestions: (parsed.clarifyingQuestions || []).slice(0, 3),
      };
    } catch {
      // Last resort: skip analysis, go straight to build
      return {
        agent: "analyzer",
        content: "Proceeding with prompt generation.",
        taskType: "general",
        confidence: 0.9,
        contextGaps: [],
        clarifyingQuestions: [],
      };
    }
  }
}
