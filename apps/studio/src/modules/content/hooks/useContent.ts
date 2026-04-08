"use client";

import { useState, useCallback } from "react";

interface ContentMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: { type?: string; showConfirmButtons?: boolean };
}

interface ContentPost {
  platform: string;
  formatType: string;
  formatReason: string;
  score: number;
  scoreBreakdown?: { trendAlignment: number; hookStrength: number; platformFit: number; timing: number; brandFit: number };
  hook: string;
  content: string;
  cta: string;
  hashtags: string[];
  postingTime: string;
  postingReason: string;
  strategistNote: string;
  estimatedReach: string;
  repurposeAs: string;
}

interface ContentData {
  posts?: ContentPost[];
  overallStrategy?: string;
  repurposeChain?: string;
}

interface ContentState {
  messages: ContentMessage[];
  contentData: ContentData | null;
  status: "conversation" | "generating" | "completed" | "failed";
  title: string;
  showConfirmButtons: boolean;
  loading: boolean;
  sending: boolean;
  generating: boolean;
  error: string | null;
}

export function useContent(sessionId: string) {
  const [state, setState] = useState<ContentState>({
    messages: [], contentData: null, status: "conversation", title: "",
    showConfirmButtons: false, loading: true, sending: false, generating: false, error: null,
  });

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/content/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          messages: data.messages || [],
          contentData: data.contentData || null,
          status: data.status,
          title: data.title,
          showConfirmButtons: data.messages?.some((m: ContentMessage) => m.metadata?.showConfirmButtons) && data.status === "conversation",
          loading: false,
        }));
      } else {
        setState((prev) => ({ ...prev, error: "Not found", loading: false }));
      }
    } catch {
      setState((prev) => ({ ...prev, error: "Failed to load", loading: false }));
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (message: string, images?: { data: string; mimeType: string }[]) => {
    setState((prev) => ({ ...prev, sending: true, showConfirmButtons: false, error: null }));

    const userMsg: ContentMessage = { id: `temp-${Date.now()}`, role: "user", content: message };
    setState((prev) => ({ ...prev, messages: [...prev.messages, userMsg] }));

    try {
      const res = await fetch(`/api/content/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, images }),
      });
      const data = await res.json();

      if (data.type === "trigger_generate") {
        setState((prev) => ({ ...prev, sending: false, status: "generating" }));
        return "trigger_generate";
      }

      if (res.ok && data.message) {
        const assistantMsg: ContentMessage = {
          id: `resp-${Date.now()}`, role: "assistant", content: data.message,
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
  }, [sessionId]);

  const generateContent = useCallback(async () => {
    const result = await sendMessage("__GENERATE_CONTENT__");
    if (result === "trigger_generate") {
      setState((prev) => ({ ...prev, generating: true }));
      try {
        const res = await fetch(`/api/content/${sessionId}/generate`, { method: "POST" });
        const data = await res.json();
        if (res.ok && data.contentData) {
          setState((prev) => ({
            ...prev, contentData: data.contentData, status: "completed", generating: false,
          }));
        } else {
          setState((prev) => ({ ...prev, error: data.error || "Generation failed", status: "failed", generating: false }));
        }
      } catch {
        setState((prev) => ({ ...prev, error: "Generation failed", status: "failed", generating: false }));
      }
    }
  }, [sessionId, sendMessage]);

  const repurposePost = useCallback(async (post: ContentPost, targetPlatform: string) => {
    try {
      const res = await fetch(`/api/content/${sessionId}/repurpose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "repurpose", post, targetPlatform }),
      });
      if (res.ok) {
        const data = await res.json();
        setState((prev) => {
          const posts = [...(prev.contentData?.posts || []), data.post];
          return { ...prev, contentData: { ...prev.contentData, posts } };
        });
      }
    } catch {}
  }, [sessionId]);

  const sendFeedback = useCallback(async (postContent: string, feedback: string) => {
    setState((prev) => ({ ...prev, sending: true }));
    try {
      const res = await fetch(`/api/content/${sessionId}/repurpose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "feedback", post: postContent, feedback }),
      });
      if (res.ok) {
        const data = await res.json();
        const userMsg: ContentMessage = { id: `fb-${Date.now()}`, role: "user", content: `Performance feedback: ${feedback}` };
        const assistantMsg: ContentMessage = { id: `fba-${Date.now()}`, role: "assistant", content: data.analysis };
        setState((prev) => ({
          ...prev, messages: [...prev.messages, userMsg, assistantMsg], sending: false,
        }));
      }
    } catch {
      setState((prev) => ({ ...prev, error: "Feedback failed", sending: false }));
    }
  }, [sessionId]);

  const addMore = useCallback(() => {
    setState((prev) => ({ ...prev, showConfirmButtons: false }));
  }, []);

  return { ...state, fetchSession, sendMessage, generateContent, repurposePost, sendFeedback, addMore };
}
