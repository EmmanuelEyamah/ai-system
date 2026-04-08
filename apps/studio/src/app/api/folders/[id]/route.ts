import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const folder = await db.folder.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "desc" } } },
    });
    if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(folder);
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name.trim();
    if (typeof body.description === "string") data.description = body.description.trim();
    if (typeof body.color === "string") data.color = body.color;
    const folder = await db.folder.update({ where: { id }, data });
    return NextResponse.json(folder);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await db.folder.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
