"use client";

import { useState, useEffect, useCallback } from "react";

interface StrategistSessionSummary {
  id: string;
  title: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useStrategistSessions() {
  const [sessions, setSessions] = useState<StrategistSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/strategist");
      if (res.ok) setSessions(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const createSession = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/strategist", { method: "POST" });
      if (res.ok) { const d = await res.json(); await fetchSessions(); return d.sessionId; }
    } catch {} return null;
  };

  const deleteSession = async (id: string) => {
    setSessions((p) => p.filter((s) => s.id !== id));
    try { await fetch(`/api/strategist/${id}`, { method: "DELETE" }); } catch { await fetchSessions(); }
  };

  const toggleStar = async (id: string) => {
    const item = sessions.find((s) => s.id === id);
    if (!item) return;
    const n = !item.starred;
    setSessions((p) => p.map((s) => s.id === id ? { ...s, starred: n } : s));
    try { await fetch(`/api/strategist/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred: n }) }); } catch { setSessions((p) => p.map((s) => s.id === id ? { ...s, starred: !n } : s)); }
  };

  return { sessions, loading, createSession, deleteSession, toggleStar, refetch: fetchSessions };
}
