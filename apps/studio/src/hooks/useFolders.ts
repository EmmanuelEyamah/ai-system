"use client";

import { useState, useEffect, useCallback } from "react";

interface FolderItem {
  id: string;
  itemType: string;
  itemId: string;
  itemTitle: string;
}

interface Folder {
  id: string;
  name: string;
  description?: string;
  color: string;
  items: FolderItem[];
  createdAt: string;
  updatedAt: string;
}

export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/folders");
      if (res.ok) setFolders(await res.json());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const createFolder = async (name: string, description?: string, color?: string): Promise<string | null> => {
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });
      if (res.ok) { const d = await res.json(); await fetchFolders(); return d.id; }
    } catch {} return null;
  };

  const deleteFolder = async (id: string) => {
    setFolders((p) => p.filter((f) => f.id !== id));
    try { await fetch(`/api/folders/${id}`, { method: "DELETE" }); } catch { await fetchFolders(); }
  };

  const addToFolder = async (folderId: string, itemType: string, itemId: string, itemTitle: string) => {
    try {
      const res = await fetch(`/api/folders/${folderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, itemTitle }),
      });
      if (res.ok) await fetchFolders();
      return res.ok;
    } catch { return false; }
  };

  const removeFromFolder = async (folderId: string, itemId: string) => {
    try {
      await fetch(`/api/folders/${folderId}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      await fetchFolders();
    } catch {}
  };

  return { folders, loading, createFolder, deleteFolder, addToFolder, removeFromFolder, refetch: fetchFolders };
}
