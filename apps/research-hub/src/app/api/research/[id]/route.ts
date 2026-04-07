import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

// GET /api/research/[id] — get session with messages and report
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await db.researchSession.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}

// PATCH /api/research/[id] — update starred, title
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.starred === "boolean") data.starred = body.starred;
    if (typeof body.title === "string") data.title = body.title;

    const session = await db.researchSession.update({
      where: { id },
      data,
    });

    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}

// DELETE /api/research/[id] — delete session
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await db.researchSession.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
