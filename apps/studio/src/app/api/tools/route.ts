import { NextResponse } from "next/server";
import { getAvailableToolNames } from "@/modules/research/engine/tool-registry";

// GET /api/tools — returns which research tools are configured
export async function GET() {
  return NextResponse.json({ tools: getAvailableToolNames() });
}
