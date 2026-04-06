"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp, RotateCcw } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  onRetry?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showRetry?: boolean;
}

export function ChatInput({ onSend, onRetry, disabled, placeholder, showRetry }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-6 pb-5 pt-2">
      <div className="max-w-3xl mx-auto">
        {/* Retry button */}
        {showRetry && onRetry && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-3"
          >
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 text-[12px] font-medium hover:bg-red-500/15 transition-smooth"
            >
              <RotateCcw size={13} />
              Retry last message
            </button>
          </motion.div>
        )}

        <div className="relative flex items-end gap-2 rounded-xl bg-white/3 border border-white/6 focus-within:border-emerald-500/30 focus-within:bg-white/4 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || "Describe your idea..."}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent pl-4 pr-2 py-3.5 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed leading-relaxed"
          />
          <div className="pr-2 pb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={disabled || !input.trim()}
              className="p-2 rounded-lg bg-emerald-500 disabled:bg-white/5 disabled:text-zinc-700 text-black transition-all duration-200"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
        <p className="text-center text-[11px] text-zinc-700 mt-2">
          Enter to send &middot; Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
