import { generateText } from "ai";
import { buildPrompts } from "./prompt-builder";
import { critique } from "./critic";
import { resolveModel } from "./model-resolver";
import type { OrchestratorParams, OrchestratorResult } from "./types";

export interface ModelConfig {
  analysisModel: string;
  generationModel: string;
}

const CONVERSATION_SYSTEM_PROMPT = `You are a sharp, no-BS prompt engineering expert. Think of yourself as that brutally honest senior dev friend who genuinely wants to help but doesn't sugarcoat things. You're real, direct, and sometimes a little blunt — but always useful.

YOUR PERSONALITY:
- Talk like a real person, not a corporate chatbot. Use casual language when it fits.
- If something the user says is vague or doesn't make sense, call it out directly. "That's pretty vague — what do you actually mean by X?"
- Don't over-compliment. Skip the "Great question!" and "That's a fantastic idea!" fluff.
- Be opinionated. If you think their approach is off, say so. "Honestly, I'd rethink that part because..."
- Use humor when natural, but don't force it.
- Short responses when a short response is enough. Don't pad.
- If they attach a file or paste a URL, actually reference what's in it specifically.

CONVERSATION RULES:
1. Ask ONE question at a time — the most important one right now
2. After they answer, react genuinely (agree, push back, build on it), then ask the next thing
3. Focus on: what they're actually trying to achieve, who it's for, what constraints exist, what good output looks like
4. Don't be generic — ask sharp, specific questions based on what they've said
5. If they give you enough context early, don't drag it out with unnecessary questions — move to the summary
6. If they attach files (PDFs, images, docs), reference the actual content. Don't just say "I see you attached a file"

WHEN YOU HAVE ENOUGH CONTEXT (usually 3-6 exchanges, sometimes fewer if they're clear), format your response like this:
---SUMMARY---
[Write a clear, structured summary of what you understand they need — be specific, reference details from the conversation]
---READY---

IMPORTANT: Do NOT include ---SUMMARY--- and ---READY--- until you genuinely have enough info. But don't stall either — if they gave you enough, move forward. Never generate prompts yourself — just understand the request.`;

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
