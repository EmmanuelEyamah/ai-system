const PROMPT_STUDIO_URL = process.env.NEXT_PUBLIC_PROMPT_STUDIO_URL || "http://localhost:3000";

export function buildPromptStudioUrl(params: {
  context: string;
  taskType?: string;
  sourceSessionId?: string;
}): string {
  const url = new URL("/chat/new", PROMPT_STUDIO_URL);
  url.searchParams.set("handoff", "research-hub");
  url.searchParams.set("context", params.context);
  if (params.taskType) url.searchParams.set("taskType", params.taskType);
  if (params.sourceSessionId) url.searchParams.set("sourceRef", params.sourceSessionId);
  return url.toString();
}
