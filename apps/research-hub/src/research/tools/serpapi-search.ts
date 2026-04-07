export interface SerpApiResult {
  results: { title: string; link: string; snippet: string }[];
  knowledgeGraph?: { title: string; description: string };
}

export async function serpApiSearch(params: {
  query: string;
  numResults?: number;
}): Promise<SerpApiResult> {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    return { results: [] };
  }

  const url = new URL("https://serpapi.com/search");
  url.searchParams.set("q", params.query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("engine", "google");
  url.searchParams.set("num", String(Math.min(params.numResults || 8, 10)));

  const res = await fetch(url.toString());

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SerpAPI error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const results = (data.organic_results || []).map(
    (item: { title: string; link: string; snippet: string }) => ({
      title: item.title || "",
      link: item.link || "",
      snippet: item.snippet || "",
    })
  );

  const knowledgeGraph = data.knowledge_graph
    ? {
        title: data.knowledge_graph.title || "",
        description: data.knowledge_graph.description || "",
      }
    : undefined;

  return { results, knowledgeGraph };
}
