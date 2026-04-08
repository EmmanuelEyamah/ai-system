"use client";

import { useState, useCallback } from "react";

interface TrendItem {
  platform: string;
  title: string;
  url: string;
  author?: string;
  engagement: Record<string, number>;
  postedAt?: string;
  snippet?: string;
  trendScore: number;
}

interface TrendsState {
  results: TrendItem[];
  analysis: Record<string, unknown> | null;
  ideas: { ideas?: { platform: string; title: string; format: string; hook: string; gapItFills: string; estimatedPerformance: string; whyNow: string }[] } | null;
  calendar: { days?: { day: string; platform: string; contentType: string; topic: string; bestTime: string; notes: string }[] } | null;
  sessionTitle: string;
  sessionQuery: string;
  searching: boolean;
  analyzing: boolean;
  generatingIdeas: boolean;
  generatingCalendar: boolean;
  loadingPlatforms: string[];
  error: string | null;
}

export function useTrends(sessionId: string) {
  const [state, setState] = useState<TrendsState>({
    results: [], analysis: null, ideas: null, calendar: null,
    sessionTitle: "", sessionQuery: "",
    searching: false, analyzing: false, generatingIdeas: false, generatingCalendar: false,
    loadingPlatforms: [], error: null,
  });

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/trends/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({
          ...prev,
          results: (data.trendResults as TrendItem[]) || [],
          analysis: data.analysis || null,
          ideas: data.ideas || null,
          calendar: data.calendar || null,
          sessionTitle: data.title || "",
          sessionQuery: data.query || "",
        }));
      }
    } catch {}
  }, [sessionId]);

  const searchTrends = useCallback(async () => {
    setState((prev) => ({ ...prev, searching: true, error: null, results: [] }));

    try {
      const res = await fetch(`/api/trends/${sessionId}`, { method: "POST" });
      if (!res.body) throw new Error("No body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "platform_start") {
              setState((prev) => ({ ...prev, loadingPlatforms: [...prev.loadingPlatforms, event.platform] }));
            }
            if (event.type === "platform_done") {
              setState((prev) => ({ ...prev, loadingPlatforms: prev.loadingPlatforms.filter((p) => p !== event.platform) }));
            }
            if (event.type === "results") {
              setState((prev) => ({ ...prev, results: event.results }));
            }
            if (event.type === "platform_results") {
              setState((prev) => {
                const merged = [...prev.results, ...event.items].sort((a: TrendItem, b: TrendItem) => b.trendScore - a.trendScore);
                return { ...prev, results: merged };
              });
            }
            if (event.type === "complete") {
              setState((prev) => ({ ...prev, results: event.results, searching: false, loadingPlatforms: [] }));
            }
          } catch {}
        }
      }
    } catch {
      setState((prev) => ({ ...prev, error: "Search failed", searching: false }));
    }
  }, [sessionId]);

  const analyzeTrends = useCallback(async () => {
    setState((prev) => ({ ...prev, analyzing: true, error: null }));
    try {
      const res = await fetch(`/api/trends/${sessionId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setState((prev) => ({ ...prev, analysis: data.analysis, analyzing: false }));
      else setState((prev) => ({ ...prev, error: data.error, analyzing: false }));
    } catch {
      setState((prev) => ({ ...prev, error: "Analysis failed", analyzing: false }));
    }
  }, [sessionId]);

  const generateIdeas = useCallback(async () => {
    setState((prev) => ({ ...prev, generatingIdeas: true, error: null }));
    try {
      const res = await fetch(`/api/trends/${sessionId}/ideas`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setState((prev) => ({ ...prev, ideas: data.ideas, generatingIdeas: false }));
      else setState((prev) => ({ ...prev, error: data.error, generatingIdeas: false }));
    } catch {
      setState((prev) => ({ ...prev, error: "Failed to generate ideas", generatingIdeas: false }));
    }
  }, [sessionId]);

  const generateCalendar = useCallback(async () => {
    setState((prev) => ({ ...prev, generatingCalendar: true, error: null }));
    try {
      const res = await fetch(`/api/trends/${sessionId}/calendar`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setState((prev) => ({ ...prev, calendar: data.calendar, generatingCalendar: false }));
      else setState((prev) => ({ ...prev, error: data.error, generatingCalendar: false }));
    } catch {
      setState((prev) => ({ ...prev, error: "Failed to generate calendar", generatingCalendar: false }));
    }
  }, [sessionId]);

  return { ...state, fetchSession, searchTrends, analyzeTrends, generateIdeas, generateCalendar };
}
