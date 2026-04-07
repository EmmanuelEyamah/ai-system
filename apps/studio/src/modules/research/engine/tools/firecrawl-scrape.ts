export interface FirecrawlResult {
  markdown: string;
  metadata: { title: string; description: string };
}

export async function firecrawlScrape(params: {
  url: string;
}): Promise<FirecrawlResult> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    return { markdown: "Firecrawl API key not configured.", metadata: { title: "", description: "" } };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url: params.url,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Firecrawl error ${res.status}: ${text}`);
    }

    const data = await res.json();
    // Cap at 2500 chars (~600 tokens) to keep context lean
    const raw = data.data?.markdown || "";
    const markdown = raw.length > 2500 ? raw.slice(0, 2500) + "\n[trimmed]" : raw;
    return {
      markdown,
      metadata: {
        title: data.data?.metadata?.title || "",
        description: data.data?.metadata?.description || "",
      },
    };
  } finally {
    clearTimeout(timeout);
  }
}
