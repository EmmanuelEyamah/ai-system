import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

export async function GET() {
  try {
    const folders = await db.folder.findMany({
      orderBy: { updatedAt: "desc" },
      include: { items: { orderBy: { createdAt: "desc" } } },
    });
    return NextResponse.json(folders);
  } catch (error) {
    console.error("Failed to fetch folders:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, description, color } = await request.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    let user = await db.user.findFirst();
    if (!user) user = await db.user.create({ data: { name: "Default User" } });

    const folder = await db.folder.create({
      data: {
        userId: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "violet",
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
