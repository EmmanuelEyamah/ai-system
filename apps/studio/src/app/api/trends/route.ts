import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

export async function GET() {
  try {
    const sessions = await db.trendSession.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, query: true, platforms: true, starred: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to fetch trends:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { query, platforms, timeframe, searchMode } = await request.json();
    if (!query?.trim()) return NextResponse.json({ error: "Query required" }, { status: 400 });

    let user = await db.user.findFirst();
    if (!user) user = await db.user.create({ data: { name: "Default User" } });

    const modePrefix = searchMode === "channel" ? "📺 " : searchMode === "account" ? "👤 " : "";
    const title = modePrefix + query.trim().slice(0, 55) + (query.trim().length > 55 ? "..." : "");
    const session = await db.trendSession.create({
      data: {
        userId: user.id,
        title,
        query: query.trim(),
        searchMode: searchMode || "topic",
        platforms: platforms || ["youtube", "reddit", "web"],
        timeframe: timeframe || "week",
      },
    });

    return NextResponse.json({ sessionId: session.id, title: session.title });
  } catch (error) {
    console.error("Failed to create trend session:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
