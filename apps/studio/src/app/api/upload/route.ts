import { NextResponse } from "next/server";
import { db } from "@ai-system/database";
import {
  isAllowedType,
  isWithinSizeLimit,
  saveFile,
  extractTextFromFile,
  getFileCategory,
  getFileUrl,
} from "@/lib/files";

// POST /api/upload — upload a file
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const chatId = formData.get("chatId") as string | null;
  const messageId = formData.get("messageId") as string | null;

  if (!file || !chatId) {
    return NextResponse.json({ error: "File and chatId are required" }, { status: 400 });
  }

  if (!isAllowedType(file.type)) {
    return NextResponse.json(
      { error: "File type not supported. Allowed: images, PDFs, DOC/DOCX, TXT, MD, CSV" },
      { status: 400 }
    );
  }

  if (!isWithinSizeLimit(file.size)) {
    return NextResponse.json({ error: "File too large. Maximum 10MB" }, { status: 400 });
  }

  // Save file to disk
  const buffer = Buffer.from(await file.arrayBuffer());
  const storagePath = await saveFile(buffer, file.name, chatId);

  // Extract text for PDFs and documents
  const extractedText = await extractTextFromFile(storagePath, file.type);

  // Save to DB
  const attachment = await db.attachment.create({
    data: {
      chatId,
      messageId: messageId || null,
      fileName: file.name,
      fileType: getFileCategory(file.type),
      mimeType: file.type,
      fileSize: file.size,
      storagePath,
      extractedText,
    },
  });

  return NextResponse.json({
    id: attachment.id,
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    url: getFileUrl(storagePath),
    hasExtractedText: !!extractedText,
  });
}
