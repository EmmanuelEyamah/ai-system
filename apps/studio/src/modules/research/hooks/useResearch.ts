"use client";

import { useState, useCallback, useRef } from "react";
import type {
  ResearchSSEEvent,
  ResearchReport,
  ResearchStatus,
  ReportSection,
} from "@ai-system/shared-types";

function sanitizeReport(raw: Record<string, unknown> | null): ResearchReport | null {
  if (!raw) return null;
  const report = raw as unknown as ResearchReport;

  // Clean summary — remove Claude preamble like "Excellent! I now have..."
  let summary = report.summary || "";
  if (summary.includes("```json") || summary.includes('"summary"')) {
    // Summary contains raw JSON — extract the actual summary value
    const match = summary.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    summary = match ? match[1].replace(/\\n/g, "\n").replace(/\\"/g, '"') : "";
  }
  if (summary.match(/^(Excellent|Great|Perfect|Let me)/i)) {
    // Strip preamble lines
    const lines = summary.split("\n").filter(
      (l) => !l.match(/^(Excellent|Great|Perfect|Let me|I now have)/i) && l.trim()
    );
    summary = lines.join("\n");
  }

  // If sections is a single "full_report" with raw JSON content, try to re-parse
  if (
    report.sections?.length === 1 &&
    report.sections[0].id === "full_report" &&
    report.sections[0].content.includes('"sections"')
  ) {
    const content = report.sections[0].content;
    const jsonStart = content.search(/\{\s*"summary"/);
    if (jsonStart !== -1) {
      try {
        const jsonStr = content.slice(jsonStart);
        // Try to repair truncated JSON
        const lastBrace = jsonStr.lastIndexOf("}");
        const repairs = [jsonStr, jsonStr.slice(0, lastBrace + 1) + "]}", jsonStr.slice(0, lastBrace + 1)];
        for (const attempt of repairs) {
          try {
            const parsed = JSON.parse(attempt);
            if (parsed.sections?.length > 0) {
              return {
                query: report.query,
                summary: parsed.summary || summary,
                sections: parsed.sections.filter(
                  (s: Partial<ReportSection>) => s.content && (s.content as string).length > 20
                ).map((s: Partial<ReportSection>, i: number) => ({
                  id: s.id || `section_${i}`,
                  title: s.title || `Section ${i + 1}`,
                  content: s.content || "",
                  sources: s.sources || [],
                  order: s.order || i + 1,
                })),
                generatedAt: report.generatedAt,
              };
            }
          } catch {
            // try next repair
          }
        }
      } catch {
        // leave as-is
      }
    }
  }

  return { ...report, summary };
}

interface ResearchMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface UseResearchState {
  events: ResearchSSEEvent[];
  report: ResearchReport | null;
  status: ResearchStatus;
  messages: ResearchMessage[];
  query: string;
  title: string;
  starred: boolean;
  loading: boolean;
  error: string | null;
  sending: boolean;
}

export function useResearch(sessionId: string) {
  const [state, setState] = useState<UseResearchState>({
    events: [],
    report: null,
    status: "pending",
    messages: [],
    query: "",
    title: "",
    starred: false,
    loading: true,
    error: null,
    sending: false,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/research/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          status: data.status,
          query: data.query,
          title: data.title,
          starred: data.starred,
          report: sanitizeReport(data.reportData),
          messages: data.messages || [],
          loading: false,
        }));
      } else {
        setState((prev) => ({ ...prev, error: "Session not found", loading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, error: "Failed to load session", loading: false }));
    }
  }, [sessionId]);

  const startResearch = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({
      ...prev,
      status: "researching",
      events: [],
      error: null,
    }));

    fetch(`/api/research/${sessionId}/stream`, {
      method: "POST",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.body) throw new Error("No response body");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6)) as ResearchSSEEvent;
                setState((prev) => ({
                  ...prev,
                  events: [...prev.events, event],
                }));

                if (event.type === "complete") {
                  setState((prev) => ({
                    ...prev,
                    report: sanitizeReport(event.payload.report as unknown as Record<string, unknown>),
                    status: "completed",
                  }));
                }

                if (event.type === "error") {
                  setState((prev) => ({
                    ...prev,
                    error: event.payload.message,
                    status: "failed",
                  }));
                }
              } catch {
                // skip malformed events
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setState((prev) => ({
            ...prev,
            error: "Connection lost. Refresh to check status.",
            status: "failed",
          }));
        }
      });

    return () => controller.abort();
  }, [sessionId]);

  const sendFollowUp = useCallback(
    async (message: string) => {
      setState((prev) => ({ ...prev, sending: true }));

      const userMessage: ResearchMessage = {
        id: `temp-${Date.now()}`,
        role: "user",
        content: message,
        createdAt: new Date().toISOString(),
      };
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      try {
        const res = await fetch(`/api/research/${sessionId}/followup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        const data = await res.json();

        if (res.ok && data.content) {
          const assistantMessage: ResearchMessage = {
            id: data.id || `resp-${Date.now()}`,
            role: "assistant",
            content: data.content,
            createdAt: new Date().toISOString(),
          };
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, assistantMessage],
            sending: false,
            error: null,
          }));
        } else {
          const errMsg = data.error || "Follow-up returned no response";
          console.error("Follow-up error:", data);
          setState((prev) => ({
            ...prev,
            error: errMsg,
            sending: false,
          }));
        }
      } catch {
        setState((prev) => ({
          ...prev,
          error: "Failed to send follow-up",
          sending: false,
        }));
      }
    },
    [sessionId]
  );

  return {
    ...state,
    fetchSession,
    startResearch,
    sendFollowUp,
  };
}
