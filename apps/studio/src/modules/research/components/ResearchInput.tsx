"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, FileSearch, Loader2 } from "lucide-react";

export function ResearchInput({
  onSubmit,
  initialQuery,
}: {
  onSubmit: (query: string) => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (!query.trim() || submitting) return;
    setSubmitting(true);
    onSubmit(query.trim());
  };

  return (
    <div className="bg-white/2 border border-white/5 rounded-2xl p-1.5">
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="What do you want to research?"
          rows={3}
          className="w-full px-4 py-3.5 rounded-xl bg-transparent text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
        />
        <div className="flex items-center justify-between px-3 pb-2">
          <span className="text-[11px] text-zinc-700">
            <FileSearch size={12} className="inline mr-1" />
            5 tools available
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={!query.trim() || submitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-zinc-600 text-black font-semibold text-[13px] transition-all glow"
          >
            {submitting ? (
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
  );
}
