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
      sections.sort((a, b) => a.order - b.order).map(async (s) => {
        const contentHtml = await marked.parse(s.content);
        const sourcesHtml = s.sources?.length
          ? `<div class="sources"><h4>Sources</h4><ul>${s.sources
              .map((src) => `<li><a href="${src.url}">${src.title || src.url}</a></li>`)
              .join("")}</ul></div>`
          : "";
        return `<section><h2>${s.title}</h2>${contentHtml}${sourcesHtml}</section>`;
      })
    );

    const summaryHtml = await marked.parse(report.summary || "");

    const tocHtml = sections
      .sort((a, b) => a.order - b.order)
      .map((s, i) => `<li><span class="toc-num">${i + 1}.</span> ${s.title}</li>`)
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${report.query} — Research Report</title>
  <style>
    @page {
      margin: 0.75in;
      size: A4;
      @bottom-center {
        content: counter(page);
        font-size: 10px;
        color: #94a3b8;
      }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      color: #1e293b;
      line-height: 1.7;
      padding: 48px;
      max-width: 860px;
      margin: 0 auto;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Header */
    .cover { margin-bottom: 40px; padding-bottom: 24px; border-bottom: 3px solid #0891b2; }
    .cover h1 { font-size: 26px; color: #0f172a; font-weight: 700; line-height: 1.3; margin-bottom: 8px; }
    .cover .meta { font-size: 11px; color: #94a3b8; letter-spacing: 0.5px; text-transform: uppercase; }
    .cover .brand { display: inline-block; background: #0891b2; color: white; font-size: 10px; font-weight: 600; padding: 3px 10px; border-radius: 4px; margin-right: 8px; letter-spacing: 0.5px; }

    /* TOC */
    .toc { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px 24px; margin-bottom: 32px; page-break-after: auto; }
    .toc h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; }
    .toc ul { list-style: none; padding: 0; }
    .toc li { font-size: 13px; color: #334155; padding: 4px 0; border-bottom: 1px solid #f1f5f9; }
    .toc li:last-child { border-bottom: none; }
    .toc .toc-num { color: #0891b2; font-weight: 600; margin-right: 8px; }

    /* Summary */
    .summary { background: linear-gradient(135deg, #f0fdfa, #ecfeff); border: 1px solid #99f6e4; border-radius: 8px; padding: 24px; margin-bottom: 36px; }
    .summary h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.8px; color: #0891b2; margin-bottom: 12px; font-weight: 700; }
    .summary p { font-size: 14px; color: #1e293b; line-height: 1.7; }

    /* Sections */
    section { margin-bottom: 28px; page-break-inside: avoid; }
    h2 { font-size: 18px; color: #0f172a; margin: 28px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; font-weight: 700; }
    h3 { font-size: 15px; color: #1e293b; margin: 16px 0 8px; font-weight: 600; }
    h4 { font-size: 13px; color: #475569; margin: 12px 0 6px; font-weight: 600; }
    p { margin-bottom: 10px; font-size: 13.5px; color: #334155; }
    ul, ol { margin-bottom: 10px; padding-left: 20px; }
    li { margin-bottom: 4px; font-size: 13.5px; color: #334155; }
    strong { color: #0f172a; }
    em { color: #475569; }
    a { color: #0891b2; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Code */
    code { background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 12px; color: #0891b2; }
    pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 6px; overflow-x: auto; margin: 10px 0; }
    pre code { background: none; padding: 0; color: #334155; }

    /* Tables */
    table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
    th { background: #f8fafc; padding: 8px 12px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #475569; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.3px; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    tr:hover td { background: #f8fafc; }

    /* Sources */
    .sources { margin-top: 16px; padding: 14px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
    .sources h4 { margin-top: 0; color: #94a3b8; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .sources ul { list-style: none; padding: 0; }
    .sources li { font-size: 12px; margin-bottom: 3px; }
    .sources li a { color: #0891b2; }

    /* Footer */
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }

    /* Print button (hidden in PDF) */
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #0891b2; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(8,145,178,0.3); z-index: 100; }
    .print-btn:hover { background: #0e7490; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Save as PDF</button>

  <div class="cover">
    <span class="brand">RESEARCH REPORT</span>
    <h1>${report.query}</h1>
    <div class="meta">Generated ${new Date(report.generatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} &middot; Powered by Research Hub</div>
  </div>

  <div class="toc">
    <h3>Table of Contents</h3>
    <ul>${tocHtml}</ul>
  </div>

  <div class="summary">
    <h3>Executive Summary</h3>
    ${summaryHtml}
  </div>

  ${sectionsHtml.join("\n")}

  <div class="footer">
    This report was generated using AI-powered research tools. All sources are cited inline.<br>
    Research Hub &middot; ${new Date().getFullYear()}
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
