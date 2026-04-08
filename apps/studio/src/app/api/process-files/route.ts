import { NextResponse } from "next/server";

/**
 * POST /api/process-files — converts uploaded files to base64 for vision API.
 * Accepts multipart form data with multiple files.
 * Returns array of { data: base64, mimeType, fileName }
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files" }, { status: 400 });
    }

    const processed = await Promise.all(
      files.slice(0, 5).map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        return {
          data: base64,
          mimeType: file.type || "image/png",
          fileName: file.name,
        };
      })
    );

    return NextResponse.json({ files: processed });
  } catch (error) {
    console.error("Process files error:", error);
    return NextResponse.json({ error: "Failed to process files" }, { status: 500 });
  }
}
