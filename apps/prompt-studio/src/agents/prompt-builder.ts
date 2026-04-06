import { generateText } from "ai";
import { PROMPT_BUILDER_SYSTEM_PROMPT, buildPromptBuilderPrompt } from "./prompts";
import { resolveModel } from "./model-resolver";
import type { PromptOutput } from "./types";

const JSON_INSTRUCTION = `

CRITICAL FORMATTING RULES:
1. Your entire response must be a raw JSON object
2. Do NOT wrap the JSON in quotes
3. Do NOT use markdown code fences
4. Do NOT escape quotes inside the JSON — use standard JSON formatting
5. Start your response with { and end with }

The JSON structure:
{
  "prompts": [
    {"variant": "best", "modelTarget": "universal", "content": "prompt text", "explanation": "why"},
    {"variant": "shorter", "modelTarget": "universal", "content": "prompt text", "explanation": "why"},
    {"variant": "advanced", "modelTarget": "universal", "content": "prompt text", "explanation": "why"},
    {"variant": "best", "modelTarget": "openai", "content": "prompt text", "explanation": "why"},
    {"variant": "best", "modelTarget": "claude", "content": "prompt text", "explanation": "why"}
  ]
}`;

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
    system: PROMPT_BUILDER_SYSTEM_PROMPT + JSON_INSTRUCTION,
    prompt,
  });

  console.log("[PromptBuilder] Raw length:", text.length);
  console.log("[PromptBuilder] Starts with:", text.charAt(0), "charCode:", text.charCodeAt(0));

  const parsed = extractJSON(text);
  console.log("[PromptBuilder] Parsed count:", parsed?.prompts?.length || 0);

  if (parsed?.prompts && Array.isArray(parsed.prompts) && parsed.prompts.length > 0) {
    const normalized = normalizePrompts(parsed.prompts);
    console.log("[PromptBuilder] Normalized count:", normalized.length);
    return normalized;
  }

  return [{
    variant: "best" as const,
    modelTarget: "universal" as const,
    content: text,
    explanation: "Generated as a single prompt.",
  }];
}

function normalizePrompts(prompts: { variant?: string; modelTarget?: string; content?: string; explanation?: string }[]): PromptOutput[] {
  const validVariants = ["best", "shorter", "advanced"];
  const validTargets = ["universal", "openai", "claude"];

  return prompts
    .filter((p) => p.content && p.content.length > 10)
    .map((p) => ({
      variant: (validVariants.includes(p.variant || "") ? p.variant : "best") as PromptOutput["variant"],
      modelTarget: (validTargets.includes(p.modelTarget || "") ? p.modelTarget : "universal") as PromptOutput["modelTarget"],
      content: p.content || "",
      explanation: p.explanation || "",
    }));
}

function extractJSON(raw: string): { prompts: { variant: string; modelTarget: string; content: string; explanation: string }[] } | null {
  let text = raw.trim();

  // Layer 1: If the entire string is a JSON-encoded string (starts with " or \"), unwrap it
  // This handles the AI SDK sometimes returning text as a JSON string literal
  for (let attempt = 0; attempt < 3; attempt++) {
    if (text.startsWith('"') || text.startsWith("'")) {
      try {
        text = JSON.parse(text);
        if (typeof text !== "string") {
          // We got an object directly
          if (text && typeof text === "object" && "prompts" in (text as object)) {
            return text as { prompts: { variant: string; modelTarget: string; content: string; explanation: string }[] };
          }
        }
        text = (text as string).trim();
      } catch {
        // Manual unwrap
        text = text.slice(1, -1);
        text = text.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
        text = text.trim();
      }
    } else {
      break;
    }
  }

  // Layer 2: Remove markdown code fences
  text = text.replace(/^```(?:json)?\s*\n?/gm, "").replace(/\n?\s*```\s*$/gm, "").trim();

  // Layer 3: Manual unescape if still has escaped quotes
  if (text.includes('\\"')) {
    const unescaped = text.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
    try {
      const result = JSON.parse(unescaped);
      if (result.prompts) return result;
    } catch {
      // continue with original
    }
  }

  // Layer 4: Direct parse
  try {
    const result = JSON.parse(text);
    if (result.prompts) return result;
  } catch {
    // continue
  }

  // Layer 5: Find the JSON object by brace matching
  const startPatterns = ['{"prompts"', '{ "prompts"', '{\n  "prompts"', '{\n"prompts"'];
  for (const pattern of startPatterns) {
    const idx = text.indexOf(pattern);
    if (idx !== -1) {
      const matched = braceMatch(text, idx);
      if (matched) return matched;
    }
  }

  // Layer 6: Extract "prompts" array directly
  const arrayIdx = text.indexOf('"prompts"');
  if (arrayIdx !== -1) {
    const bracketIdx = text.indexOf("[", arrayIdx);
    if (bracketIdx !== -1) {
      const arr = bracketMatch(text, bracketIdx);
      if (arr) {
        try {
          const parsed = JSON.parse(arr);
          if (Array.isArray(parsed)) return { prompts: parsed };
        } catch {
          // continue
        }
      }
    }
  }

  console.log("[PromptBuilder] All extraction attempts failed");
  console.log("[PromptBuilder] Text starts with:", JSON.stringify(text.substring(0, 80)));
  return null;
}

function braceMatch(text: string, startIdx: number): { prompts: { variant: string; modelTarget: string; content: string; explanation: string }[] } | null {
  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    if (text[i] === "{") depth++;
    if (text[i] === "}") depth--;
    if (depth === 0) {
      const substr = text.substring(startIdx, i + 1);
      try {
        const result = JSON.parse(substr);
        if (result.prompts) return result;
      } catch {
        // Try unescaping
        try {
          const unescaped = substr.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\');
          const result = JSON.parse(unescaped);
          if (result.prompts) return result;
        } catch {
          // give up on this match
        }
      }
      break;
    }
  }
  return null;
}

function bracketMatch(text: string, startIdx: number): string | null {
  let depth = 0;
  for (let i = startIdx; i < text.length; i++) {
    if (text[i] === "[") depth++;
    if (text[i] === "]") depth--;
    if (depth === 0) {
      return text.substring(startIdx, i + 1);
    }
  }
  return null;
}
