import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type FileCategory = "image" | "pdf" | "document" | "other";

const ALLOWED_TYPES: Record<string, FileCategory> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
  "application/msword": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
  "text/plain": "document",
  "text/markdown": "document",
  "text/csv": "document",
};

export function getFileCategory(mimeType: string): FileCategory {
  return ALLOWED_TYPES[mimeType] || "other";
}

export function isAllowedType(mimeType: string): boolean {
  return mimeType in ALLOWED_TYPES;
}

export function isWithinSizeLimit(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export async function saveFile(buffer: Buffer, fileName: string, chatId: string): Promise<string> {
  const chatDir = path.join(UPLOADS_DIR, chatId);
  if (!existsSync(chatDir)) {
    await mkdir(chatDir, { recursive: true });
  }

  // Add timestamp to avoid collisions
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  const safeName = `${base}-${Date.now()}${ext}`;
  const filePath = path.join(chatDir, safeName);

  await writeFile(filePath, buffer);
  return filePath;
}

export async function extractTextFromFile(
  filePath: string,
  mimeType: string
): Promise<string | null> {
  const category = getFileCategory(mimeType);

  if (category === "pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const fs = await import("fs/promises");
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      console.error("PDF extraction failed:", err);
      return null;
    }
  }

  if (category === "document") {
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      try {
        const mammoth = await import("mammoth");
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
      } catch (err) {
        console.error("DOCX extraction failed:", err);
        return null;
      }
    }

    // Plain text, markdown, csv
    try {
      const fs = await import("fs/promises");
      return await fs.readFile(filePath, "utf-8");
    } catch {
      return null;
    }
  }

  // Images — no text extraction, will be sent as vision input
  return null;
}

export function getFileUrl(storagePath: string): string {
  // Return relative URL for serving
  const relative = path.relative(UPLOADS_DIR, storagePath);
  return `/api/upload/file/${relative}`;
}
