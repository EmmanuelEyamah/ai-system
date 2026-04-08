"use client";

import { useState, useCallback } from "react";

interface StratMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useStrategist(sessionId: string) {
  const [messages, setMessages] = useState<StratMessage[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/strategist/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTitle(data.title || "");
        setLoading(false);
      } else {
        setError("Not found");
        setLoading(false);
      }
    } catch {
      setError("Failed to load");
      setLoading(false);
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (message: string) => {
    setSending(true);
    setError(null);

    const userMsg: StratMessage = { id: `temp-${Date.now()}`, role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`/api/strategist/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();

      if (res.ok && data.message) {
        const assistantMsg: StratMessage = { id: `resp-${Date.now()}`, role: "assistant", content: data.message };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        setError(data.error || "Failed to get response");
      }
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
    }
  }, [sessionId]);

  return { messages, title, loading, sending, error, fetchSession, sendMessage };
}
