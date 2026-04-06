"use client";

import { motion } from "framer-motion";
import { User, Bot } from "lucide-react";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  index: number;
}

export function MessageBubble({ role, content, index }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-md flex items-center justify-center mt-0.5",
          isUser
            ? "bg-white/8 border border-white/10"
            : "bg-emerald-500/10 border border-emerald-500/15"
        )}
      >
        {isUser ? (
          <User size={13} className="text-zinc-400" />
        ) : (
          <Bot size={13} className="text-emerald-400" />
        )}
      </div>

      {/* Message */}
      <div
        className={cn(
          "max-w-[75%] rounded-xl px-4 py-3",
          isUser
            ? "bg-white/5 border border-white/6"
            : "bg-transparent"
        )}
      >
        {isUser ? (
          <p className="text-[13px] text-zinc-300 whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </div>
    </motion.div>
  );
}
