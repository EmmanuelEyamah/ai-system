"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Search, ArrowRight, MessageSquare, Target, Layers, Zap,
  Globe, Youtube, Brain, Clock, Star, Trash2, Loader2, FileSearch,
} from "lucide-react";
import { useChats } from "@/modules/chat/hooks/useChats";
import { useResearchSessions } from "@/modules/research/hooks/useResearchSessions";
import { cn } from "@ai-system/shared-ui";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const } },
};

const features = [
  { icon: Target, title: "Intent Analysis", desc: "Detects task type, identifies gaps, asks precise clarifying questions.", color: "emerald" },
  { icon: Layers, title: "5 Prompt Variants", desc: "Best, concise, advanced, OpenAI-tuned, and Claude-tuned.", color: "emerald" },
  { icon: Globe, title: "Multi-Source Search", desc: "Serper, Firecrawl, YouTube, and more working in parallel.", color: "cyan" },
  { icon: Brain, title: "AI Synthesis", desc: "Claude orchestrates tools and produces structured reports.", color: "cyan" },
];

type CardItem = { type: "chat" | "research"; id: string; title: string; starred: boolean; updatedAt: string; extra?: string };

function ItemCard({ item: card, onNavigate, onDelete, onToggleStar }: {
  item: CardItem;
  onNavigate: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
}) {
  const isChat = card.type === "chat";
  return (
    <motion.div whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.08)" }} className="group relative">
      <div
        role="button" tabIndex={0} onClick={onNavigate}
        onKeyDown={(e) => e.key === "Enter" && onNavigate()}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/2 border border-white/4 hover:bg-white/3 text-left cursor-pointer transition-smooth"
      >
        {isChat
          ? <MessageSquare size={14} className="text-emerald-500/60 shrink-0" />
          : <Search size={14} className="text-cyan-500/60 shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-zinc-300 truncate">{card.title}</p>
          {card.extra && <p className="text-[11px] text-zinc-700">{card.extra}</p>}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={onToggleStar} className={cn("p-1.5 rounded-md hover:bg-white/5 transition-colors", card.starred ? "text-amber-400" : "text-zinc-700 hover:text-amber-400")}>
            <Star size={13} fill={card.starred ? "currentColor" : "none"} />
          </button>
          <button onClick={onDelete} className="p-1.5 rounded-md hover:bg-white/5 text-zinc-700 hover:text-red-400 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
        {card.starred && <Star size={10} fill="currentColor" className="text-amber-400/50 shrink-0 group-hover:hidden" />}
        <ArrowRight size={12} className="text-zinc-700 shrink-0 hidden group-hover:block" />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const { starredChats, recentChats, loading: chatsLoading, createChat, deleteChat, toggleStar: toggleChatStar } = useChats();
  const { starredSessions, recentSessions, loading: researchLoading, createSession, deleteSession, toggleStar: toggleResearchStar } = useResearchSessions();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const loading = chatsLoading || researchLoading;

  const handleNewChat = async () => {
    const chatId = await createChat();
    if (chatId) router.push(`/chat/${chatId}`);
  };

  const handleStartResearch = async () => {
    if (!query.trim() || creating) return;
    setCreating(true);
    const sessionId = await createSession(query.trim());
    if (sessionId) router.push(`/research/${sessionId}`);
    setCreating(false);
  };

  // Merge starred + recent
  const toCard = (type: "chat" | "research") => (i: { id: string; title: string; starred: boolean; updatedAt?: string; createdAt?: string; _count?: { messages: number }; query?: string }) => ({
    type, id: i.id, title: i.title, starred: i.starred,
    updatedAt: i.updatedAt || i.createdAt || "",
    extra: type === "chat" ? `${i._count?.messages || 0} messages` : undefined,
  } as CardItem);

  const starred = [...starredChats.map(toCard("chat")), ...starredSessions.map(toCard("research"))].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const recent = [...recentChats.map(toCard("chat")), ...recentSessions.map(toCard("research"))].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const hasItems = starred.length > 0 || recent.length > 0;

  const handleDeleteItem = (e: React.MouseEvent, item: CardItem) => { e.stopPropagation(); item.type === "chat" ? deleteChat(item.id) : deleteSession(item.id); };
  const handleStarItem = (e: React.MouseEvent, item: CardItem) => { e.stopPropagation(); item.type === "chat" ? toggleChatStar(item.id) : toggleResearchStar(item.id); };

  return (
    <div className="h-full flex flex-col relative bg-grid noise">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.header
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Layers size={16} className="text-violet-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-200">Studio</span>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleNewChat}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/8 text-sm text-zinc-300 hover:bg-white/8 hover:border-white/12 transition-smooth"
        >
          <Sparkles size={14} />
          New Chat
        </motion.button>
      </motion.header>

      <div className="flex-1 overflow-y-auto relative z-10">
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-3xl mx-auto px-6 pt-16 pb-12">
          {/* Hero */}
          <motion.div variants={item} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/15 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse-glow" />
              <span className="text-xs font-medium text-violet-400/90">AI-Powered Workspace</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
              <span className="text-white">Craft prompts,</span><br />
              <span className="gradient-text">research anything</span>
            </h1>
            <p className="text-base text-zinc-500 max-w-md mx-auto leading-relaxed mb-10">
              One workspace for prompt engineering and deep research. AI agents that work for you.
            </p>
          </motion.div>

          {/* Research input */}
          <motion.div variants={item} className="mb-10">
            <div className="bg-white/2 border border-white/5 rounded-2xl p-1.5">
              <textarea
                value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleStartResearch(); } }}
                placeholder="What do you want to research? (e.g., 'AI fitness apps market 2026')"
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-transparent text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-[11px] text-zinc-700 hidden sm:inline">
                  <FileSearch size={12} className="inline mr-1" />
                  Multi-tool research agent
                </span>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={handleStartResearch} disabled={!query.trim() || creating}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-zinc-600 text-black font-semibold text-[13px] transition-all glow-cyan"
                >
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <><Search size={14} /> Research</>}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-14">
            {features.map((f) => (
              <motion.div key={f.title} whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.08)" }}
                className="group p-5 rounded-xl bg-white/2 border border-white/4 transition-smooth"
              >
                <div className={`w-9 h-9 rounded-lg ${f.color === "emerald" ? "bg-emerald-500/8 border-emerald-500/10" : "bg-cyan-500/8 border-cyan-500/10"} border flex items-center justify-center mb-4`}>
                  <f.icon size={16} className={f.color === "emerald" ? "text-emerald-400/80" : "text-cyan-400/80"} />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">{f.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Starred */}
          {!loading && starred.length > 0 && (
            <motion.div variants={item} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Star size={13} className="text-amber-400/60" fill="currentColor" />
                <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Favorites</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <AnimatePresence>
                  {starred.map((c) => (
                    <ItemCard key={`${c.type}-${c.id}`} item={c}
                      onNavigate={() => router.push(c.type === "chat" ? `/chat/${c.id}` : `/research/${c.id}`)}
                      onDelete={(e) => handleDeleteItem(e, c)} onToggleStar={(e) => handleStarItem(e, c)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Recent */}
          {!loading && recent.length > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={13} className="text-zinc-600" />
                <h2 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest">Recent</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <AnimatePresence>
                  {recent.slice(0, 8).map((c) => (
                    <ItemCard key={`${c.type}-${c.id}`} item={c}
                      onNavigate={() => router.push(c.type === "chat" ? `/chat/${c.id}` : `/research/${c.id}`)}
                      onDelete={(e) => handleDeleteItem(e, c)} onToggleStar={(e) => handleStarItem(e, c)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {!loading && !hasItems && (
            <motion.div variants={item} className="text-center pt-4">
              <div className="w-12 h-12 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center mx-auto mb-4">
                <Layers size={20} className="text-zinc-700" />
              </div>
              <p className="text-[13px] text-zinc-600 mb-1">Nothing yet</p>
              <p className="text-[11px] text-zinc-700">Start a chat or enter a research query above</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
