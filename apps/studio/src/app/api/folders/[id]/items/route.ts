import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

// POST: Add item to folder
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { itemType, itemId, itemTitle } = await request.json();
    if (!itemType || !itemId) return NextResponse.json({ error: "itemType and itemId required" }, { status: 400 });

    // Check if already in folder
    const existing = await db.folderItem.findFirst({
      where: { folderId: id, itemType, itemId },
    });
    if (existing) return NextResponse.json({ error: "Already in folder" }, { status: 409 });

    const item = await db.folderItem.create({
      data: { folderId: id, itemType, itemId, itemTitle: itemTitle || "Untitled" },
    });

    // Touch folder updatedAt
    await db.folder.update({ where: { id }, data: {} });

    return NextResponse.json(item);
  } catch (error) {
    console.error("Failed to add item:", error);
    return NextResponse.json({ error: "Failed to add" }, { status: 500 });
  }
}

// DELETE: Remove item from folder
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { itemId } = await request.json();
    await db.folderItem.deleteMany({
      where: { folderId: id, itemId },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
