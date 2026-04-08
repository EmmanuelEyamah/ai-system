import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { handleConversation } from "@/modules/content/engine/strategist";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { message } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const session = await db.contentSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Save user message
    await db.contentMessage.create({
      data: { sessionId: id, role: "user", content: message.trim() },
    });

    const history = session.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Handle generate trigger
    if (message === "__GENERATE_CONTENT__") {
      const lastSummaryMsg = [...session.messages].reverse().find((m) =>
        m.content.includes("content brief")
      );
      const briefSummary = lastSummaryMsg?.content || session.messages.map((m) => m.content).join("\n");

      await db.contentSession.update({
        where: { id },
        data: { status: "generating", briefSummary },
      });

      return NextResponse.json({ type: "trigger_generate", briefSummary });
    }

    // Conversation
    const result = await handleConversation({
      userMessage: message.trim(),
      conversationHistory: history,
    });

    await db.contentMessage.create({
      data: {
        sessionId: id,
        role: "assistant",
        content: result.message,
        metadata: { type: result.type, showConfirmButtons: result.showConfirmButtons },
      },
    });

    // Update title from first message — strip reference context
    if (session.messages.length === 0) {
      let titleText = message.trim();
      // Remove reference context blocks to get the actual user text
      titleText = titleText.replace(/\[Context from folder:[^\]]*\][\s\S]*?---\n\n/g, "");
      titleText = titleText.replace(/\[Referenced from[^\]]*\][\s\S]*?---\n\n/g, "");
      titleText = titleText.trim();
      const title = (titleText || message.trim()).slice(0, 60) + ((titleText || message.trim()).length > 60 ? "..." : "");
      await db.contentSession.update({ where: { id }, data: { title } });
    }

    return NextResponse.json({
      type: result.type,
      message: result.message,
      showConfirmButtons: result.showConfirmButtons,
    });
  } catch (error) {
    console.error("Content message error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
