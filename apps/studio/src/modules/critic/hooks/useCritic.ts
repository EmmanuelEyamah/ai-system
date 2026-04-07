"use client";

import { useState, useCallback, useRef } from "react";

interface CriticMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: { type?: string; showConfirmButtons?: boolean };
}

interface Verdict {
  viabilityScore?: number;
  viabilityLabel?: string;
  realityCheck?: { title: string; strengths: string[]; weaknesses: string[]; competitors: { name: string; what_they_do: string; their_weakness: string }[]; marketData: string };
  upgradedVersion?: { title: string; originalIdea: string; improvedIdea: string; positioning: string; targetAudience: string; keyDifferentiator: string };
  actionPlan?: { title: string; steps: { timeframe: string; action: string; why: string }[]; resources: string[]; socialCopy?: string };
}

interface CriticState {
  messages: CriticMessage[];
  verdict: Verdict | null;
  status: "conversation" | "researching" | "completed" | "failed";
  title: string;
  starred: boolean;
  showConfirmButtons: boolean;
  loading: boolean;
  sending: boolean;
  error: string | null;
  events: { type: string; payload: Record<string, unknown> }[];
}

export function useCritic(critiqueId: string) {
  const [state, setState] = useState<CriticState>({
    messages: [], verdict: null, status: "conversation", title: "", starred: false,
    showConfirmButtons: false, loading: true, sending: false, error: null, events: [],
  });
  const abortRef = useRef<AbortController | null>(null);

  const fetchCritique = useCallback(async () => {
    try {
      const res = await fetch(`/api/critic/${critiqueId}`);
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          messages: data.messages || [],
          verdict: data.verdictData || null,
          status: data.status,
          title: data.title,
          starred: data.starred,
          showConfirmButtons: data.messages?.some((m: CriticMessage) => m.metadata?.showConfirmButtons) && data.status === "conversation",
          loading: false,
        }));
      } else {
        setState((prev) => ({ ...prev, error: "Not found", loading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, error: "Failed to load", loading: false }));
    }
  }, [critiqueId]);

  const sendMessage = useCallback(async (message: string) => {
    setState((prev) => ({ ...prev, sending: true, showConfirmButtons: false, error: null }));

    const userMsg: CriticMessage = { id: `temp-${Date.now()}`, role: "user", content: message, metadata: {} };
    setState((prev) => ({ ...prev, messages: [...prev.messages, userMsg] }));

    try {
      const res = await fetch(`/api/critic/${critiqueId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      if (data.type === "trigger_verdict") {
        setState((prev) => ({ ...prev, sending: false, status: "researching" }));
        return "trigger_verdict";
      }

      if (res.ok && data.message) {
        const assistantMsg: CriticMessage = {
          id: `resp-${Date.now()}`,
          role: "assistant",
          content: data.message,
          metadata: { type: data.type, showConfirmButtons: data.showConfirmButtons },
        };
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, assistantMsg],
          showConfirmButtons: data.showConfirmButtons || false,
          sending: false,
        }));
      } else {
        setState((prev) => ({ ...prev, error: data.error || "Failed", sending: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, error: "Failed to send", sending: false }));
    }
    return null;
  }, [critiqueId]);

  const generateVerdict = useCallback(async () => {
    const result = await sendMessage("__GENERATE_VERDICT__");
    if (result === "trigger_verdict") {
      // Start SSE stream
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState((prev) => ({ ...prev, events: [], status: "researching" }));

      try {
        const response = await fetch(`/api/critic/${critiqueId}/stream`, {
          method: "POST",
          signal: controller.signal,
        });
        if (!response.body) throw new Error("No body");

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
                const event = JSON.parse(line.slice(6));
                setState((prev) => ({ ...prev, events: [...prev.events, event] }));

                if (event.type === "complete") {
                  setState((prev) => ({ ...prev, verdict: event.payload.verdict, status: "completed" }));
                }
                if (event.type === "error") {
                  setState((prev) => ({ ...prev, error: event.payload.message, status: "failed" }));
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setState((prev) => ({ ...prev, error: "Connection lost", status: "failed" }));
        }
      }
    }
  }, [critiqueId, sendMessage]);

  const addMore = useCallback(() => {
    setState((prev) => ({ ...prev, showConfirmButtons: false }));
  }, []);

  return { ...state, fetchCritique, sendMessage, generateVerdict, addMore };
}
