"use client";

import { useState, useEffect, useCallback } from "react";

interface CritiqueSummary {
  id: string;
  title: string;
  status: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useCritiques() {
  const [critiques, setCritiques] = useState<CritiqueSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCritiques = useCallback(async () => {
    try {
      const res = await fetch("/api/critic");
      if (res.ok) setCritiques(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCritiques(); }, [fetchCritiques]);

  const createCritique = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/critic", { method: "POST" });
      if (res.ok) { const d = await res.json(); await fetchCritiques(); return d.critiqueId; }
    } catch {} return null;
  };

  const deleteCritique = async (id: string) => {
    setCritiques((p) => p.filter((c) => c.id !== id));
    try { await fetch(`/api/critic/${id}`, { method: "DELETE" }); } catch { await fetchCritiques(); }
  };

  const toggleStar = async (id: string) => {
    const item = critiques.find((c) => c.id === id);
    if (!item) return;
    const newStarred = !item.starred;
    setCritiques((p) => p.map((c) => c.id === id ? { ...c, starred: newStarred } : c));
    try {
      await fetch(`/api/critic/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred: newStarred }) });
    } catch {
      setCritiques((p) => p.map((c) => c.id === id ? { ...c, starred: !newStarred } : c));
    }
  };

  const starredCritiques = critiques.filter((c) => c.starred);
  const recentCritiques = critiques.filter((c) => !c.starred);

  return { critiques, starredCritiques, recentCritiques, loading, createCritique, deleteCritique, toggleStar, refetch: fetchCritiques };
}
