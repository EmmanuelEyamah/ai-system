import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import { orchestrate } from "@/modules/chat/agents/orchestrator";
import { readFile } from "fs/promises";
import { fetchAllUrls } from "@/lib/url-fetcher";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: chatId } = await params;
  const { message, attachmentIds } = await request.json();

  const hasAttachments = attachmentIds && attachmentIds.length > 0;
  if ((!message || typeof message !== "string") && !hasAttachments) {
    return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 });
  }
  const messageText = message || "(attached files)";

  const chat = await db.chat.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { attachments: true },
      },
    },
  });

  if (!chat) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  }

  const isGenerateCommand = message === "__GENERATE_PROMPTS__";

  // Save user message
  let userMessage;
  if (!isGenerateCommand) {
    userMessage = await db.message.create({
      data: { chatId, role: "user", content: message },
    });

    // Link attachments to this message
    if (attachmentIds && attachmentIds.length > 0) {
      await db.attachment.updateMany({
        where: { id: { in: attachmentIds }, chatId },
        data: { messageId: userMessage.id },
      });
    }
  }

  // Build conversation history with file context
  const conversationHistory: { role: "user" | "assistant" | "system"; content: string }[] = [];

  for (const m of chat.messages) {
    let content = m.content;

    // Append extracted text from attachments
    if (m.attachments && m.attachments.length > 0) {
      const fileContexts: string[] = [];

      for (const att of m.attachments) {
        if (att.extractedText) {
          fileContexts.push(`[Attached file: ${att.fileName}]\n${att.extractedText}`);
        } else if (att.fileType === "image") {
          fileContexts.push(`[Attached image: ${att.fileName}]`);
        }
      }

      if (fileContexts.length > 0) {
        content += "\n\n--- Attached Files ---\n" + fileContexts.join("\n\n");
      }
    }

    conversationHistory.push({
      role: m.role as "user" | "assistant" | "system",
      content,
    });
  }

  // Add current message
  if (!isGenerateCommand) {
    let currentContent = message;

    // Get attachments for current message
    if (attachmentIds && attachmentIds.length > 0) {
      const currentAttachments = await db.attachment.findMany({
        where: { id: { in: attachmentIds } },
      });

      const fileContexts: string[] = [];
      for (const att of currentAttachments) {
        if (att.extractedText) {
          fileContexts.push(`[Attached file: ${att.fileName}]\n${att.extractedText}`);
        } else if (att.fileType === "image") {
          fileContexts.push(`[Attached image: ${att.fileName}]`);
        }
      }

      if (fileContexts.length > 0) {
        currentContent += "\n\n--- Attached Files ---\n" + fileContexts.join("\n\n");
      }
    }

    // Fetch any URLs in the message
    const urlResults = await fetchAllUrls(message);
    if (urlResults.length > 0) {
      const urlContexts = urlResults.map(
        (r) => `[Content from ${r.url}]\n${r.content}`
      );
      currentContent += "\n\n--- Referenced Links ---\n" + urlContexts.join("\n\n");
    }

    conversationHistory.push({ role: "user", content: currentContent });
  }

  // Build image data for vision (Claude can read images)
  let imageData: { mimeType: string; data: string }[] = [];
  if (attachmentIds && attachmentIds.length > 0) {
    const imageAttachments = await db.attachment.findMany({
      where: { id: { in: attachmentIds }, fileType: "image" },
    });

    for (const img of imageAttachments) {
      try {
        const buffer = await readFile(img.storagePath);
        imageData.push({
          mimeType: img.mimeType,
          data: buffer.toString("base64"),
        });
      } catch {
        console.error("Failed to read image:", img.storagePath);
      }
    }
  }

  // Run orchestrator
  let result;
  try {
    result = await orchestrate(
      {
        chatId,
        userMessage: message,
        conversationHistory,
        chatStatus: chat.status,
        taskType: chat.taskType,
      },
      {
        analysisModel: chat.analysisModel,
        generationModel: chat.generationModel,
      }
    );
  } catch (err) {
    console.error("Orchestrator error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `AI processing failed: ${errorMessage}` },
      { status: 500 }
    );
  }

  // Save assistant message
  const assistantContent = result.type === "chat" ? result.content : result.message || "";

  const assistantMessage = await db.message.create({
    data: {
      chatId,
      role: "assistant",
      content: assistantContent,
      metadata: JSON.parse(JSON.stringify({
        type: result.type,
        showConfirmButtons: result.type === "clarification" && "showConfirmButtons" in result ? result.showConfirmButtons : false,
      })),
    },
  });

  // Save generated prompts
  if (result.type === "prompts" || result.type === "refinement") {
    const promptData = result.result.prompts.map((p) => ({
      chatId,
      messageId: assistantMessage.id,
      variant: p.variant,
      modelTarget: p.modelTarget,
      content: p.content,
      score: p.score || null,
      explanation: p.explanation || null,
    }));

    await db.generatedPrompt.createMany({ data: promptData });
    await db.chat.update({ where: { id: chatId }, data: { status: "completed" } });
  }

  // Auto-generate title
  if (!isGenerateCommand) {
    const userMsgCount = chat.messages.filter((m) => m.role === "user").length;
    if (userMsgCount === 0) {
      const title = message.length > 50 ? message.substring(0, 47) + "..." : message;
      await db.chat.update({ where: { id: chatId }, data: { title } });
    }
  }

  // Fetch saved prompts
  const savedPrompts =
    result.type === "prompts" || result.type === "refinement"
      ? await db.generatedPrompt.findMany({ where: { messageId: assistantMessage.id } })
      : [];

  return NextResponse.json({
    type: result.type,
    message: assistantContent,
    prompts: savedPrompts,
    showConfirmButtons: result.type === "clarification" && "showConfirmButtons" in result ? result.showConfirmButtons : false,
  });
}
