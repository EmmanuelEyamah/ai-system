const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/g;

export function extractUrls(text: string): string[] {
  const matches = text.match(URL_REGEX);
  return matches ? [...new Set(matches)] : [];
}

export async function fetchUrlContent(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PromptStudio/1.0)",
        "Accept": "text/html,application/xhtml+xml,text/plain",
      },
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
      return `[Link: ${url} — non-text content (${contentType})]`;
    }

    const html = await res.text();

    // Basic HTML to text extraction
    const text = htmlToText(html);

    // Truncate to ~4000 chars to avoid blowing up context
    const truncated = text.length > 4000
      ? text.substring(0, 4000) + "\n\n[... content truncated]"
      : text;

    return truncated;
  } catch (err) {
    console.error("URL fetch failed:", url, err);
    return null;
  }
}

function htmlToText(html: string): string {
  // Remove scripts, styles, nav, header, footer
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Convert common elements to text
  text = text
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n## $1\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

  // Remove excessive newlines
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

export async function fetchAllUrls(text: string): Promise<{ url: string; content: string }[]> {
  const urls = extractUrls(text);
  if (urls.length === 0) return [];

  const results: { url: string; content: string }[] = [];

  // Fetch up to 3 URLs max
  for (const url of urls.slice(0, 3)) {
    const content = await fetchUrlContent(url);
    if (content) {
      results.push({ url, content });
    }
  }

  return results;
}
