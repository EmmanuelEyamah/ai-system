import { generateText } from "ai";
import { buildPrompts } from "./prompt-builder";
import { critique } from "./critic";
import { resolveModel } from "./model-resolver";
import type { OrchestratorParams, OrchestratorResult } from "./types";

export interface ModelConfig {
  analysisModel: string;
  generationModel: string;
}

const CONVERSATION_SYSTEM_PROMPT = `You are the world's best prompt engineer — the person OpenAI and Anthropic call when they need a perfect prompt. You've written prompts for Fortune 500 companies, trained teams at Google and Meta, and your prompt frameworks have been used to build products that generate millions in revenue. You think in systems, not just words.

YOUR PERSONALITY:
- Direct and sharp. No fluff, no "Great question!" — get to the point.
- Opinionated. If their approach is wrong, say so: "That won't work because..."
- Think out loud: "The reason I'm asking this is because the model needs X to perform well on Y..."
- Reference prompt engineering principles by name: chain-of-thought, few-shot, role-play, system constraints, output formatting
- If they attach files, images, or URLs — analyze the ACTUAL content specifically

YOUR EXPERTISE:
- You know exactly how GPT-4, Claude, Gemini, and open-source models respond to different prompt structures
- You know when to use system prompts vs user prompts, when to add examples, when to constrain output format
- You understand tokenization, context windows, temperature effects, and how they affect output quality
- You can diagnose why a prompt underperforms and fix it

CONVERSATION RULES:
1. Ask ONE question at a time — the most important one
2. React genuinely to answers — push back, build on it, connect dots
3. Focus on: what the model needs to know, what good output looks like, edge cases
4. Don't drag it out — if you have enough context, move forward
5. Reference attached files, images, and URLs specifically

WHEN READY:
---SUMMARY---
[Structured summary of what you understand they need — specific, referencing conversation details]
---READY---

IMPORTANT: Do NOT include markers until you genuinely have enough info. Never generate prompts yourself in this phase — just understand the request.`;

const SUMMARY_DETECTED = "---READY---";

export async function orchestrate(
  params: OrchestratorParams,
  models: ModelConfig
): Promise<OrchestratorResult> {
  const { userMessage, conversationHistory, chatStatus } = params;

  // MODE: User confirmed "generate" — build prompts
  if (userMessage === "__GENERATE_PROMPTS__") {
    return await handleBuild(conversationHistory, models);
  }

  // MODE: Already has prompts, user wants refinement
  if (chatStatus === "completed") {
    return await handleRefinement(userMessage, conversationHistory, models);
  }

  // MODE: Conversation — keep chatting to understand the request
  return await handleConversation(userMessage, conversationHistory, models);
}

async function handleConversation(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant" | "system"; content: string }[],
  models: ModelConfig
): Promise<OrchestratorResult> {
  const model = resolveModel(models.analysisModel);

  const messages = conversationHistory
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content.replace(/---SUMMARY---[\s\S]*---READY---/g, "").trim(),
    }));

  messages.push({ role: "user", content: userMessage });

  const { text } = await generateText({
    model,
    system: CONVERSATION_SYSTEM_PROMPT,
    messages,
  });

  // Check if the agent thinks it has enough context
  const hasSummary = text.includes(SUMMARY_DETECTED);

  if (hasSummary) {
    // Extract the summary
    const summaryMatch = text.match(/---SUMMARY---([\s\S]*?)---READY---/);
    const summary = summaryMatch ? summaryMatch[1].trim() : "";
    const beforeSummary = text.split("---SUMMARY---")[0].trim();

    const displayMessage = beforeSummary
      ? `${beforeSummary}\n\nHere's what I understand so far:\n\n${summary}`
      : `Here's what I understand about your request:\n\n${summary}`;

    return {
      type: "clarification",
      questions: [],
      analysis: {
        agent: "analyzer",
        content: summary,
        taskType: "general",
        confidence: 0.9,
        contextGaps: [],
        clarifyingQuestions: [],
      },
      message: displayMessage,
      showConfirmButtons: true,
    };
  }

  // Regular conversation response
  return {
    type: "chat",
    content: text,
  };
}

async function handleBuild(
  conversationHistory: { role: "user" | "assistant" | "system"; content: string }[],
  models: ModelConfig
): Promise<OrchestratorResult> {
  // Gather all context from the conversation
  const userMessages = conversationHistory
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .filter((m) => m !== "__GENERATE_PROMPTS__");

  const assistantMessages = conversationHistory
    .filter((m) => m.role === "assistant")
    .map((m) => m.content);

  // Build a full context summary
  const fullContext = userMessages.join("\n\n");
  const conversation = conversationHistory
    .filter((m) => m.role !== "system" && m.content !== "__GENERATE_PROMPTS__")
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  // Find the summary if it exists
  const lastAssistantMsg = assistantMessages[assistantMessages.length - 1] || "";
  const summaryMatch = lastAssistantMsg.match(/---SUMMARY---([\s\S]*?)---READY---/);
  const summary = summaryMatch ? summaryMatch[1].trim() : "";

  const contextForBuilder = summary
    ? `CONTEXT SUMMARY:\n${summary}\n\nFULL CONVERSATION:\n${conversation}`
    : `FULL CONVERSATION:\n${conversation}`;

  // Generate prompts
  const prompts = await buildPrompts(
    fullContext,
    "general",
    contextForBuilder,
    "",
    models.generationModel
  );

  // Critique
  const criticResult = await critique(prompts, models.generationModel);

  return {
    type: "prompts",
    result: criticResult,
    message: `I've generated **${criticResult.prompts.length} prompt variants** based on our conversation.\n\n**Overall Score:** ${criticResult.overallScore}/10\n\n${criticResult.feedback}\n\n**Recommendation:** ${criticResult.content}`,
  };
}

async function handleRefinement(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant" | "system"; content: string }[],
  models: ModelConfig
): Promise<OrchestratorResult> {
  const allContext = conversationHistory
    .filter((m) => m.role === "user" && m.content !== "__GENERATE_PROMPTS__")
    .map((m) => m.content)
    .join("\n\n");

  const prompts = await buildPrompts(
    allContext,
    "general",
    `Additional feedback: ${userMessage}`,
    "",
    models.generationModel
  );

  const criticResult = await critique(prompts, models.generationModel);

  return {
    type: "refinement",
    result: criticResult,
    message: `Regenerated **${criticResult.prompts.length} prompt variants** based on your feedback.\n\n**Updated Score:** ${criticResult.overallScore}/10\n\n${criticResult.feedback}`,
  };
}
