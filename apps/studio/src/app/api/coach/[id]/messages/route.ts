import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { chat } from "@/modules/coach/engine/coach";
import { processMessage } from "@/lib/process-message";
import type { PersonaKey } from "@/modules/coach/engine/coach";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { message, images } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const session = await db.coachSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Process URLs
    const { enrichedMessage } = await processMessage(message.trim(), images);

    // Save user message
    await db.coachMessage.create({
      data: { sessionId: id, role: "user", content: message.trim() },
    });

    const history = session.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Get response
    const { response, detectedPersona } = await chat({
      userMessage: enrichedMessage,
      conversationHistory: history,
      persona: session.persona as PersonaKey,
      images,
    });

    // Save assistant response with detected persona
    await db.coachMessage.create({
      data: {
        sessionId: id,
        role: "assistant",
        content: response,
        metadata: { persona: detectedPersona },
      },
    });

    // Update title + persona from first message
    if (session.messages.length === 0) {
      let titleText = message.trim();
      titleText = titleText.replace(/\[Context from folder:[^\]]*\][\s\S]*?---\n\n/g, "").replace(/\[Referenced from[^\]]*\][\s\S]*?---\n\n/g, "").trim();
      const title = (titleText || message.trim()).slice(0, 60) + ((titleText || message.trim()).length > 60 ? "..." : "");
      await db.coachSession.update({ where: { id }, data: { title, persona: detectedPersona } });
    }

    return NextResponse.json({ message: response, persona: detectedPersona });
  } catch (error) {
    console.error("Coach message error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
