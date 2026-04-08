"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Lightbulb, PenTool, TrendingUp, Target, MessageSquare, Loader2, ArrowRight } from "lucide-react";

type ModuleTarget = "research" | "critic" | "content" | "trends" | "strategist" | "chat";

interface ModuleOption {
  target: ModuleTarget;
  icon: typeof Search;
  color: string;
  label: string;
  description: string;
}

const ALL_MODULES: ModuleOption[] = [
  { target: "research", icon: Search, color: "text-cyan-400", label: "Research", description: "Get data on this" },
  { target: "critic", icon: Lightbulb, color: "text-amber-400", label: "Critique", description: "Evaluate this idea" },
  { target: "content", icon: PenTool, color: "text-rose-400", label: "Create Content", description: "Make posts from this" },
  { target: "trends", icon: TrendingUp, color: "text-orange-400", label: "Find Trends", description: "Search trending content" },
  { target: "strategist", icon: Target, color: "text-indigo-400", label: "Get Strategy", description: "Strategic advice on this" },
  { target: "chat", icon: MessageSquare, color: "text-emerald-400", label: "Generate Prompts", description: "Create prompts from this" },
];

/**
 * ModuleHandoff — shows buttons to send context to other modules.
 * Appears after AI responses. Excludes the current module.
 */
export function ModuleHandoff({
  context,
  currentModule,
  autoGenerate,
}: {
  context: string;
  currentModule: ModuleTarget;
  autoGenerate?: boolean;
}) {
  const router = useRouter();
  const [sending, setSending] = useState<ModuleTarget | null>(null);

  const options = ALL_MODULES.filter((m) => m.target !== currentModule);

  const handleSend = async (target: ModuleTarget) => {
    setSending(target);
    try {
      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          context: context.slice(0, 2000),
          autoGenerate: target === "content" && autoGenerate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(data.url);
      }
    } catch {} finally { setSending(null); }
  };

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {options.map((opt) => {
        const Icon = opt.icon;
        return (
          <motion.button
            key={opt.target}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSend(opt.target)}
            disabled={sending !== null}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/3 border border-white/6 text-[10px] font-medium text-zinc-500 hover:text-zinc-300 hover:bg-white/5 disabled:opacity-50 transition-smooth"
          >
            {sending === opt.target ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Icon size={10} className={opt.color} />
            )}
            {opt.label}
            <ArrowRight size={8} className="text-zinc-700" />
          </motion.button>
        );
      })}
    </div>
  );
}
