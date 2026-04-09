"use client";

import { useState, useEffect, useCallback } from "react";

interface CoachSessionSummary {
  id: string;
  title: string;
  persona: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useCoachSessions() {
  const [sessions, setSessions] = useState<CoachSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/coach");
      if (res.ok) setSessions(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = async (persona?: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: persona || "auto" }),
      });
      if (res.ok) { const d = await res.json(); await fetchSessions(); return d.sessionId; }
    } catch {} return null;
  };

  const deleteSession = async (id: string) => {
    setSessions((p) => p.filter((s) => s.id !== id));
    try { await fetch(`/api/coach/${id}`, { method: "DELETE" }); } catch { await fetchSessions(); }
  };

  const toggleStar = async (id: string) => {
    const item = sessions.find((s) => s.id === id);
    if (!item) return;
    const n = !item.starred;
    setSessions((p) => p.map((s) => s.id === id ? { ...s, starred: n } : s));
    try { await fetch(`/api/coach/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred: n }) }); } catch { setSessions((p) => p.map((s) => s.id === id ? { ...s, starred: !n } : s)); }
  };

  return { sessions, loading, createSession, deleteSession, toggleStar, refetch: fetchSessions };
}
