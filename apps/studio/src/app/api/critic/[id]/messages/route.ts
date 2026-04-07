import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { handleConversation } from "@/modules/critic/engine/orchestrator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { message } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const critique = await db.ideaCritique.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!critique) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Save user message
    await db.criticMessage.create({
      data: { critiqueId: id, role: "user", content: message.trim() },
    });

    // Build history
    const history = critique.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Handle __GENERATE_VERDICT__ trigger
    if (message === "__GENERATE_VERDICT__") {
      // Extract idea summary from the last assistant message that has ---SUMMARY---
      const lastSummaryMsg = [...critique.messages].reverse().find((m) =>
        m.content.includes("Here's what I understand")
      );
      const ideaSummary = lastSummaryMsg?.content || critique.messages.map((m) => m.content).join("\n");

      await db.ideaCritique.update({
        where: { id },
        data: { status: "researching", ideaSummary },
      });

      return NextResponse.json({ type: "trigger_verdict", ideaSummary });
    }

    // Conversation phase
    const result = await handleConversation({
      userMessage: message.trim(),
      conversationHistory: history,
    });

    // Save assistant response
    await db.criticMessage.create({
      data: {
        critiqueId: id,
        role: "assistant",
        content: result.message,
        metadata: { type: result.type, showConfirmButtons: result.showConfirmButtons },
      },
    });

    // Update title from first user message
    if (critique.messages.length === 0) {
      const title = message.trim().slice(0, 60) + (message.trim().length > 60 ? "..." : "");
      await db.ideaCritique.update({ where: { id }, data: { title } });
    }

    return NextResponse.json({
      type: result.type,
      message: result.message,
      showConfirmButtons: result.showConfirmButtons,
    });
  } catch (error) {
    console.error("Critic message error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
