import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import type { ResearchReport } from "@ai-system/shared-types";
import { Marked } from "marked";

const marked = new Marked();

export async function POST(request: Request) {
  try {
    const { sessionId, sectionIds } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const session = await db.researchSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || !session.reportData) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = session.reportData as unknown as ResearchReport;
    const sections = sectionIds?.length
      ? report.sections.filter((s) => sectionIds.includes(s.id))
      : report.sections;

    const sectionsHtml = await Promise.all(
      sections.map(async (s) => {
        const contentHtml = await marked.parse(s.content);
        const sourcesHtml = s.sources?.length
          ? `<div class="sources"><h4>Sources</h4><ul>${s.sources
              .map((src) => `<li><a href="${src.url}">${src.title}</a></li>`)
              .join("")}</ul></div>`
          : "";
        return `<section><h2>${s.title}</h2>${contentHtml}${sourcesHtml}</section>`;
      })
    );

    const summaryHtml = await marked.parse(report.summary || "");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.query} — Research Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1a1a2e; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; color: #0a0a0f; }
    h2 { font-size: 20px; margin: 32px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #06b6d4; color: #0a0a0f; }
    h3 { font-size: 16px; margin: 20px 0 8px; color: #1a1a2e; }
    h4 { font-size: 14px; margin: 16px 0 6px; color: #444; }
    p { margin-bottom: 12px; font-size: 14px; }
    ul, ol { margin-bottom: 12px; padding-left: 24px; }
    li { margin-bottom: 4px; font-size: 14px; }
    code { background: #f0f9ff; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    pre { background: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; }
    pre code { background: none; padding: 0; }
    a { color: #06b6d4; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .header { margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
    .meta { font-size: 12px; color: #71717a; margin-top: 4px; }
    .summary { background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 32px; border-left: 4px solid #06b6d4; }
    .sources { margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 6px; }
    .sources h4 { margin-top: 0; color: #71717a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .sources ul { list-style: none; padding: 0; }
    .sources li { font-size: 13px; margin-bottom: 4px; }
    section { margin-bottom: 24px; }
    strong { color: #0a0a0f; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${report.query}</h1>
    <div class="meta">Research Report &middot; Generated ${new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>
  <div class="summary">
    <h3>Executive Summary</h3>
    ${summaryHtml}
  </div>
  ${sectionsHtml.join("\n")}
</body>
</html>`;

    // Return HTML — the client can use window.print() or a dedicated PDF lib
    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="research-${sessionId}.html"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
