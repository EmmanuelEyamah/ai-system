"use client";

import { use, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Heart, User, Bot, ChevronDown, Flame, Crown, DollarSign, Mic, Dumbbell, Apple, Cpu } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SmartInput } from "@/components/shared/SmartInput";
import { SaveToFolder } from "@/components/shared/SaveToFolder";
import { ModuleHandoff } from "@/components/shared/ModuleHandoff";
import { useCoach } from "@/modules/coach/hooks/useCoach";
import { MarkdownRenderer, LoadingDots } from "@ai-system/shared-ui";
import { cleanMessageForDisplay } from "@/lib/display-utils";
import { cn } from "@ai-system/shared-ui";

const PERSONAS = [
  { id: "auto", label: "Auto-Detect", icon: Cpu, color: "text-violet-400" },
  { id: "spirituality", label: "Spirituality", icon: Flame, color: "text-amber-400" },
  { id: "wealth", label: "Kingdom Wealth", icon: Crown, color: "text-yellow-400" },
  { id: "sales", label: "Sales", icon: DollarSign, color: "text-emerald-400" },
  { id: "communication", label: "Communication", icon: Mic, color: "text-sky-400" },
  { id: "fitness", label: "Fitness", icon: Dumbbell, color: "text-red-400" },
  { id: "nutrition", label: "Nutrition", icon: Apple, color: "text-green-400" },
];

function PersonaSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PERSONAS.find((p) => p.id === value) || PERSONAS[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/3 border border-white/6 hover:bg-white/5 transition-smooth text-[12px]">
        <current.icon size={12} className={current.color} />
        <span className={current.color}>{current.label}</span>
        <ChevronDown size={11} className={cn("text-zinc-600 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-48 bg-[#0c0c14] border border-white/8 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
          {PERSONAS.map((p) => (
            <button key={p.id} onClick={() => { onChange(p.id); setOpen(false); }}
              className={cn("w-full flex items-center gap-2 px-3 py-2 text-left transition-smooth text-[12px]",
                value === p.id ? "bg-white/5 text-zinc-200" : "hover:bg-white/3 text-zinc-400")}>
              <p.icon size={12} className={p.color} />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { messages, title, persona, loading, sending, error, fetchSession, sendMessage, changePersona } = useCoach(id);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async (message: string, files?: { file: File }[]) => {
    let images: { data: string; mimeType: string }[] | undefined;
    if (files && files.length > 0) {
      try {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f.file));
        const res = await fetch("/api/process-files", { method: "POST", body: formData });
        if (res.ok) { const data = await res.json(); images = data.files; }
      } catch {}
    }
    await sendMessage(message, images);
  };

  const currentPersona = PERSONAS.find((p) => p.id === persona) || PERSONAS[0];

  if (loading) {
    return <AppShell><div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="text-pink-400 animate-spin" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/4 pl-14 pr-4 md:px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart size={14} className="text-pink-400" />
              <span className="text-[12px] font-medium text-pink-400">Growth Coach</span>
              <span className="text-zinc-700">|</span>
              <PersonaSelector value={persona} onChange={changePersona} />
            </div>
            <SaveToFolder itemType="coach" itemId={id} itemTitle={title || "Coaching"} />
          </div>
        </motion.header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            {/* Empty state */}
            {messages.length === 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/15 flex items-center justify-center mx-auto mb-4">
                  <Heart size={24} className="text-pink-400" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-200 mb-2">Growth Coach</h2>
                <p className="text-[13px] text-zinc-500 max-w-md mx-auto mb-6">
                  Your personal coach for spirituality, wealth, sales, communication, fitness, and nutrition. Select a persona or just ask — I&apos;ll adapt.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { q: "How do I deepen my prayer life?", Icon: Flame, c: "text-amber-400" },
                    { q: "How do I price my services higher?", Icon: DollarSign, c: "text-emerald-400" },
                    { q: "Give me a 4-day workout split", Icon: Dumbbell, c: "text-red-400" },
                    { q: "How do I become a better communicator?", Icon: Mic, c: "text-sky-400" },
                  ].map(({ q, Icon: QIcon, c }) => (
                    <button key={q} onClick={() => handleSend(q)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/3 border border-white/6 text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-smooth">
                      <QIcon size={10} className={c} /> {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Message list */}
            {messages.map((msg, i) => {
              const msgPersona = msg.metadata?.persona ? PERSONAS.find((p) => p.id === msg.metadata?.persona) : null;
              return (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                  className="flex gap-3 mb-5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === "user" ? "bg-white/5 border border-white/8" : "bg-pink-500/10 border border-pink-500/15"
                  }`}>
                    {msg.role === "user" ? <User size={13} className="text-zinc-400" /> : (
                      msgPersona ? <msgPersona.icon size={13} className={msgPersona.color} /> : <Bot size={13} className="text-pink-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    {msg.role === "assistant" && msgPersona && (
                      <span className={`text-[10px] font-medium ${msgPersona.color} mb-1 block`}>{msgPersona.label}</span>
                    )}
                    <MarkdownRenderer content={msg.role === "user" ? cleanMessageForDisplay(msg.content) : msg.content} />
                    {msg.role === "assistant" && i === messages.length - 1 && !sending && (
                      <ModuleHandoff context={msg.content} currentModule="strategist" />
                    )}
                  </div>
                </motion.div>
              );
            })}

            {sending && (
              <div className="flex gap-3 mb-5">
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/15 flex items-center justify-center shrink-0">
                  <currentPersona.icon size={12} className={currentPersona.color} />
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
            <SmartInput
              onSend={(msg, files) => handleSend(msg, files)}
              disabled={false}
              sending={sending}
              placeholder="Ask your coach anything... (paste URLs or drop images)"
              accentColor="bg-pink-500 hover:bg-pink-400"
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
