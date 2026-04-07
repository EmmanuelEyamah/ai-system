import { streamText } from "ai";
import { resolveModel } from "@/modules/chat/agents/model-resolver";

// POST /api/prompts/test — test a prompt live
export async function POST(request: Request) {
  const { prompt, model } = await request.json();

  if (!prompt || !model) {
    return new Response(JSON.stringify({ error: "prompt and model are required" }), {
      status: 400,
    });
  }

  // model can be "openai" or "claude" (from the UI) or a specific model ID
  let modelId: string;
  if (model === "openai") {
    modelId = "gpt-4o";
  } else if (model === "claude") {
    modelId = "claude-sonnet-4.6";
  } else {
    modelId = model;
  }

  const aiModel = resolveModel(modelId);

  const result = streamText({
    model: aiModel,
    prompt,
  });

  return result.toDataStreamResponse();
}
