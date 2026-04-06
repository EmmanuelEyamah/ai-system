"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-white/5 hover:bg-white/8 border border-white/6 text-zinc-400 hover:text-zinc-200 transition-smooth"
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="flex items-center gap-1.5 text-emerald-400"
          >
            <Check size={12} />
            Copied
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className="flex items-center gap-1.5"
          >
            <Copy size={12} />
            Copy
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
