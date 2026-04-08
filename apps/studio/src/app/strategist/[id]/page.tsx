"use client";

import { use, useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Send, Target, User, Bot, Link2, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SaveToFolder } from "@/components/shared/SaveToFolder";
import { ReferenceButton } from "@/components/shared/ReferenceButton";
import { useStrategist } from "@/modules/strategist/hooks/useStrategist";
import { MarkdownRenderer, LoadingDots } from "@ai-system/shared-ui";
import { cleanMessageForDisplay } from "@/lib/display-utils";

export default function StrategistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { messages, title, loading, sending, error, fetchSession, sendMessage } = useStrategist(id);

  const [input, setInput] = useState("");
  const [references, setReferences] = useState<{ title: string; context: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const refContext = references.map((r) => r.context).join("\n\n---\n\n");
    const msg = refContext ? `${refContext}\n\n${input.trim()}` : input.trim();
    setReferences([]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(msg);
  };

  if (loading) {
    return <AppShell><div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="text-indigo-400 animate-spin" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/4 pl-14 pr-4 md:px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-indigo-400" />
              <span className="text-[12px] font-medium text-indigo-400">Digital Strategist</span>
              <span className="text-zinc-700">|</span>
              <span className="text-[12px] text-zinc-500 truncate max-w-48">{title || "Ask me anything"}</span>
            </div>
            <SaveToFolder itemType="strategist" itemId={id} itemTitle={title || "Strategy Session"} />
          </div>
        </motion.header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center mx-auto mb-4">
                  <Target size={24} className="text-indigo-400" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-200 mb-2">Digital Strategist</h2>
                <p className="text-[13px] text-zinc-500 max-w-md mx-auto mb-6">
                  Your $500/hr marketing advisor. Ask about growth strategy, ads, pricing, sales, social media, leads — anything. I&apos;ll give you the real answer, not the safe one.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "I have zero followers. What do I do first?",
                    "Should I run ads or focus on organic?",
                    "How do I price my services?",
                    "Give me a 30-day growth playbook",
                  ].map((q) => (
                    <button key={q} onClick={() => { setInput(q); }}
                      className="px-3 py-1.5 rounded-lg bg-white/3 border border-white/6 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-smooth">
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="flex gap-3 mb-5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-white/5 border border-white/8" : "bg-indigo-500/10 border border-indigo-500/15"
                }`}>
                  {msg.role === "user" ? <User size={13} className="text-zinc-400" /> : <Bot size={13} className="text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <MarkdownRenderer content={msg.role === "user" ? cleanMessageForDisplay(msg.content) : msg.content} />
                </div>
              </motion.div>
            ))}

            {sending && (
              <div className="flex gap-3 mb-5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center shrink-0">
                  <Bot size={13} className="text-indigo-400" />
                </div>
                <div className="pt-2"><LoadingDots /></div>
              </div>
            )}

            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/15 mb-4">
                <p className="text-[13px] text-red-400">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="px-4 sm:px-6 py-3 border-t border-white/4 shrink-0">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/2 border border-white/5 rounded-xl p-1.5">
              {references.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2 pb-1">
                  {references.map((ref, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/15 text-[11px] text-violet-400">
                      <Link2 size={10} />
                      <span className="truncate max-w-36">{ref.title}</span>
                      <button onClick={() => setReferences((p) => p.filter((_, j) => j !== i))} className="hover:text-violet-300 ml-0.5"><X size={10} /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <ReferenceButton onReference={(context, t) => setReferences((p) => [...p, { title: t, context }])} />
                <textarea ref={textareaRef} value={input}
                  onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask me anything about marketing, growth, sales, pricing..."
                  rows={1} disabled={sending}
                  className="flex-1 px-3 py-2.5 bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none disabled:opacity-50" />
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleSend} disabled={!input.trim() || sending}
                  className="p-2.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/5 disabled:text-zinc-600 text-white transition-all shrink-0 mb-0.5">
                  {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
