import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/prompts/[chatId] — get all prompts for a chat
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;

  const prompts = await db.generatedPrompt.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(prompts);
}
