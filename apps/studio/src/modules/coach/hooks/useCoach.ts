"use client";

import { useState, useCallback } from "react";

interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metadata?: { persona?: string };
}

export function useCoach(sessionId: string) {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [title, setTitle] = useState("");
  const [persona, setPersona] = useState("auto");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/coach/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setTitle(data.title || "");
        setPersona(data.persona || "auto");
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

  const sendMessage = useCallback(async (message: string, images?: { data: string; mimeType: string }[]) => {
    setSending(true);
    setError(null);

    const userMsg: CoachMessage = { id: `temp-${Date.now()}`, role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch(`/api/coach/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, images }),
      });
      const data = await res.json();

      if (res.ok && data.message) {
        const assistantMsg: CoachMessage = {
          id: `resp-${Date.now()}`, role: "assistant", content: data.message,
          metadata: { persona: data.persona },
        };
        setMessages((prev) => [...prev, assistantMsg]);
        if (data.persona && data.persona !== "auto") setPersona(data.persona);
      } else {
        setError(data.error || "Failed to get response");
      }
    } catch {
      setError("Failed to send");
    } finally {
      setSending(false);
    }
  }, [sessionId]);

  const changePersona = useCallback(async (newPersona: string) => {
    setPersona(newPersona);
    try {
      await fetch(`/api/coach/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: newPersona }),
      });
    } catch {}
  }, [sessionId]);

  return { messages, title, persona, loading, sending, error, fetchSession, sendMessage, changePersona };
}
