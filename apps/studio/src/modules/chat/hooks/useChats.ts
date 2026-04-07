"use client";

import { useState, useEffect, useCallback } from "react";

interface Chat {
  id: string;
  title: string;
  taskType: string | null;
  status: string;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const createChat = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/chat", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        await fetchChats();
        return data.chatId;
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
    return null;
  };

  const deleteChat = async (id: string) => {
    try {
      await fetch(`/api/chat/${id}`, { method: "DELETE" });
      setChats((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const toggleStar = async (id: string) => {
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;

    const newStarred = !chat.starred;

    // Optimistic update
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, starred: newStarred } : c))
    );

    try {
      await fetch(`/api/chat/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: newStarred }),
      });
    } catch (error) {
      // Revert on failure
      setChats((prev) =>
        prev.map((c) => (c.id === id ? { ...c, starred: !newStarred } : c))
      );
      console.error("Failed to toggle star:", error);
    }
  };

  const starredChats = chats.filter((c) => c.starred);
  const recentChats = chats.filter((c) => !c.starred);

  return {
    chats,
    starredChats,
    recentChats,
    loading,
    createChat,
    deleteChat,
    toggleStar,
    refetch: fetchChats,
  };
}
