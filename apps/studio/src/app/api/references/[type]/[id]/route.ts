import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const { type, id } = await params;

  try {
    if (type === "chat") {
      const chat = await db.chat.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 10 } },
      });
      if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const summary = chat.messages
        .filter((m) => m.role === "assistant")
        .slice(-2)
        .map((m) => m.content.slice(0, 300))
        .join("\n\n");

      return NextResponse.json({
        type: "chat",
        title: chat.title,
        context: `[Referenced from Prompt Studio chat: "${chat.title}"]\n\n${summary || chat.title}`,
      });
    }

    if (type === "research") {
      const session = await db.researchSession.findUnique({ where: { id } });
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const report = session.reportData as { summary?: string; sections?: { title: string; content: string }[] } | null;
      const summary = report?.summary || session.query;
      const sections = (report?.sections || [])
        .map((s) => `- **${s.title}**: ${s.content.slice(0, 80)}...`)
        .join("\n");

      return NextResponse.json({
        type: "research",
        title: session.title,
        context: `[Referenced from Research: "${session.title}"]\n\nQuery: ${session.query}\n\nSummary: ${summary}\n\nSections:\n${sections}`,
      });
    }

    if (type === "critic") {
      const critique = await db.ideaCritique.findUnique({ where: { id } });
      if (!critique) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const verdict = critique.verdictData as { viabilityScore?: number; viabilityLabel?: string; upgradedVersion?: { improvedIdea?: string } } | null;
      const summary = critique.ideaSummary || critique.title;
      const verdictInfo = verdict
        ? `\nVerdict: ${verdict.viabilityScore}/10 — ${verdict.viabilityLabel}${verdict.upgradedVersion?.improvedIdea ? `\nUpgraded idea: ${verdict.upgradedVersion.improvedIdea}` : ""}`
        : "";

      return NextResponse.json({
        type: "critic",
        title: critique.title,
        context: `[Referenced from Idea Critique: "${critique.title}"]\n\nIdea: ${summary}${verdictInfo}`,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Failed to fetch reference:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
