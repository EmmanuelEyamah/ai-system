import { db } from "@ai-system/database";
import { orchestrateResearch } from "@/modules/research/engine/orchestrator";
import type { ResearchSSEEvent } from "@ai-system/shared-types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await db.researchSession.findUnique({ where: { id } });
  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emitEvent = (event: ResearchSSEEvent) => {
        try {
          const data = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          // stream may have been closed
        }
      };

      try {
        await db.researchSession.update({
          where: { id },
          data: { status: "researching" },
        });

        // Load previously saved tool data (for retry/resume)
        const savedToolData = session.toolsUsed as { results: unknown[]; completedAt: string } | null;

        const { report, toolData } = await orchestrateResearch({
          query: session.query,
          sessionId: id,
          modelId: session.researchModel,
          savedToolData: savedToolData as never,
          emitEvent,
          saveToolResults: async (data) => {
            await db.researchSession.update({
              where: { id },
              data: { toolsUsed: JSON.parse(JSON.stringify(data)) },
            });
          },
        });

        // Save both tool results and report
        await db.researchSession.update({
          where: { id },
          data: {
            status: "completed",
            reportData: JSON.parse(JSON.stringify(report)),
            toolsUsed: JSON.parse(JSON.stringify(toolData)),
          },
        });

        emitEvent({ type: "complete", payload: { sessionId: id, report } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Research failed";
        emitEvent({ type: "error", payload: { message } });

        await db.researchSession.update({
          where: { id },
          data: { status: "failed" },
        }).catch(() => {});
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
