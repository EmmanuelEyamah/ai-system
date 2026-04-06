"use client";

import { motion } from "framer-motion";
import { CopyButton } from "./CopyButton";
import { TestPromptButton } from "./TestPromptButton";

interface PromptCardProps {
  variant: string;
  modelTarget: string;
  content: string;
  score: number | null;
  explanation: string | null;
  index: number;
}

function getVariantLabel(variant: string, modelTarget: string): string {
  if (modelTarget === "openai") return "OpenAI Optimized";
  if (modelTarget === "claude") return "Claude Optimized";
  if (variant === "best") return "Best Prompt";
  if (variant === "shorter") return "Concise";
  if (variant === "advanced") return "Advanced";
  return variant;
}

function getScoreColor(score: number): string {
  if (score >= 8) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/15";
  if (score >= 6) return "text-amber-400 bg-amber-500/10 border-amber-500/15";
  return "text-red-400 bg-red-500/10 border-red-500/15";
}

function getVariantAccent(variant: string, modelTarget: string): string {
  if (modelTarget === "openai") return "border-l-sky-500/40";
  if (modelTarget === "claude") return "border-l-orange-500/40";
  if (variant === "best") return "border-l-emerald-500/40";
  if (variant === "advanced") return "border-l-violet-500/40";
  return "border-l-zinc-500/40";
}

export function PromptCard({ variant, modelTarget, content, score, explanation, index }: PromptCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.25, 0.4, 0.25, 1] }}
      className={`bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden border-l-2 ${getVariantAccent(variant, modelTarget)}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/4">
        <div className="flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-zinc-200">
            {getVariantLabel(variant, modelTarget)}
          </span>
          {score && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getScoreColor(score)}`}>
              {score.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <TestPromptButton prompt={content} model={modelTarget === "openai" ? "openai" : "claude"} />
          <CopyButton text={content} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <pre className="text-[12px] text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
          {content}
        </pre>
      </div>

      {/* Explanation */}
      {explanation && (
        <div className="px-4 py-2.5 border-t border-white/3 bg-white/[0.01]">
          <p className="text-[11px] text-zinc-600 leading-relaxed">{explanation}</p>
        </div>
      )}
    </motion.div>
  );
}
