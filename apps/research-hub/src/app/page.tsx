"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowRight, Globe, Youtube, FileSearch, Brain, Cpu,
  Clock, Star, Trash2, Loader2
} from "lucide-react";
import { useResearchSessions } from "@/hooks/useResearchSessions";
import { ModelSelector } from "@/components/research/ModelSelector";
import { DEFAULT_RESEARCH_MODEL } from "@/lib/models";
import { cn } from "@ai-system/shared-ui";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const } },
};

const features = [
  {
    icon: Globe,
    title: "Multi-Source Search",
    desc: "Perplexity AI, Google, and Firecrawl working in parallel for comprehensive coverage.",
  },
  {
    icon: Youtube,
    title: "Video Intelligence",
    desc: "YouTube Data API surfaces trending content, view counts, and creator insights.",
  },
  {
    icon: Brain,
    title: "AI Synthesis",
    desc: "Claude orchestrates tools, resolves conflicts, and produces a structured report.",
  },
  {
    icon: Cpu,
    title: "Live Activity Feed",
    desc: "Watch the agent work in real-time — every tool call, every discovery streamed live.",
  },
];

function SessionCard({
  session,
  onNavigate,
  onDelete,
  onToggleStar,
}: {
  session: { id: string; title: string; query: string; status: string; starred: boolean };
  onNavigate: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.08)" }}
      className="group relative"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onNavigate}
        onKeyDown={(e) => e.key === "Enter" && onNavigate()}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/2 border border-white/4 hover:bg-white/3 text-left cursor-pointer transition-smooth"
      >
        <Search size={14} className="text-zinc-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-zinc-300 truncate">{session.title}</p>
          <p className="text-[11px] text-zinc-700 truncate">{session.query}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={onToggleStar}
            className={cn(
              "p-1.5 rounded-md hover:bg-white/5 transition-colors",
              session.starred ? "text-amber-400" : "text-zinc-700 hover:text-amber-400"
            )}
          >
            <Star size={13} fill={session.starred ? "currentColor" : "none"} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-white/5 text-zinc-700 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
        {session.starred && (
          <Star size={10} fill="currentColor" className="text-amber-400/50 shrink-0 group-hover:hidden" />
        )}
        <ArrowRight size={12} className="text-zinc-700 shrink-0 hidden group-hover:block" />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const { starredSessions, recentSessions, loading, createSession, deleteSession, toggleStar } = useResearchSessions();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_RESEARCH_MODEL);
  const [activeTools, setActiveTools] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((d) => setActiveTools(d.tools || []))
      .catch(() => {});
  }, []);

  const handleStartResearch = async () => {
    if (!query.trim() || creating) return;
    setCreating(true);
    const sessionId = await createSession(query.trim(), selectedModel);
    if (sessionId) router.push(`/research/${sessionId}`);
    setCreating(false);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteSession(id);
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleStar(id);
  };

  const hasSessions = starredSessions.length > 0 || recentSessions.length > 0;

  return (
    <div className="h-full flex flex-col relative bg-grid noise">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Search size={16} className="text-cyan-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-200">Research Hub</span>
        </div>
      </motion.header>

      <div className="flex-1 overflow-y-auto relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-3xl mx-auto px-6 pt-20 pb-12"
        >
          {/* Hero */}
          <motion.div variants={item} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/15 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse-glow" />
              <span className="text-xs font-medium text-cyan-400/90">AI-Powered Research Agent</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
              <span className="text-white">Research anything,</span>
              <br />
              <span className="gradient-text">instantly</span>
            </h1>

            <p className="text-base text-zinc-500 max-w-md mx-auto leading-relaxed mb-10">
              Enter any topic. Our agent searches the web, scrapes sources,
              analyzes YouTube, and delivers a structured intelligence report.
            </p>
          </motion.div>

          {/* Research Input */}
          <motion.div variants={item} className="mb-16">
            <div className="bg-white/2 border border-white/5 rounded-2xl p-1.5">
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleStartResearch();
                    }
                  }}
                  placeholder="What do you want to research? (e.g., 'AI coding assistants market in 2026')"
                  rows={3}
                  className="w-full px-4 py-3.5 rounded-xl bg-transparent text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
                />
                <div className="flex items-center justify-between px-3 pb-2">
                  <div className="flex items-center gap-3">
                    <ModelSelector
                      selectedId={selectedModel}
                      onChange={setSelectedModel}
                    />
                    {activeTools.length > 0 && (
                      <span className="text-[11px] text-zinc-700 hidden sm:inline">
                        <FileSearch size={12} className="inline mr-1" />
                        {activeTools.length} tool{activeTools.length !== 1 ? "s" : ""} active
                      </span>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStartResearch}
                    disabled={!query.trim() || creating}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-zinc-600 text-black font-semibold text-[13px] transition-all glow"
                  >
                    {creating ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        <Search size={14} />
                        Research
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-16">
            {features.map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.08)" }}
                className="group p-5 rounded-xl bg-white/2 border border-white/4 transition-smooth"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-500/8 border border-cyan-500/10 flex items-center justify-center mb-4">
                  <f.icon size={16} className="text-cyan-400/80" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">{f.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Starred Sessions */}
          {!loading && starredSessions.length > 0 && (
            <motion.div variants={item} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Star size={13} className="text-amber-400/60" fill="currentColor" />
                <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Favorites</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <AnimatePresence>
                  {starredSessions.map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onNavigate={() => router.push(`/research/${s.id}`)}
                      onDelete={(e) => handleDelete(e, s.id)}
                      onToggleStar={(e) => handleToggleStar(e, s.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Recent Sessions */}
          {!loading && recentSessions.length > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={13} className="text-zinc-600" />
                <h2 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest">Recent</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <AnimatePresence>
                  {recentSessions.slice(0, 6).map((s) => (
                    <SessionCard
                      key={s.id}
                      session={s}
                      onNavigate={() => router.push(`/research/${s.id}`)}
                      onDelete={(e) => handleDelete(e, s.id)}
                      onToggleStar={(e) => handleToggleStar(e, s.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !hasSessions && (
            <motion.div variants={item} className="text-center pt-4">
              <div className="w-12 h-12 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center mx-auto mb-4">
                <Search size={20} className="text-zinc-700" />
              </div>
              <p className="text-[13px] text-zinc-600 mb-1">No research sessions yet</p>
              <p className="text-[11px] text-zinc-700">Enter a topic above to start your first research</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
