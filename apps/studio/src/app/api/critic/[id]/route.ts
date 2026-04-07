import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const critique = await db.ideaCritique.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!critique) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(critique);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.starred === "boolean") data.starred = body.starred;
    if (typeof body.title === "string") data.title = body.title;
    const critique = await db.ideaCritique.update({ where: { id }, data });
    return NextResponse.json(critique);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.ideaCritique.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
