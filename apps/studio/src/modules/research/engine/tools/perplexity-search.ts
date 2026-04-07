export interface PerplexityResult {
  answer: string;
  citations: { url: string; title: string }[];
}

export async function perplexitySearch(params: {
  query: string;
  focus?: "internet" | "academic" | "news";
}): Promise<PerplexityResult> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return { answer: "Perplexity API key not configured.", citations: [] };
  }

  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "sonar-pro",
      messages: [{ role: "user", content: params.query }],
      ...(params.focus && { search_focus: params.focus }),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Perplexity API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";
  const answer = raw.length > 2000 ? raw.slice(0, 2000) + "\n[trimmed]" : raw;
  const citations = (data.citations || []).map((url: string, i: number) => ({
    url,
    title: `Source ${i + 1}`,
  }));

  return { answer, citations };
}
