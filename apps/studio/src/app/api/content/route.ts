import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

export async function GET() {
  try {
    const sessions = await db.contentSession.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, status: true, platforms: true, starred: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to fetch content sessions:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST() {
  try {
    let user = await db.user.findFirst();
    if (!user) user = await db.user.create({ data: { name: "Default User" } });

    const session = await db.contentSession.create({
      data: { userId: user.id, title: "New Content", status: "conversation" },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Failed to create content session:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
