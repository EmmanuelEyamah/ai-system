"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2, User, Bot, Link2, X } from "lucide-react";
import { MarkdownRenderer, LoadingDots } from "@ai-system/shared-ui";
import { ReferenceButton } from "@/components/shared/ReferenceButton";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function FollowUpChat({
  messages,
  sending,
  onSendMessage,
}: {
  messages: ChatMessage[];
  sending: boolean;
  onSendMessage: (message: string) => void;
}) {
  const [input, setInput] = useState("");
  const [reference, setReference] = useState<{ title: string; context: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || sending) return;
    const msg = reference ? `${reference.context}\n\n${input.trim()}` : input.trim();
    setReference(null);
    onSendMessage(msg);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  return (
    <div className="mt-8 border-t border-white/4 pt-6">
      <h3 className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-4">
        Follow-up Questions
      </h3>

      {/* Messages */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="max-h-96 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-white/5 border border-white/8"
                    : "bg-cyan-500/10 border border-cyan-500/15"
                }`}
              >
                {msg.role === "user" ? (
                  <User size={13} className="text-zinc-400" />
                ) : (
                  <Bot size={13} className="text-cyan-400" />
                )}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <MarkdownRenderer content={msg.content} />
              </div>
            </motion.div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center shrink-0">
                <Bot size={13} className="text-cyan-400" />
              </div>
              <div className="pt-2">
                <LoadingDots />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="bg-white/2 border border-white/5 rounded-xl p-1.5">
        {reference && (
          <div className="flex items-center gap-2 px-3 pt-2 pb-1">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/15 text-[11px] text-violet-400">
              <Link2 size={10} />
              <span className="truncate max-w-48">{reference.title}</span>
              <button onClick={() => setReference(null)} className="hover:text-violet-300 ml-0.5"><X size={10} /></button>
            </div>
          </div>
        )}
        <div className="flex items-end gap-2">
          <ReferenceButton onReference={(context, title) => setReference({ title, context })} />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask a follow-up question about this research..."
            rows={1}
            className="flex-1 px-3 py-2.5 bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-zinc-600 text-black transition-all shrink-0 mb-0.5"
          >
            {sending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
