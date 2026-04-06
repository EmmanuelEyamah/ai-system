"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PromptCard } from "./PromptCard";
import { Layers, RefreshCw, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";

interface Prompt {
  id: string;
  variant: string;
  modelTarget: string;
  content: string;
  score: number | null;
  explanation: string | null;
}

interface PromptPanelProps {
  prompts: Prompt[];
  onRegenerate?: () => void;
  onClose?: () => void;
  regenerating?: boolean;
}

const TABS = [
  { key: "all", label: "All" },
  { key: "best", label: "Best" },
  { key: "shorter", label: "Concise" },
  { key: "advanced", label: "Advanced" },
  { key: "openai", label: "OpenAI" },
  { key: "claude", label: "Claude" },
];

export function PromptPanel({ prompts, onRegenerate, onClose, regenerating }: PromptPanelProps) {
  const [activeTab, setActiveTab] = useState("all");

  if (prompts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-[#08080c] border-l border-white/4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center px-8"
        >
          <div className="w-10 h-10 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center mx-auto mb-3">
            <Layers size={18} className="text-zinc-700" />
          </div>
          <p className="text-[13px] text-zinc-700">
            Prompts will appear here
          </p>
        </motion.div>
      </div>
    );
  }

  const filtered =
    activeTab === "all"
      ? prompts
      : prompts.filter((p) => p.variant === activeTab || p.modelTarget === activeTab);

  return (
    <div className="h-full flex flex-col bg-[#08080c] border-l border-white/4 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/4">
        <div className="flex items-center gap-2 mb-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/5 text-zinc-600 hover:text-zinc-300 transition-smooth"
            >
              <PanelRightClose size={15} />
            </button>
          )}
          <Layers size={14} className="text-emerald-400" />
          <span className="text-[13px] font-semibold text-zinc-300">Generated Prompts</span>
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-[11px] text-zinc-600">{prompts.length} variants</span>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-white/8 border border-white/6 text-zinc-400 hover:text-zinc-200 disabled:opacity-50 transition-smooth"
              >
                <RefreshCw size={11} className={regenerating ? "animate-spin" : ""} />
                {regenerating ? "Regenerating..." : "Regenerate"}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-smooth",
                activeTab === tab.key
                  ? "text-zinc-200"
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/6 border border-white/8 rounded-md"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filtered.map((prompt, i) => (
          <PromptCard
            key={prompt.id}
            variant={prompt.variant}
            modelTarget={prompt.modelTarget}
            content={prompt.content}
            score={prompt.score}
            explanation={prompt.explanation}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
