export interface ApifyResult {
  items: unknown[];
}

export async function apifyActorRun(params: {
  actorId: string;
  input: Record<string, unknown>;
}): Promise<ApifyResult> {
  const apiKey = process.env.APIFY_API_KEY;
  if (!apiKey) {
    return { items: [] };
  }

  // Use synchronous run endpoint — waits up to 60s for the actor to finish
  const url = new URL(
    `https://api.apify.com/v2/acts/${params.actorId}/run-sync-get-dataset-items`
  );
  url.searchParams.set("token", apiKey);
  url.searchParams.set("timeout", "60");
  url.searchParams.set("memory", "256");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params.input),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Apify error ${res.status}: ${text}`);
    }

    const items = await res.json();
    return { items: Array.isArray(items) ? items : [] };
  } finally {
    clearTimeout(timeout);
  }
}
