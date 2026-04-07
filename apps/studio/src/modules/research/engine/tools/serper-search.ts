export interface SerperResult {
  results: { title: string; link: string; snippet: string }[];
}

export async function serperSearch(params: {
  query: string;
  numResults?: number;
}): Promise<SerperResult> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    return { results: [] };
  }

  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: params.query,
      num: Math.min(params.numResults || 8, 10),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Serper error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const results = (data.organic || []).map(
    (item: { title: string; link: string; snippet: string }) => ({
      title: item.title || "",
      link: item.link || "",
      snippet: item.snippet || "",
    })
  );

  return { results };
}
