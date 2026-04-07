import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

// GET /api/research — list all sessions
export async function GET() {
  try {
    const sessions = await db.researchSession.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        query: true,
        status: true,
        starred: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/research — create a new session
export async function POST(request: Request) {
  try {
    const { query, researchModel } = await request.json();

    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Get or create default user (same pattern as prompt-studio)
    let user = await db.user.findFirst();
    if (!user) {
      user = await db.user.create({ data: { name: "Default User" } });
    }

    const title = query.trim().slice(0, 80) + (query.trim().length > 80 ? "..." : "");

    const session = await db.researchSession.create({
      data: {
        userId: user.id,
        query: query.trim(),
        title,
        status: "pending",
        researchModel: researchModel || "claude-sonnet-4.6",
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      title: session.title,
    });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
