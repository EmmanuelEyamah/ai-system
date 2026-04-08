import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { generateText } from "ai";
import { createAnthropicClient } from "@ai-system/ai-clients";
import { TREND_CALENDAR_PROMPT } from "@/modules/trends/engine/prompts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const session = await db.trendSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const ideas = session.ideas as { ideas?: { platform: string; title: string; format: string }[] } | null;
    const analysis = session.analysis as Record<string, unknown> | null;

    const context = [
      `Niche: "${session.query}"`,
      `Platforms: ${session.platforms.join(", ")}`,
      ideas?.ideas ? `Content ideas:\n${ideas.ideas.map((i) => `[${i.platform}] ${i.title} (${i.format})`).join("\n")}` : "",
      analysis ? `Analysis highlights:\n${JSON.stringify(analysis, null, 2).slice(0, 1000)}` : "",
    ].join("\n\n");

    const anthropic = createAnthropicClient();
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: TREND_CALENDAR_PROMPT,
      maxTokens: 2000,
      messages: [{ role: "user", content: context }],
    });

    let calendar = {};
    const jsonMatch = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
    if (jsonMatch) {
      try { calendar = JSON.parse(jsonMatch[1].trim()); } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end > start) try { calendar = JSON.parse(text.slice(start, end + 1)); } catch {}
      }
    }

    await db.trendSession.update({ where: { id }, data: { calendar: JSON.parse(JSON.stringify(calendar)) } });

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error("Calendar error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
