"use client";

import { use, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, Lightbulb, Zap, PlusCircle, User, Bot, Link2, X, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { VerdictDisplay } from "@/modules/critic/components/VerdictDisplay";
import { ReferenceButton } from "@/components/shared/ReferenceButton";
import { useCritic } from "@/modules/critic/hooks/useCritic";
import { MarkdownRenderer, LoadingDots } from "@ai-system/shared-ui";

export default function CriticPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    messages, verdict, status, showConfirmButtons,
    loading, sending, error, events,
    fetchCritique, sendMessage, generateVerdict, addMore,
  } = useCritic(id);

  const [input, setInput] = useState("");
  const [reference, setReference] = useState<{ title: string; context: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchCritique(); }, [fetchCritique]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, events]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    // Prepend reference context if attached
    const msg = reference
      ? `${reference.context}\n\n${input.trim()}`
      : input.trim();
    setReference(null);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(msg);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="text-violet-400 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/4 pl-14 pr-4 md:px-6 py-3 shrink-0"
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-400" />
            <span className="text-[12px] font-medium text-amber-400">Idea Critic</span>
            <span className="text-zinc-700">|</span>
            <span className="text-[12px] text-zinc-500">
              {status === "conversation" ? "Tell me your idea..." : status === "researching" ? "Researching..." : status === "completed" ? "Verdict ready" : ""}
            </span>
          </div>
        </motion.header>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb size={24} className="text-amber-400" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-200 mb-2">Drop your idea</h2>
                <p className="text-[13px] text-zinc-500 max-w-sm mx-auto">
                  Tell me what you're thinking — a product, a post, a business, anything. I'll ask a few questions, research it, and give you an honest verdict.
                </p>
              </motion.div>
            )}

            {/* Messages */}
            {messages.filter((msg) => msg.content !== "__GENERATE_VERDICT__").map((msg, i) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex gap-3 mb-4"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-white/5 border border-white/8" : "bg-amber-500/10 border border-amber-500/15"
                }`}>
                  {msg.role === "user" ? <User size={13} className="text-zinc-400" /> : <Bot size={13} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <MarkdownRenderer content={msg.content} />
                </div>
              </motion.div>
            ))}

            {/* Sending indicator */}
            {sending && (
              <div className="flex gap-3 mb-4">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0">
                  <Bot size={13} className="text-amber-400" />
                </div>
                <div className="pt-2"><LoadingDots /></div>
              </div>
            )}

            {/* Confirm buttons */}
            <AnimatePresence>
              {showConfirmButtons && !sending && status === "conversation" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 py-4"
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={generateVerdict}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[13px] transition-all"
                  >
                    <Zap size={15} />
                    Critique My Idea
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addMore}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 text-zinc-300 font-medium text-[13px] transition-all"
                  >
                    <PlusCircle size={15} />
                    I want to add more
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Research progress */}
            {status === "researching" && events.length > 0 && (
              <div className="bg-white/2 border border-white/4 rounded-xl p-4 mb-4">
                <div className="space-y-1.5">
                  {events.map((e, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {e.type === "status" && <Loader2 size={11} className="text-amber-400 animate-spin" />}
                      {e.type === "tool_start" && <Loader2 size={11} className="text-cyan-400 animate-spin" />}
                      {e.type === "tool_done" && <div className="w-3 h-3 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /></div>}
                      <span className="text-[11px] text-zinc-500">
                        {e.payload.message as string || `${e.type}: ${e.payload.tool || ""}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {status === "researching" && events.length === 0 && (
              <div className="flex items-center gap-3 py-8 justify-center">
                <Loader2 size={18} className="text-amber-400 animate-spin" />
                <span className="text-[13px] text-zinc-500">Starting research...</span>
              </div>
            )}

            {/* Retry button when failed without error message */}
            {status === "failed" && !error && !verdict && (
              <div className="flex justify-center py-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateVerdict}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/15 text-amber-400 font-medium text-[13px] hover:bg-amber-500/20 transition-all"
                >
                  <RefreshCw size={14} />
                  Retry Critique
                </motion.button>
              </div>
            )}

            {/* Error with retry */}
            {error && (
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/15 mb-4">
                <p className="text-[13px] text-red-400">{error}</p>
                {(status === "failed" || !verdict) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={generateVerdict}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/15 text-[12px] text-amber-400 hover:bg-amber-500/20 transition-smooth shrink-0 ml-3"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </motion.button>
                )}
              </div>
            )}

            {/* Verdict */}
            {verdict && verdict.viabilityScore && (
              <VerdictDisplay verdict={verdict} />
            )}
          </div>
        </div>

        {/* Input — only show during conversation */}
        {(status === "conversation" || (status === "completed" && !showConfirmButtons)) && (
          <div className="px-4 sm:px-6 py-3 border-t border-white/4 shrink-0">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/2 border border-white/5 rounded-xl p-1.5">
                {reference && (
                  <div className="flex items-center gap-2 px-3 pt-2 pb-1">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/15 text-[11px] text-violet-400">
                      <Link2 size={10} />
                      <span className="truncate max-w-48">{reference.title}</span>
                      <button onClick={() => setReference(null)} className="hover:text-violet-300 ml-0.5">
                        <X size={10} />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <ReferenceButton
                    onReference={(context, title) => setReference({ title, context })}
                  />
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={messages.length === 0 ? "Describe your idea... (use 🔗 to reference past sessions)" : showConfirmButtons ? "Add more context..." : "Ask a follow-up..."}
                    rows={1}
                    disabled={sending || showConfirmButtons}
                    className="flex-1 px-3 py-2.5 bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none disabled:opacity-50"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSend}
                    disabled={!input.trim() || sending || showConfirmButtons}
                    className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-white/5 disabled:text-zinc-600 text-black transition-all shrink-0 mb-0.5"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
