"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface SidebarItem {
  id: string;
  title: string;
  starred: boolean;
  updatedAt: string;
  persona?: string;
}

interface SidebarData {
  chats: SidebarItem[];
  research: SidebarItem[];
  critiques: SidebarItem[];
  trends: SidebarItem[];
  content: SidebarItem[];
  strategist: SidebarItem[];
  coach: SidebarItem[];
}

interface StudioContextType {
  data: SidebarData;
  loading: boolean;
  refetch: () => Promise<void>;
  // Optimistic updates
  addItem: (module: keyof SidebarData, item: SidebarItem) => void;
  removeItem: (module: keyof SidebarData, id: string) => void;
  updateItem: (module: keyof SidebarData, id: string, updates: Partial<SidebarItem>) => void;
}

const EMPTY: SidebarData = {
  chats: [], research: [], critiques: [], trends: [],
  content: [], strategist: [], coach: [],
};

const StudioContext = createContext<StudioContextType>({
  data: EMPTY, loading: true, refetch: async () => {},
  addItem: () => {}, removeItem: () => {}, updateItem: () => {},
});

export function useStudio() {
  return useContext(StudioContext);
}

export function StudioProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SidebarData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [fetched, setFetched] = useState(false);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/sidebar");
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {} finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  // Fetch once on mount
  useEffect(() => {
    if (!fetched) refetch();
  }, [fetched, refetch]);

  // Optimistic add
  const addItem = useCallback((module: keyof SidebarData, item: SidebarItem) => {
    setData((prev) => ({
      ...prev,
      [module]: [item, ...prev[module]],
    }));
  }, []);

  // Optimistic remove
  const removeItem = useCallback((module: keyof SidebarData, id: string) => {
    setData((prev) => ({
      ...prev,
      [module]: prev[module].filter((i) => i.id !== id),
    }));
  }, []);

  // Optimistic update (star, title, etc.)
  const updateItem = useCallback((module: keyof SidebarData, id: string, updates: Partial<SidebarItem>) => {
    setData((prev) => ({
      ...prev,
      [module]: prev[module].map((i) => i.id === id ? { ...i, ...updates } : i),
    }));
  }, []);

  return (
    <StudioContext.Provider value={{ data, loading, refetch, addItem, removeItem, updateItem }}>
      {children}
    </StudioContext.Provider>
  );
}
