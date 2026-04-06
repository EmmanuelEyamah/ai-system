import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/chat/[id] — get single chat with messages and prompts
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const chat = await db.chat.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { attachments: true },
      },
      prompts: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  return NextResponse.json(chat);
}

// PATCH /api/chat/[id] — update chat (model selection, title, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, string | boolean> = {};
  if (body.analysisModel) updateData.analysisModel = body.analysisModel;
  if (body.generationModel) updateData.generationModel = body.generationModel;
  if (body.title) updateData.title = body.title;
  if (typeof body.starred === "boolean") updateData.starred = body.starred;

  const chat = await db.chat.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json(chat);
}

// DELETE /api/chat/[id] — delete a chat
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.chat.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
