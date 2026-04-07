import { NextResponse } from "next/server";
import { db } from "@ai-system/database";

// GET /api/tasks — list pending tasks for this app
export async function GET() {
  try {
    const tasks = await db.crossAppTask.findMany({
      where: { targetApp: "research-hub" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST /api/tasks — create a cross-app task
export async function POST(request: Request) {
  try {
    const { targetApp, taskType, payload, sourceRefId } = await request.json();

    const task = await db.crossAppTask.create({
      data: {
        sourceApp: "research-hub",
        targetApp,
        taskType,
        payload,
        sourceRefId,
      },
    });

    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
