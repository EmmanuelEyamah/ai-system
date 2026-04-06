"use client";

import { useState, useCallback, useRef } from "react";
import { DEFAULT_MODEL_SELECTION, type ModelSelection } from "@/lib/models";

interface Message {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
}

interface Prompt {
  id: string;
  variant: string;
  modelTarget: string;
  content: string;
  score: number | null;
  explanation: string | null;
}

interface ChatState {
  messages: Message[];
  prompts: Prompt[];
  models: ModelSelection;
  loading: boolean;
  sending: boolean;
  error: string | null;
  showConfirmButtons: boolean;
}

export function useChat(chatId: string) {
  const [state, setState] = useState<ChatState>({
    messages: [],
    prompts: [],
    models: { ...DEFAULT_MODEL_SELECTION },
    loading: true,
    sending: false,
    error: null,
    showConfirmButtons: false,
  });
  const lastMessageRef = useRef<string | null>(null);

  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/${chatId}`);
      if (res.ok) {
        const data = await res.json();

        // Check if the last assistant message has showConfirmButtons
        const lastMsg = data.messages?.[data.messages.length - 1];
        const showButtons = lastMsg?.metadata?.showConfirmButtons === true;

        setState((prev) => ({
          ...prev,
          messages: (data.messages || []).map((m: Message) => ({
            role: m.role,
            content: m.content,
            metadata: m.metadata,
          })),
          prompts: data.prompts || [],
          models: {
            analysisModel: data.analysisModel || DEFAULT_MODEL_SELECTION.analysisModel,
            generationModel: data.generationModel || DEFAULT_MODEL_SELECTION.generationModel,
          },
          loading: false,
          error: null,
          showConfirmButtons: showButtons,
        }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: res.status === 404 ? "Chat not found" : "Failed to load chat",
        }));
      }
    } catch {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load chat",
      }));
    }
  }, [chatId]);

  const sendMessage = async (message: string) => {
    lastMessageRef.current = message;

    const isGenerate = message === "__GENERATE_PROMPTS__";

    setState((prev) => ({
      ...prev,
      sending: true,
      error: null,
      showConfirmButtons: false,
      messages: isGenerate
        ? prev.messages
        : [...prev.messages, { role: "user", content: message }],
    }));

    try {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to send message");
      }

      const data = await res.json();

      setState((prev) => ({
        ...prev,
        sending: false,
        messages: [
          ...prev.messages,
          { role: "assistant", content: data.message, metadata: { type: data.type, showConfirmButtons: data.showConfirmButtons } },
        ],
        prompts: data.prompts?.length ? data.prompts : prev.prompts,
        showConfirmButtons: data.showConfirmButtons || false,
      }));

      return data;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        sending: false,
        error: err instanceof Error ? err.message : "Failed to get response.",
        messages: isGenerate ? prev.messages : prev.messages.slice(0, -1),
      }));
      return null;
    }
  };

  const generatePrompts = () => sendMessage("__GENERATE_PROMPTS__");

  const regeneratePrompts = async () => {
    setState((prev) => ({ ...prev, sending: true, error: null }));
    try {
      const res = await fetch(`/api/chat/${chatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "__GENERATE_PROMPTS__" }),
      });
      if (!res.ok) throw new Error("Failed to regenerate");
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        sending: false,
        prompts: data.prompts?.length ? data.prompts : prev.prompts,
        messages: [
          ...prev.messages,
          { role: "assistant", content: data.message, metadata: { type: "prompts" } },
        ],
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        sending: false,
        error: err instanceof Error ? err.message : "Regeneration failed.",
      }));
    }
  };

  const addMore = () => {
    setState((prev) => ({ ...prev, showConfirmButtons: false }));
  };

  const retry = async () => {
    const msg = lastMessageRef.current;
    if (!msg) return;
    await sendMessage(msg);
  };

  const updateModels = async (models: ModelSelection) => {
    setState((prev) => ({ ...prev, models }));
    try {
      await fetch(`/api/chat/${chatId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(models),
      });
    } catch { /* silent */ }
  };

  return {
    ...state,
    fetchChat,
    sendMessage,
    generatePrompts,
    regeneratePrompts,
    addMore,
    retry,
    updateModels,
  };
}
