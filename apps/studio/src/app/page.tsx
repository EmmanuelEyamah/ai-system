"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Layers, MessageSquare, Search, Lightbulb, TrendingUp,
  PenTool, Target, Heart, ArrowRight,
} from "lucide-react";
import { useStudio } from "@/providers/StudioProvider";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] as const } },
};

const modules = [
  { key: "chats", label: "Prompt Studio", desc: "Craft perfect prompts with a world-class prompt engineer", icon: MessageSquare, color: "emerald", route: "/chat", apiPath: "/api/chat" },
  { key: "research", label: "Research Hub", desc: "Deep research powered by multiple tools and AI synthesis", icon: Search, color: "cyan", route: "/research", apiPath: "/api/research" },
  { key: "critiques", label: "Idea Critic", desc: "Get brutally honest feedback from a YC-level advisor", icon: Lightbulb, color: "amber", route: "/critic", apiPath: "/api/critic" },
  { key: "trends", label: "Trends", desc: "Find trending content across all platforms in real-time", icon: TrendingUp, color: "orange", route: "/trends/new", apiPath: null },
  { key: "content", label: "Content Studio", desc: "Create platform-specific content with a $500/hr creative director", icon: PenTool, color: "rose", route: "/content", apiPath: "/api/content" },
  { key: "strategist", label: "Digital Strategist", desc: "Talk to your $500/hr marketing advisor about anything", icon: Target, color: "indigo", route: "/strategist", apiPath: "/api/strategist" },
  { key: "coach", label: "Growth Coach", desc: "Personal coaching for spirituality, sales, fitness, and more", icon: Heart, color: "pink", route: "/coach", apiPath: "/api/coach" },
];

const colorMap: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  emerald: { bg: "bg-emerald-500/8", border: "border-emerald-500/15", text: "text-emerald-400", glow: "hover:shadow-emerald-500/10" },
  cyan: { bg: "bg-cyan-500/8", border: "border-cyan-500/15", text: "text-cyan-400", glow: "hover:shadow-cyan-500/10" },
  amber: { bg: "bg-amber-500/8", border: "border-amber-500/15", text: "text-amber-400", glow: "hover:shadow-amber-500/10" },
  orange: { bg: "bg-orange-500/8", border: "border-orange-500/15", text: "text-orange-400", glow: "hover:shadow-orange-500/10" },
  rose: { bg: "bg-rose-500/8", border: "border-rose-500/15", text: "text-rose-400", glow: "hover:shadow-rose-500/10" },
  indigo: { bg: "bg-indigo-500/8", border: "border-indigo-500/15", text: "text-indigo-400", glow: "hover:shadow-indigo-500/10" },
  pink: { bg: "bg-pink-500/8", border: "border-pink-500/15", text: "text-pink-400", glow: "hover:shadow-pink-500/10" },
};

export default function Home() {
  const router = useRouter();
  const { data } = useStudio();

  const handleStart = async (mod: typeof modules[0]) => {
    if (!mod.apiPath) { router.push(mod.route); return; }
    try {
      const res = await fetch(mod.apiPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) {
        const d = await res.json();
        const id = d.sessionId || d.chatId || d.critiqueId || d.id;
        if (id) router.push(`${mod.route}/${id}`);
      }
    } catch {}
  };

  // Count total sessions
  const totalSessions = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="h-full flex flex-col relative bg-grid noise">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex-1 overflow-y-auto relative z-10">
        <motion.div variants={container} initial="hidden" animate="show"
          className="max-w-4xl mx-auto px-6 pt-16 sm:pt-24 pb-12">

          {/* Hero */}
          <motion.div variants={item} className="text-center mb-14">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-5">
              <Layers size={28} className="text-violet-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3">
              Welcome to <span className="gradient-text">Manny AI Studio</span>
            </h1>
            <p className="text-base text-zinc-500 max-w-lg mx-auto">
              What do you want to work on today?
            </p>
            {totalSessions > 0 && (
              <p className="text-[12px] text-zinc-700 mt-2">{totalSessions} session{totalSessions !== 1 ? "s" : ""} across all modules</p>
            )}
          </motion.div>

          {/* Module grid */}
          <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-14">
            {modules.map((mod) => {
              const colors = colorMap[mod.color];
              const Icon = mod.icon;
              const count = data[mod.key as keyof typeof data]?.length || 0;

              return (
                <motion.div
                  key={mod.key}
                  whileHover={{ y: -3, borderColor: "rgba(255,255,255,0.1)" }}
                  className={`group relative cursor-pointer rounded-xl ${colors.border} border bg-white/2 hover:bg-white/3 transition-all duration-200 ${colors.glow} hover:shadow-lg`}
                  onClick={() => handleStart(mod)}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                        <Icon size={18} className={colors.text} />
                      </div>
                      {count > 0 && (
                        <span className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{count}</span>
                      )}
                    </div>
                    <h3 className="text-[14px] font-semibold text-zinc-200 mb-1">{mod.label}</h3>
                    <p className="text-[12px] text-zinc-500 leading-relaxed">{mod.desc}</p>
                    <div className={`flex items-center gap-1 mt-3 text-[11px] ${colors.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      Start <ArrowRight size={10} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Quick tip */}
          <motion.div variants={item} className="text-center">
            <p className="text-[12px] text-zinc-700">
              Tip: Use the sidebar to access your existing sessions, or start fresh above.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
