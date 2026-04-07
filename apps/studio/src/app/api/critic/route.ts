import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

export async function GET() {
  try {
    const critiques = await db.ideaCritique.findMany({
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, status: true, starred: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json(critiques);
  } catch (error) {
    console.error("Failed to fetch critiques:", error);
    return NextResponse.json({ error: "Failed to fetch critiques" }, { status: 500 });
  }
}

export async function POST() {
  try {
    let user = await db.user.findFirst();
    if (!user) user = await db.user.create({ data: { name: "Default User" } });

    const critique = await db.ideaCritique.create({
      data: { userId: user.id, title: "New Idea", status: "conversation" },
    });

    return NextResponse.json({ critiqueId: critique.id });
  } catch (error) {
    console.error("Failed to create critique:", error);
    return NextResponse.json({ error: "Failed to create critique" }, { status: 500 });
  }
}
