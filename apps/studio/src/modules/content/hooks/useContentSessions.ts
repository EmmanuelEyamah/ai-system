"use client";

import { useState, useEffect, useCallback } from "react";

interface ContentSessionSummary {
  id: string;
  title: string;
  status: string;
  platforms: string[];
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useContentSessions() {
  const [sessions, setSessions] = useState<ContentSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/content");
      if (res.ok) setSessions(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/content", { method: "POST" });
      if (res.ok) { const d = await res.json(); await fetchSessions(); return d.sessionId; }
    } catch {} return null;
  };

  const deleteSession = async (id: string) => {
    setSessions((p) => p.filter((s) => s.id !== id));
    try { await fetch(`/api/content/${id}`, { method: "DELETE" }); } catch { await fetchSessions(); }
  };

  const toggleStar = async (id: string) => {
    const item = sessions.find((s) => s.id === id);
    if (!item) return;
    const newStarred = !item.starred;
    setSessions((p) => p.map((s) => s.id === id ? { ...s, starred: newStarred } : s));
    try {
      await fetch(`/api/content/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred: newStarred }) });
    } catch {
      setSessions((p) => p.map((s) => s.id === id ? { ...s, starred: !newStarred } : s));
    }
  };

  return { sessions, loading, createSession, deleteSession, toggleStar, refetch: fetchSessions };
}
