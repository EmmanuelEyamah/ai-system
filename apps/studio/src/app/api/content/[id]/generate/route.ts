import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { generateContent } from "@/modules/content/engine/strategist";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const session = await db.contentSession.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json().catch(() => ({}));
    const folderContext = body.folderContext || "";

    const history = session.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const contentData = await generateContent({
      briefSummary: session.briefSummary || session.title,
      conversationHistory: history,
      folderContext,
    });

    // Check if we actually got posts
    const posts = (contentData as { posts?: unknown[] }).posts;
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      console.error("Content generation returned empty posts. Raw data:", JSON.stringify(contentData).slice(0, 500));
      await db.contentSession.update({
        where: { id },
        data: { status: "failed", contentData: JSON.parse(JSON.stringify(contentData)) },
      });
      return NextResponse.json({ error: "Generation returned empty content. Please retry." }, { status: 500 });
    }

    await db.contentSession.update({
      where: { id },
      data: {
        status: "completed",
        contentData: JSON.parse(JSON.stringify(contentData)),
      },
    });

    return NextResponse.json({ contentData });
  } catch (error) {
    console.error("Generate content error:", error);
    await db.contentSession.update({ where: { id }, data: { status: "failed" } }).catch(() => {});
    return NextResponse.json({ error: error instanceof Error ? error.message : "Generation failed" }, { status: 500 });
  }
}
