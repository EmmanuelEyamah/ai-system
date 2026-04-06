"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { LoadingDots } from "@/components/shared/LoadingDots";
import { Bot, Wand2 } from "lucide-react";

interface AttachmentData {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  url: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: AttachmentData[];
}

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
}

export function MessageList({ messages, loading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-5"
        >
          <div className="relative mx-auto w-14 h-14">
            <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 blur-xl" />
            <div className="relative w-14 h-14 rounded-2xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center">
              <Wand2 size={22} className="text-emerald-400" />
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-300 mb-1">What are you building?</h3>
            <p className="text-sm text-zinc-600 max-w-xs">
              Paste your idea, attach files for context, and I&apos;ll craft the perfect prompts.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6">
      <div className="max-w-3xl mx-auto py-6 space-y-5">
        {messages.map((msg, i) => (
          <MessageBubble
            key={i}
            role={msg.role}
            content={msg.content}
            index={i}
            attachments={msg.attachments}
          />
        ))}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="shrink-0 w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
              <Bot size={13} className="text-emerald-400" />
            </div>
            <div className="px-4 py-3">
              <LoadingDots />
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
