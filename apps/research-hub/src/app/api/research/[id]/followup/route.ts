import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { handleFollowUp } from "@/research/orchestrator";
import type { ResearchReport } from "@ai-system/shared-types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const session = await db.researchSession.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.reportData) {
      return NextResponse.json({ error: "No report available yet" }, { status: 400 });
    }

    // Save user message
    await db.researchMessage.create({
      data: {
        sessionId: id,
        role: "user",
        content: message.trim(),
      },
    });

    // Build conversation history from existing messages
    const conversationHistory = session.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Call the follow-up handler
    const response = await handleFollowUp({
      question: message.trim(),
      existingReport: session.reportData as unknown as ResearchReport,
      conversationHistory,
      modelId: session.researchModel,
    });

    // Save assistant response
    const assistantMessage = await db.researchMessage.create({
      data: {
        sessionId: id,
        role: "assistant",
        content: response,
      },
    });

    return NextResponse.json({
      id: assistantMessage.id,
      content: response,
    });
  } catch (error) {
    console.error("Follow-up error:", error);
    const errMsg = error instanceof Error ? error.message : "Follow-up failed";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
