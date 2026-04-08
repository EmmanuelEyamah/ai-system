import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { generateText } from "ai";
import { createAnthropicClient } from "@ai-system/ai-clients";
import { TREND_ANALYSIS_PROMPT } from "@/modules/trends/engine/prompts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const session = await db.trendSession.findUnique({ where: { id } });
    if (!session || !session.trendResults) {
      return NextResponse.json({ error: "No trend data to analyze" }, { status: 400 });
    }

    const results = session.trendResults as { platform: string; title: string; engagement: Record<string, number>; trendScore: number; author?: string; postedAt?: string }[];
    const dataStr = results.slice(0, 15).map((r) =>
      `[${r.platform}] "${r.title}" ${r.author ? `by ${r.author}` : ""} | Score: ${r.trendScore} | ${Object.entries(r.engagement).filter(([, v]) => v > 0).map(([k, v]) => `${v} ${k}`).join(", ")} ${r.postedAt ? `| ${r.postedAt}` : ""}`
    ).join("\n");

    const anthropic = createAnthropicClient();
    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      system: TREND_ANALYSIS_PROMPT,
      maxTokens: 4000,
      messages: [{ role: "user", content: `Niche: "${session.query}"\nPlatforms: ${session.platforms.join(", ")}\n\nTrending content:\n${dataStr}` }],
    });

    let analysis = {};
    const jsonMatch = text.match(/```json\s*([\s\S]*?)(?:```|$)/);
    if (jsonMatch) {
      try { analysis = JSON.parse(jsonMatch[1].trim()); } catch {
        const start = text.indexOf("{");
        const end = text.lastIndexOf("}");
        if (start !== -1 && end > start) try { analysis = JSON.parse(text.slice(start, end + 1)); } catch {}
      }
    }

    await db.trendSession.update({ where: { id }, data: { analysis: JSON.parse(JSON.stringify(analysis)) } });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Analysis failed" }, { status: 500 });
  }
}
