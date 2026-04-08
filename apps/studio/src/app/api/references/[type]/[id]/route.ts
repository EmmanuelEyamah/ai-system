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
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!chat) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Pull full conversation — user + assistant messages
      const conversation = chat.messages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n\n");

      return NextResponse.json({
        type: "chat",
        title: chat.title,
        context: `[Referenced from Prompt Studio: "${chat.title}"]\n\n${conversation || chat.title}`,
      });
    }

    if (type === "research") {
      const session = await db.researchSession.findUnique({ where: { id } });
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const report = session.reportData as { summary?: string; sections?: { title: string; content: string }[] } | null;
      const summary = report?.summary || "";
      // Pull full section content, not just titles
      const sections = (report?.sections || [])
        .map((s) => `### ${s.title}\n${s.content}`)
        .join("\n\n");

      return NextResponse.json({
        type: "research",
        title: session.title,
        context: `[Referenced from Research: "${session.title}"]\n\nQuery: ${session.query}\n\nSummary: ${summary}\n\n${sections}`,
      });
    }

    if (type === "critic") {
      const critique = await db.ideaCritique.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!critique) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const verdict = critique.verdictData as {
        viabilityScore?: number; viabilityLabel?: string;
        realityCheck?: { strengths?: string[]; weaknesses?: string[] };
        upgradedVersion?: { improvedIdea?: string; positioning?: string };
        actionPlan?: { steps?: { action: string }[] };
      } | null;

      // Pull full conversation + verdict
      const conversation = critique.messages
        .filter((m) => m.content !== "__GENERATE_VERDICT__")
        .map((m) => `${m.role === "user" ? "User" : "Critic"}: ${m.content}`)
        .join("\n\n");

      const verdictText = verdict ? [
        `\nVerdict: ${verdict.viabilityScore}/10 — ${verdict.viabilityLabel}`,
        verdict.realityCheck?.strengths?.length ? `Strengths: ${verdict.realityCheck.strengths.join("; ")}` : "",
        verdict.realityCheck?.weaknesses?.length ? `Weaknesses: ${verdict.realityCheck.weaknesses.join("; ")}` : "",
        verdict.upgradedVersion?.improvedIdea ? `Upgraded idea: ${verdict.upgradedVersion.improvedIdea}` : "",
        verdict.upgradedVersion?.positioning ? `Positioning: ${verdict.upgradedVersion.positioning}` : "",
        verdict.actionPlan?.steps?.length ? `Action plan: ${verdict.actionPlan.steps.map((s) => s.action).join("; ")}` : "",
      ].filter(Boolean).join("\n") : "";

      return NextResponse.json({
        type: "critic",
        title: critique.title,
        context: `[Referenced from Idea Critique: "${critique.title}"]\n\nIdea: ${critique.ideaSummary || critique.title}\n\n${conversation}${verdictText}`,
      });
    }

    if (type === "trends") {
      const trend = await db.trendSession.findUnique({ where: { id } });
      if (!trend) return NextResponse.json({ error: "Not found" }, { status: 404 });

      const analysis = trend.analysis as {
        dominantPattern?: { description: string; evidence: string };
        hookPatterns?: { pattern: string; example: string }[];
        contentGaps?: { gap: string; opportunity: string }[];
        underservedAngle?: string;
        nicheHeatScore?: number;
        competitionLevel?: number;
      } | null;

      // Pull full analysis
      const analysisText = analysis ? [
        analysis.dominantPattern ? `Dominant pattern: ${analysis.dominantPattern.description} (${analysis.dominantPattern.evidence})` : "",
        analysis.hookPatterns?.length ? `Hook patterns:\n${analysis.hookPatterns.map((h) => `- ${h.pattern}: "${h.example}"`).join("\n")}` : "",
        analysis.contentGaps?.length ? `Content gaps:\n${analysis.contentGaps.map((g) => `- ${g.gap} → Opportunity: ${g.opportunity}`).join("\n")}` : "",
        analysis.underservedAngle ? `Biggest opportunity: ${analysis.underservedAngle}` : "",
        analysis.nicheHeatScore ? `Heat: ${analysis.nicheHeatScore}/10, Competition: ${analysis.competitionLevel}/10` : "",
      ].filter(Boolean).join("\n\n") : "";

      const results = trend.trendResults as { platform: string; title: string; trendScore: number }[] | null;
      const topResults = (results || []).slice(0, 10).map((r) => `- [${r.platform}] ${r.title} (Score: ${r.trendScore})`).join("\n");

      return NextResponse.json({
        type: "trends",
        title: trend.title,
        context: `[Referenced from Trends: "${trend.title}"]\n\nQuery: ${trend.query}\n\nTop trending:\n${topResults}\n\n${analysisText}`,
      });
    }

    if (type === "content") {
      const session = await db.contentSession.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Pull brief + conversation + content data
      const conversation = session.messages
        .filter((m) => m.content !== "__GENERATE_CONTENT__")
        .map((m) => `${m.role === "user" ? "User" : "Strategist"}: ${m.content}`)
        .join("\n\n");

      const contentData = session.contentData as { posts?: { platform: string; content: string; hook: string; strategistNote: string }[]; overallStrategy?: string } | null;
      const postsText = (contentData?.posts || []).map((p) => `[${p.platform}] Hook: ${p.hook}\n${p.content?.slice(0, 500)}`).join("\n\n");

      return NextResponse.json({
        type: "content",
        title: session.title,
        context: `[Referenced from Content Studio: "${session.title}"]\n\nBrief: ${session.briefSummary || ""}\n\n${conversation}\n\n${contentData?.overallStrategy ? `Strategy: ${contentData.overallStrategy}\n\n` : ""}${postsText}`,
      });
    }

    if (type === "strategist") {
      const session = await db.strategistSession.findUnique({
        where: { id },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
      if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

      // Pull full conversation
      const conversation = session.messages
        .map((m) => `${m.role === "user" ? "User" : "Strategist"}: ${m.content}`)
        .join("\n\n");

      return NextResponse.json({
        type: "strategist",
        title: session.title,
        context: `[Referenced from Strategist: "${session.title}"]\n\n${conversation || session.title}`,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Failed to fetch reference:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
