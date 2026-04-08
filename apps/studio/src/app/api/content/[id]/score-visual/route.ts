import { NextResponse } from "next/server";
import { generateText } from "ai";
import { createAnthropicClient } from "@ai-system/ai-clients";
import { VISUAL_SCORE_PROMPT } from "@/modules/content/engine/prompts";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const platform = formData.get("platform") as string || "linkedin";
    const context = formData.get("context") as string || "";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type || "image/png";

    const anthropic = createAnthropicClient();

    const { text } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      maxTokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: `data:${mimeType};base64,${base64}`,
            },
            {
              type: "text",
              text: `${VISUAL_SCORE_PROMPT}\n\nTarget platform: ${platform}\n${context ? `Post context: ${context}` : ""}`,
            },
          ],
        },
      ],
    });

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error("Visual score error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Scoring failed" }, { status: 500 });
  }
}
