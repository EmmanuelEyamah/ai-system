import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { DEFAULT_ANALYSIS_MODEL, DEFAULT_GENERATION_MODEL } from "@/lib/models";

// GET /api/chat — list all chats
export async function GET() {
  const chats = await db.chat.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(chats);
}

// POST /api/chat — create a new chat
export async function POST(request: Request) {
  let body: { analysisModel?: string; generationModel?: string } = {};
  try {
    body = await request.json();
  } catch {
    // No body provided, use defaults
  }

  // Get or create default user (single-user V1)
  let user = await db.user.findFirst();
  if (!user) {
    user = await db.user.create({
      data: { name: "Default User" },
    });
  }

  const chat = await db.chat.create({
    data: {
      userId: user.id,
      title: "New Chat",
      status: "active",
      analysisModel: body.analysisModel || DEFAULT_ANALYSIS_MODEL,
      generationModel: body.generationModel || DEFAULT_GENERATION_MODEL,
    },
  });

  return NextResponse.json({
    chatId: chat.id,
    title: chat.title,
    analysisModel: chat.analysisModel,
    generationModel: chat.generationModel,
  });
}
