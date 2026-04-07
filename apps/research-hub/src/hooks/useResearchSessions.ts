"use client";

import { useState, useEffect, useCallback } from "react";
import type { ResearchSessionSummary } from "@ai-system/shared-types";

export function useResearchSessions() {
  const [sessions, setSessions] = useState<ResearchSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/research");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const createSession = async (query: string, researchModel?: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, researchModel }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchSessions();
        return data.sessionId;
      }
    } catch {
      // silently fail
    }
    return null;
  };

  const deleteSession = async (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    try {
      await fetch(`/api/research/${id}`, { method: "DELETE" });
    } catch {
      await fetchSessions();
    }
  };

  const toggleStar = async (id: string) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;
    const newStarred = !session.starred;

    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, starred: newStarred } : s))
    );

    try {
      await fetch(`/api/research/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: newStarred }),
      });
    } catch {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, starred: !newStarred } : s))
      );
    }
  };

  const starredSessions = sessions.filter((s) => s.starred);
  const recentSessions = sessions.filter((s) => !s.starred);

  return {
    sessions,
    starredSessions,
    recentSessions,
    loading,
    createSession,
    deleteSession,
    toggleStar,
    refetch: fetchSessions,
  };
}
