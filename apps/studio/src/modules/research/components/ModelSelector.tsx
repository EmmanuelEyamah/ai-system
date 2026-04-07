"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Brain, Sparkles, Zap, Crown } from "lucide-react";
import { MODELS, getModel, type ModelOption } from "@/lib/models";
import { cn } from "@ai-system/shared-ui";

interface ModelSelectorProps {
  selectedId: string;
  onChange: (id: string) => void;
}

function TierBadge({ tier }: { tier: ModelOption["tier"] }) {
  const config = {
    premium: { icon: Crown, color: "text-amber-400 bg-amber-500/10 border-amber-500/15" },
    high: { icon: Sparkles, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/15" },
    mid: { icon: Zap, color: "text-sky-400 bg-sky-500/10 border-sky-500/15" },
    budget: { icon: Zap, color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/15" },
  };
  const { icon: Icon, color } = config[tier];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold border ${color}`}>
      <Icon size={8} />
      {tier.toUpperCase()}
    </span>
  );
}

export function ModelSelector({ selectedId, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = getModel(selectedId);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const anthropicModels = MODELS.filter((m) => m.provider === "anthropic");
  const openaiModels = MODELS.filter((m) => m.provider === "openai");

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/3 border border-white/6 hover:bg-white/5 hover:border-white/10 transition-smooth"
      >
        <Brain size={12} className="text-zinc-500" />
        <div className="text-left">
          <p className="text-[9px] uppercase tracking-wider text-zinc-600 leading-none">Model</p>
          <p className="text-[12px] text-zinc-300 font-medium leading-tight mt-0.5">
            {selected?.label || "Select Model"}
          </p>
        </div>
        <ChevronDown size={12} className={cn("text-zinc-600 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1.5 w-56 bg-[#0c0c14] border border-white/8 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
          >
            {/* Anthropic */}
            <div className="px-3 pt-2.5 pb-1">
              <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">Anthropic</p>
            </div>
            {anthropicModels.map((model) => (
              <button
                key={model.id}
                onClick={() => { onChange(model.id); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-left transition-smooth",
                  selectedId === model.id
                    ? "bg-cyan-500/8 text-zinc-200"
                    : "hover:bg-white/3 text-zinc-400"
                )}
              >
                <div className="flex items-center gap-2">
                  {selectedId === model.id && (
                    <div className="w-1 h-1 rounded-full bg-cyan-400" />
                  )}
                  <span className="text-[12px] font-medium">{model.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TierBadge tier={model.tier} />
                  <span className="text-[10px] text-zinc-600">{model.costLabel}</span>
                </div>
              </button>
            ))}

            {openaiModels.length > 0 && (
              <>
                <div className="h-px bg-white/4 mx-3 my-1" />
                <div className="px-3 pt-1.5 pb-1">
                  <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-semibold">OpenAI</p>
                </div>
                {openaiModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => { onChange(model.id); setOpen(false); }}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-left transition-smooth",
                      selectedId === model.id
                        ? "bg-cyan-500/8 text-zinc-200"
                        : "hover:bg-white/3 text-zinc-400"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {selectedId === model.id && (
                        <div className="w-1 h-1 rounded-full bg-cyan-400" />
                      )}
                      <span className="text-[12px] font-medium">{model.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TierBadge tier={model.tier} />
                      <span className="text-[10px] text-zinc-600">{model.costLabel}</span>
                    </div>
                  </button>
                ))}
              </>
            )}
            <div className="h-1.5" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
