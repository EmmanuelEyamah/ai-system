import type {
  AgentContext,
  AnalysisResult,
  CriticResult,
  PromptOutput,
  AgentResult,
} from "@ai-system/shared-types";

export type OrchestratorResult =
  | { type: "clarification"; questions: string[]; analysis: AnalysisResult; message: string; showConfirmButtons?: boolean }
  | { type: "prompts"; result: CriticResult; message: string }
  | { type: "refinement"; result: CriticResult; message: string }
  | { type: "chat"; content: string };

export interface OrchestratorParams {
  chatId: string;
  userMessage: string;
  conversationHistory: { role: "user" | "assistant" | "system"; content: string }[];
  chatStatus: string;
  taskType?: string | null;
}

export type { AgentContext, AnalysisResult, CriticResult, PromptOutput, AgentResult };
