import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

export async function GET() {
  try {
    const sessions = await db.coachSession.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, persona: true, starred: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to fetch coach sessions:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    let user = await db.user.findFirst();
    if (!user) user = await db.user.create({ data: { name: "Default User" } });

    const session = await db.coachSession.create({
      data: { userId: user.id, title: "New Coaching Session", persona: body.persona || "auto" },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Failed to create coach session:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
