import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

// Returns compact summaries of ALL session types for the reference picker
export async function GET() {
  try {
    const [chats, research, critiques, trends, content, strategist] = await Promise.all([
      db.chat.findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
      db.researchSession.findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, query: true, status: true, updatedAt: true },
      }),
      db.ideaCritique.findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, status: true, ideaSummary: true, updatedAt: true },
      }),
      db.trendSession.findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, query: true, updatedAt: true },
      }),
      db.contentSession.findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
      db.strategistSession.findMany({
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, title: true, updatedAt: true },
      }),
    ]);

    const items = [
      ...chats.map((c) => ({
        type: "chat" as const, id: c.id, title: c.title, status: c.status, updatedAt: c.updatedAt.toISOString(),
      })),
      ...research.map((r) => ({
        type: "research" as const, id: r.id, title: r.title, status: r.status, preview: r.query?.slice(0, 100), updatedAt: r.updatedAt.toISOString(),
      })),
      ...critiques.map((c) => ({
        type: "critic" as const, id: c.id, title: c.title, status: c.status, preview: c.ideaSummary?.slice(0, 100), updatedAt: c.updatedAt.toISOString(),
      })),
      ...trends.map((t) => ({
        type: "trends" as const, id: t.id, title: t.title, status: "completed", preview: t.query?.slice(0, 100), updatedAt: t.updatedAt.toISOString(),
      })),
      ...content.map((c) => ({
        type: "content" as const, id: c.id, title: c.title, status: c.status, updatedAt: c.updatedAt.toISOString(),
      })),
      ...strategist.map((s) => ({
        type: "strategist" as const, id: s.id, title: s.title, status: "active", updatedAt: s.updatedAt.toISOString(),
      })),
    ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Failed to fetch references:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
