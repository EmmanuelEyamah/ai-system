"use client";

import { useState, useEffect, useCallback } from "react";

interface TrendSessionSummary {
  id: string;
  title: string;
  query: string;
  platforms: string[];
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useTrendSessions() {
  const [sessions, setSessions] = useState<TrendSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/trends");
      if (res.ok) setSessions(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = async (query: string, platforms: string[]): Promise<string | null> => {
    try {
      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, platforms }),
      });
      if (res.ok) { const d = await res.json(); await fetchSessions(); return d.sessionId; }
    } catch {} return null;
  };

  const deleteSession = async (id: string) => {
    setSessions((p) => p.filter((s) => s.id !== id));
    try { await fetch(`/api/trends/${id}`, { method: "DELETE" }); } catch { await fetchSessions(); }
  };

  const toggleStar = async (id: string) => {
    const item = sessions.find((s) => s.id === id);
    if (!item) return;
    const newStarred = !item.starred;
    setSessions((p) => p.map((s) => s.id === id ? { ...s, starred: newStarred } : s));
    try {
      await fetch(`/api/trends/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred: newStarred }) });
    } catch {
      setSessions((p) => p.map((s) => s.id === id ? { ...s, starred: !newStarred } : s));
    }
  };

  return { sessions, loading, createSession, deleteSession, toggleStar, refetch: fetchSessions };
}
