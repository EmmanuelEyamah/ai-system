import { db } from "@ai-system/database";
import { generateVerdict } from "@/modules/critic/engine/orchestrator";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const critique = await db.ideaCritique.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!critique) {
    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emitEvent = (event: { type: string; payload: Record<string, unknown> }) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {}
      };

      try {
        await db.ideaCritique.update({ where: { id }, data: { status: "researching" } });

        const history = critique.messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

        // Load previously saved tool results (for retry/resume)
        const savedToolResults = critique.toolsUsed as { tool: string; data: unknown }[] | null;

        const { verdict, toolResults } = await generateVerdict({
          ideaSummary: critique.ideaSummary || critique.title,
          conversationHistory: history,
          savedToolResults: savedToolResults as never,
          emitEvent,
          saveToolResults: async (results) => {
            await db.ideaCritique.update({
              where: { id },
              data: { toolsUsed: JSON.parse(JSON.stringify(results)) },
            });
          },
        });

        await db.ideaCritique.update({
          where: { id },
          data: {
            status: "completed",
            verdictData: JSON.parse(JSON.stringify(verdict)),
            toolsUsed: JSON.parse(JSON.stringify(toolResults)),
          },
        });

        emitEvent({ type: "complete", payload: { verdict } });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Critique failed";
        emitEvent({ type: "error", payload: { message } });
        await db.ideaCritique.update({ where: { id }, data: { status: "failed" } }).catch(() => {});
      } finally {
        try { controller.close(); } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
