export type AgentRole =
  | "orchestrator"
  | "analyzer"
  | "researcher"
  | "prompt-builder"
  | "critic";

export type TaskType =
  | "writing"
  | "coding"
  | "research"
  | "analysis"
  | "marketing"
  | "support"
  | "image-generation"
  | "automation"
  | "summarization"
  | "creative"
  | "general";

export type PromptVariant = "best" | "shorter" | "advanced";
export type ModelTarget = "openai" | "claude" | "universal";
export type ChatStatus =
  | "active"
  | "analyzing"
  | "clarifying"
  | "building"
  | "reviewing"
  | "completed";
export type MessageRole = "user" | "assistant" | "system";

export interface ConversationMessage {
  role: MessageRole;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AgentContext {
  chatId: string;
  userInput: string;
  taskType?: TaskType;
  conversationHistory: ConversationMessage[];
  researchData?: string;
  clarifications?: Record<string, string>;
}

export interface AgentResult {
  agent: AgentRole;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface AnalysisResult extends AgentResult {
  taskType: TaskType;
  contextGaps: string[];
  clarifyingQuestions: string[];
  confidence: number;
}

export interface PromptOutput {
  variant: PromptVariant;
  modelTarget: ModelTarget;
  content: string;
  score?: number;
  explanation?: string;
}

export interface CriticResult extends AgentResult {
  prompts: PromptOutput[];
  overallScore: number;
  feedback: string;
}
