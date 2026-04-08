import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { generateText } from "ai";
import { createAnthropicClient } from "@ai-system/ai-clients";
import { TREND_IDEAS_PROMPT } from "@/modules/trends/engine/prompts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const session = await db.trendSession.findUnique({ where: { id } });
    if (!session || !session.trendResults) {
      return NextResponse.json({ error: "No trend data" }, { status: 400 });
    }

    const results = session.trendResults as { platform: string; title: string; trendScore: number }[];
    const analysis = session.analysis as Record<string, unknown> | null;

    const context = [
      `Niche: "${session.query}"`,
      `Top trends:\n${results.slice(0, 10).map((r) => `[${r.platform}] "${r.title}" (Score: ${r.trendScore})`).join("\n")}`,
      analysis ? `\nAnalysis:\n${JSON.stringify(analysis, null, 2).slice(0, 2000)}` : "",
    ].join("\n\n");

    const anthropic = createAnthropicClient();
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: TREND_IDEAS_PROMPT,
      maxTokens: 3000,
      messages: [{ role: "user", content: context }],
    });

    let ideas = {};
    const jsonMatch = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
    if (jsonMatch) {
      try { ideas = JSON.parse(jsonMatch[1].trim()); } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end > start) try { ideas = JSON.parse(text.slice(start, end + 1)); } catch {}
      }
    }

    await db.trendSession.update({ where: { id }, data: { ideas: JSON.parse(JSON.stringify(ideas)) } });

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("Ideas error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
