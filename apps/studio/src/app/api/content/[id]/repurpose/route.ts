import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { repurposePost, analyzeFeedback } from "@/modules/content/engine/strategist";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const { action, post, targetPlatform, feedback } = await request.json();

    if (action === "repurpose" && post && targetPlatform) {
      const result = await repurposePost({ originalPost: post, targetPlatform });

      // Add to content data
      const session = await db.contentSession.findUnique({ where: { id } });
      if (session?.contentData) {
        const data = session.contentData as { posts?: unknown[] };
        const posts = data.posts || [];
        posts.push(result);
        await db.contentSession.update({
          where: { id },
          data: { contentData: JSON.parse(JSON.stringify({ ...data, posts })) },
        });
      }

      return NextResponse.json({ post: result });
    }

    if (action === "feedback" && post && feedback) {
      const analysis = await analyzeFeedback({
        postContent: typeof post === "string" ? post : JSON.stringify(post),
        feedback,
      });

      // Save feedback as a message
      await db.contentMessage.create({
        data: { sessionId: id, role: "user", content: `Performance feedback: ${feedback}` },
      });
      await db.contentMessage.create({
        data: { sessionId: id, role: "assistant", content: analysis, metadata: { type: "feedback" } },
      });

      return NextResponse.json({ analysis });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Repurpose/feedback error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
