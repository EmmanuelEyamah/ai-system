import { generateText } from "ai";
import { buildPrompts } from "./prompt-builder";
import { critique } from "./critic";
import { resolveModel } from "./model-resolver";
import type { OrchestratorParams, OrchestratorResult } from "./types";

export interface ModelConfig {
  analysisModel: string;
  generationModel: string;
}

const CONVERSATION_SYSTEM_PROMPT = `You are a friendly, expert prompt engineering assistant. Your job is to deeply understand what the user wants to build/create/achieve so you can later craft the perfect prompts for them.

CONVERSATION RULES:
1. Be conversational and human — like a smart colleague brainstorming with them
2. Ask ONE question at a time, not a list of questions
3. After they answer, acknowledge what they said, then ask the next most important question
4. Focus on understanding: the goal, audience, constraints, desired output format, tone, and any specific requirements
5. Don't be generic — ask specific questions based on what they've told you so far
6. When you feel you have enough context (usually after 3-6 exchanges), provide a clear summary

WHEN YOU HAVE ENOUGH CONTEXT, format your response like this:
---SUMMARY---
[Write a clear, structured summary of everything you understand about what they need]
---READY---

This signals that you're ready to generate prompts. The user will then choose to proceed or add more context.

IMPORTANT: Do NOT include ---SUMMARY--- and ---READY--- until you genuinely have enough information. Keep asking if key details are missing. Never generate prompts yourself — just understand the request.`;

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
