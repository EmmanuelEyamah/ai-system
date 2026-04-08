import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { chat } from "@/modules/strategist/engine/advisor";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { message } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const session = await db.strategistSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Save user message
    await db.strategistMessage.create({
      data: { sessionId: id, role: "user", content: message.trim() },
    });

    const history = session.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Get response
    const response = await chat({
      userMessage: message.trim(),
      conversationHistory: history,
    });

    // Save assistant response
    await db.strategistMessage.create({
      data: { sessionId: id, role: "assistant", content: response },
    });

    // Update title from first message
    if (session.messages.length === 0) {
      let titleText = message.trim();
      titleText = titleText.replace(/\[Context from folder:[^\]]*\][\s\S]*?---\n\n/g, "").replace(/\[Referenced from[^\]]*\][\s\S]*?---\n\n/g, "").trim();
      const title = (titleText || message.trim()).slice(0, 60) + ((titleText || message.trim()).length > 60 ? "..." : "");
      await db.strategistSession.update({ where: { id }, data: { title } });
    }

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error("Strategist message error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
