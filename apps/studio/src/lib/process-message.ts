import { fetchUrlContent } from "./auto-research";

/**
 * Process a user message — scrape any URLs, prepare image data.
 * Returns the enriched message text and any image data for vision.
 */
export async function processMessage(
  message: string,
  imageBase64s?: { data: string; mimeType: string }[]
): Promise<{
  enrichedMessage: string;
  images: { data: string; mimeType: string }[];
}> {
  let enrichedMessage = message;
  const images = imageBase64s || [];

  // Detect and scrape URLs in the message
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const urls = message.match(urlRegex) || [];

  console.log("[processMessage] Detected URLs:", urls.length, "Images:", images.length);
  if (urls.length > 0) {
    const urlContents: string[] = [];
    // Scrape up to 3 URLs max
    const urlsToScrape = urls.slice(0, 3);
    const results = await Promise.allSettled(
      urlsToScrape.map((url) => fetchUrlContent(url))
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        urlContents.push(r.value);
      }
    }
    if (urlContents.length > 0) {
      enrichedMessage = `${message}\n\n--- Scraped URL Content ---\n${urlContents.join("\n\n---\n\n")}`;
    }
  }

  return { enrichedMessage, images };
}

/**
 * Build Claude messages array with vision support.
 * If images are present, uses the multimodal content format.
 */
export function buildClaudeMessages(
  conversationHistory: { role: "user" | "assistant"; content: string }[],
  currentMessage: string,
  images?: { data: string; mimeType: string }[]
): { role: "user" | "assistant"; content: string | { type: string; [key: string]: unknown }[] }[] {
  const messages = conversationHistory.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // If images present, build multimodal content
  if (images && images.length > 0) {
    const content: { type: string; [key: string]: unknown }[] = [];
    for (const img of images) {
      content.push({
        type: "image",
        image: `data:${img.mimeType};base64,${img.data}`,
      });
    }
    content.push({ type: "text", text: currentMessage });
    messages.push({ role: "user" as const, content: content as never });
  } else {
    messages.push({ role: "user" as const, content: currentMessage });
  }

  return messages;
}
