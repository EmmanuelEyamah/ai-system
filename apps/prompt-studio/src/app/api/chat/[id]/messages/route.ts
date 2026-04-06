import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orchestrate } from "@/agents/orchestrator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params;
  const { message } = await request.json();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const chat = await db.chat.findUnique({
    where: { id: chatId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  // Don't save "__GENERATE_PROMPTS__" as a visible message
  const isGenerateCommand = message === "__GENERATE_PROMPTS__";

  if (!isGenerateCommand) {
    await db.message.create({
      data: { chatId, role: "user", content: message },
    });
  }

  const conversationHistory = [
    ...chat.messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    ...(isGenerateCommand ? [] : [{ role: "user" as const, content: message }]),
  ];

  let result;
  try {
    result = await orchestrate(
      {
        chatId,
        userMessage: message,
        conversationHistory,
        chatStatus: chat.status,
        taskType: chat.taskType,
      },
      {
        analysisModel: chat.analysisModel,
        generationModel: chat.generationModel,
      }
    );
  } catch (err) {
    console.error("Orchestrator error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `AI processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }

  // Determine the assistant message content
  const assistantContent =
    result.type === "chat"
      ? result.content
      : result.message || "";

  // Save assistant message
  const assistantMessage = await db.message.create({
    data: {
      chatId,
      role: "assistant",
      content: assistantContent,
      metadata: JSON.parse(JSON.stringify({
        type: result.type,
        showConfirmButtons: result.type === "clarification" && "showConfirmButtons" in result ? result.showConfirmButtons : false,
      })),
    },
  });

  // Save generated prompts
  if (result.type === "prompts" || result.type === "refinement") {
    const promptData = result.result.prompts.map((p) => ({
      chatId,
      messageId: assistantMessage.id,
      variant: p.variant,
      modelTarget: p.modelTarget,
      content: p.content,
      score: p.score || null,
      explanation: p.explanation || null,
    }));

    await db.generatedPrompt.createMany({ data: promptData });

    await db.chat.update({
      where: { id: chatId },
      data: { status: "completed" },
    });
  }

  // Auto-generate title from first user message
  if (!isGenerateCommand) {
    const userMsgCount = chat.messages.filter((m) => m.role === "user").length;
    if (userMsgCount === 0) {
      const title = message.length > 50 ? message.substring(0, 47) + "..." : message;
      await db.chat.update({
        where: { id: chatId },
        data: { title },
      });
    }
  }

  // Fetch saved prompts
  const savedPrompts =
    result.type === "prompts" || result.type === "refinement"
      ? await db.generatedPrompt.findMany({ where: { messageId: assistantMessage.id } })
      : [];

  return NextResponse.json({
    type: result.type,
    message: assistantContent,
    prompts: savedPrompts,
    showConfirmButtons: result.type === "clarification" && "showConfirmButtons" in result ? result.showConfirmButtons : false,
  });
}
