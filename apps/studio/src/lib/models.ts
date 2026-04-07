export interface ModelOption {
  id: string;
  label: string;
  provider: "openai" | "anthropic";
  modelId: string;
  tier: "budget" | "mid" | "high" | "premium";
  costLabel: string;
}

export const MODELS: ModelOption[] = [
  { id: "gpt-5.2", label: "GPT-5.2", provider: "openai", modelId: "gpt-5.2", tier: "premium", costLabel: "$$$" },
  { id: "gpt-4.1", label: "GPT-4.1", provider: "openai", modelId: "gpt-4.1", tier: "high", costLabel: "$$" },
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini", provider: "openai", modelId: "gpt-4.1-mini", tier: "mid", costLabel: "$" },
  { id: "gpt-4.1-nano", label: "GPT-4.1 Nano", provider: "openai", modelId: "gpt-4.1-nano", tier: "budget", costLabel: "¢" },
  { id: "gpt-4o", label: "GPT-4o", provider: "openai", modelId: "gpt-4o", tier: "high", costLabel: "$$" },
  { id: "gpt-4o-mini", label: "GPT-4o Mini", provider: "openai", modelId: "gpt-4o-mini", tier: "budget", costLabel: "$" },
  { id: "claude-opus-4.6", label: "Claude Opus 4.6", provider: "anthropic", modelId: "claude-opus-4-6", tier: "premium", costLabel: "$$$" },
  { id: "claude-sonnet-4.6", label: "Claude Sonnet 4.6", provider: "anthropic", modelId: "claude-sonnet-4-6", tier: "high", costLabel: "$$" },
  { id: "claude-haiku-4.5", label: "Claude Haiku 4.5", provider: "anthropic", modelId: "claude-haiku-4-5-20251001", tier: "budget", costLabel: "$" },
];

export const DEFAULT_ANALYSIS_MODEL = "claude-sonnet-4.6";
export const DEFAULT_GENERATION_MODEL = "claude-sonnet-4.6";
export const DEFAULT_RESEARCH_MODEL = "claude-sonnet-4.6";

export function getModel(id: string): ModelOption | undefined {
  return MODELS.find((m) => m.id === id);
}

export function getModelsByProvider(provider: "openai" | "anthropic"): ModelOption[] {
  return MODELS.filter((m) => m.provider === provider);
}

export interface ModelSelection {
  analysisModel: string;
  generationModel: string;
}

export const DEFAULT_MODEL_SELECTION: ModelSelection = {
  analysisModel: DEFAULT_ANALYSIS_MODEL,
  generationModel: DEFAULT_GENERATION_MODEL,
};
