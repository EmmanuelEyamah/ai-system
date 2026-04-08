import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { searchPlatform, searchYouTubeChannel, searchAccount, INSTANT_PLATFORMS, APIFY_PLATFORMS, type PlatformKey, type TrendItem } from "@/modules/trends/engine/searchers";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await db.trendSession.findUnique({ where: { id } });
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

// POST: Run the search across selected platforms
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await db.trendSession.findUnique({ where: { id } });
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // If we already have results, return them
  if (session.trendResults) {
    return NextResponse.json({ results: session.trendResults });
  }

  const encoder = new TextEncoder();
  const platforms = session.platforms as PlatformKey[];
  const searchMode = (session.searchMode || "topic") as string;

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: Record<string, unknown>) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)); } catch {}
      };

      let allResults: TrendItem[] = [];

      if (searchMode === "channel") {
        // YouTube channel mode — search the channel's recent videos
        emit({ type: "platform_start", platform: "youtube" });
        allResults = await searchYouTubeChannel(session.query);
        emit({ type: "platform_done", platform: "youtube", count: allResults.length });

      } else if (searchMode === "account") {
        // Account mode — search across selected platforms for this person
        emit({ type: "status", platforms, phase: "account" });
        const results = await Promise.allSettled(
          platforms.map(async (p) => {
            emit({ type: "platform_start", platform: p });
            const items = await searchAccount(session.query, p);
            emit({ type: "platform_done", platform: p, count: items.length });
            return items;
          })
        );
        for (const r of results) {
          if (r.status === "fulfilled") allResults.push(...r.value);
        }

      } else {
        // Topic mode — search all selected platforms
        emit({ type: "status", platforms, phase: "instant" });
        const results = await Promise.allSettled(
          platforms.map(async (p) => {
            emit({ type: "platform_start", platform: p });
            const items = await searchPlatform(p, session.query);
            emit({ type: "platform_done", platform: p, count: items.length });
            return items;
          })
        );
        for (const r of results) {
          if (r.status === "fulfilled") allResults.push(...r.value);
        }
      }

      // Save all results
      const sorted = allResults.sort((a, b) => b.trendScore - a.trendScore);
      await db.trendSession.update({
        where: { id },
        data: { trendResults: JSON.parse(JSON.stringify(sorted)) },
      });

      emit({ type: "complete", results: sorted });

      try { controller.close(); } catch {}
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.starred === "boolean") data.starred = body.starred;
    if (typeof body.title === "string") data.title = body.title;
    await db.trendSession.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.trendSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
