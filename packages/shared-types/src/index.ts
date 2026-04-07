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

// ===== Research Hub Types =====

export type ResearchStatus = "pending" | "researching" | "completed" | "failed";

export type ResearchToolName =
  | "perplexity_search"
  | "serper_search"
  | "serpapi_search"
  | "firecrawl_scrape"
  | "apify_actor_run"
  | "youtube_search";

export interface ReportSource {
  url: string;
  title: string;
  snippet?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  sources: ReportSource[];
  order: number;
}

export interface ResearchReport {
  query: string;
  sections: ReportSection[];
  summary: string;
  generatedAt: string;
}

// SSE event types for the live activity feed
export type ResearchSSEEvent =
  | { type: "tool_start"; payload: { tool: ResearchToolName; query: string } }
  | { type: "tool_done"; payload: { tool: ResearchToolName; durationMs: number; resultPreview: string } }
  | { type: "tool_error"; payload: { tool: ResearchToolName; error: string } }
  | { type: "status"; payload: { message: string } }
  | { type: "report_chunk"; payload: { sectionId: string; title: string; content: string } }
  | { type: "complete"; payload: { sessionId: string; report: ResearchReport } }
  | { type: "error"; payload: { message: string } };

export interface ResearchSessionSummary {
  id: string;
  title: string;
  query: string;
  status: ResearchStatus;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

// ===== Cross-App Communication Types =====

export type CrossAppTaskType =
  | "generate-image-prompt"
  | "generate-text-prompt"
  | "research-context";

export type CrossAppTaskStatus = "pending" | "accepted" | "completed" | "failed";
