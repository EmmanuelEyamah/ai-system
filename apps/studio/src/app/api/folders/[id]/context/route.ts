import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

// GET: Pull compressed context from all items in a folder
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const folder = await db.folder.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "asc" } } },
    });
    if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const contextParts: string[] = [`[Context from folder: "${folder.name}"]`];
    if (folder.description) contextParts.push(folder.description);

    // Fetch summary for each item
    for (const item of folder.items) {
      try {
        if (item.itemType === "chat") {
          const chat = await db.chat.findUnique({
            where: { id: item.itemId },
            include: { messages: { orderBy: { createdAt: "asc" }, take: 5 } },
          });
          if (chat) {
            const summary = chat.messages
              .filter((m) => m.role === "assistant")
              .slice(-2)
              .map((m) => m.content.slice(0, 200))
              .join(" ");
            contextParts.push(`\n📝 Chat: "${chat.title}"\n${summary || chat.title}`);
          }
        }

        if (item.itemType === "research") {
          const session = await db.researchSession.findUnique({ where: { id: item.itemId } });
          if (session) {
            const report = session.reportData as { summary?: string; sections?: { title: string; content: string }[] } | null;
            const summary = report?.summary || session.query;
            const sections = (report?.sections || []).slice(0, 5).map((s) => `- ${s.title}: ${s.content.slice(0, 80)}...`).join("\n");
            contextParts.push(`\n🔍 Research: "${session.title}"\n${summary}\n${sections}`);
          }
        }

        if (item.itemType === "critic") {
          const critique = await db.ideaCritique.findUnique({ where: { id: item.itemId } });
          if (critique) {
            const verdict = critique.verdictData as { viabilityScore?: number; viabilityLabel?: string; upgradedVersion?: { improvedIdea?: string } } | null;
            contextParts.push(`\n💡 Idea: "${critique.title}"\n${critique.ideaSummary || critique.title}${verdict ? `\nVerdict: ${verdict.viabilityScore}/10 — ${verdict.viabilityLabel}` : ""}${verdict?.upgradedVersion?.improvedIdea ? `\nUpgraded: ${verdict.upgradedVersion.improvedIdea}` : ""}`);
          }
        }

        if (item.itemType === "trends") {
          const trend = await db.trendSession.findUnique({ where: { id: item.itemId } });
          if (trend) {
            const analysis = trend.analysis as { dominantPattern?: { description: string }; underservedAngle?: string } | null;
            contextParts.push(`\n📊 Trends: "${trend.title}"\nQuery: ${trend.query}${analysis?.dominantPattern ? `\nPattern: ${analysis.dominantPattern.description}` : ""}${analysis?.underservedAngle ? `\nOpportunity: ${analysis.underservedAngle.slice(0, 150)}` : ""}`);
          }
        }
      } catch {
        // Skip items that fail to fetch
      }
    }

    return NextResponse.json({
      folderName: folder.name,
      itemCount: folder.items.length,
      context: contextParts.join("\n"),
    });
  } catch (error) {
    console.error("Failed to fetch folder context:", error);
    return NextResponse.json({ error: "Failed to fetch context" }, { status: 500 });
  }
}
