import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

// Single endpoint — returns all sidebar data in one call
export async function GET() {
  try {
    const [chats, research, critiques, trends, content, strategist, coach] = await Promise.all([
      db.chat.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, starred: true, updatedAt: true } }),
      db.researchSession.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, starred: true, updatedAt: true } }),
      db.ideaCritique.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, starred: true, updatedAt: true } }),
      db.trendSession.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, starred: true, updatedAt: true } }),
      db.contentSession.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, starred: true, updatedAt: true } }),
      db.strategistSession.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, starred: true, updatedAt: true } }),
      db.coachSession.findMany({ orderBy: { updatedAt: "desc" }, select: { id: true, title: true, persona: true, starred: true, updatedAt: true } }),
    ]);

    return NextResponse.json({ chats, research, critiques, trends, content, strategist, coach });
  } catch (error) {
    console.error("Failed to fetch sidebar data:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
