import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

/**
 * POST /api/handoff — create a session in any module with pre-loaded context.
 * Body: { target, context, autoGenerate? }
 * target: "research" | "critic" | "content" | "trends" | "strategist" | "chat"
 * context: the brief/query/idea to pre-load
 * autoGenerate: if true, skip conversation and generate immediately (content studio)
 */
export async function POST(request: Request) {
  try {
    const { target, context, autoGenerate } = await request.json();
    if (!target || !context) return NextResponse.json({ error: "target and context required" }, { status: 400 });

    let user = await db.user.findFirst();
    if (!user) user = await db.user.create({ data: { name: "Default User" } });

    const title = context.slice(0, 60) + (context.length > 60 ? "..." : "");

    let sessionId: string;

    switch (target) {
      case "research": {
        const s = await db.researchSession.create({
          data: { userId: user.id, title, query: context, status: "pending" },
        });
        sessionId = s.id;
        break;
      }
      case "critic": {
        const s = await db.ideaCritique.create({
          data: { userId: user.id, title, status: "conversation" },
        });
        // Pre-load the context as the first user message
        await db.criticMessage.create({
          data: { critiqueId: s.id, role: "user", content: context },
        });
        sessionId = s.id;
        break;
      }
      case "content": {
        const s = await db.contentSession.create({
          data: {
            userId: user.id,
            title,
            status: autoGenerate ? "generating" : "conversation",
            briefSummary: autoGenerate ? context : null,
          },
        });
        if (!autoGenerate) {
          await db.contentMessage.create({
            data: { sessionId: s.id, role: "user", content: context },
          });
        }
        sessionId = s.id;
        break;
      }
      case "trends": {
        const s = await db.trendSession.create({
          data: { userId: user.id, title, query: context, platforms: ["youtube", "reddit", "web", "linkedin", "twitter"] },
        });
        sessionId = s.id;
        break;
      }
      case "strategist": {
        const s = await db.strategistSession.create({
          data: { userId: user.id, title },
        });
        await db.strategistMessage.create({
          data: { sessionId: s.id, role: "user", content: context },
        });
        sessionId = s.id;
        break;
      }
      case "chat": {
        const s = await db.chat.create({
          data: { userId: user.id, title },
        });
        sessionId = s.id;
        break;
      }
      default:
        return NextResponse.json({ error: "Invalid target" }, { status: 400 });
    }

    // Build the redirect URL
    const routes: Record<string, string> = {
      research: "/research",
      critic: "/critic",
      content: "/content",
      trends: "/trends",
      strategist: "/strategist",
      chat: "/chat",
    };

    return NextResponse.json({
      sessionId,
      url: `${routes[target]}/${sessionId}`,
      target,
      autoGenerate: autoGenerate || false,
    });
  } catch (error) {
    console.error("Handoff error:", error);
    return NextResponse.json({ error: "Handoff failed" }, { status: 500 });
  }
}
