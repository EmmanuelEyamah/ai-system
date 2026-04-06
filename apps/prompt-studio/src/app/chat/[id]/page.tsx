"use client";

import { useEffect, use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { PromptPanel } from "@/components/prompts/PromptPanel";
import { ModelSelector } from "@/components/chat/ModelSelector";
import { useChat } from "@/hooks/useChat";
import { Layers, X, Sparkles, PlusCircle } from "lucide-react";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    messages, prompts, models, loading, sending, error, showConfirmButtons,
    fetchChat, sendMessage, generatePrompts, regeneratePrompts, addMore, retry, updateModels,
  } = useChat(id);
  const [promptPanelOpen, setPromptPanelOpen] = useState(false);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  const hasPrompts = prompts.length > 0;

  return (
    <div className="h-full flex bg-[#050507]">
      <Sidebar />

      <div className="flex-1 flex min-w-0 relative">
        {/* Chat panel */}
        <div
          className="flex-1 flex flex-col min-w-0 lg:flex-none"
          style={{ flex: hasPrompts ? undefined : "1 1 100%" }}
        >
          {/* Header */}
          <div className="h-auto min-h-12 flex flex-wrap items-center justify-between gap-2 px-6 pl-14 md:pl-6 py-2 border-b border-white/4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-[13px] text-zinc-500">
                {sending ? "Thinking..." : "Ready"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ModelSelector selection={models} onChange={updateModels} />
              {hasPrompts && (
                <button
                  onClick={() => setPromptPanelOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[12px] font-medium"
                >
                  <Layers size={13} />
                  Prompts ({prompts.length})
                </button>
              )}
            </div>
          </div>

          <MessageList messages={messages} loading={sending} />

          {/* Confirm buttons */}
          <AnimatePresence>
            {showConfirmButtons && !sending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-center gap-3 px-6 py-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generatePrompts}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[13px] transition-all glow"
                >
                  <Sparkles size={15} />
                  Generate Prompts
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addMore}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 text-zinc-300 font-medium text-[13px] transition-all"
                >
                  <PlusCircle size={15} />
                  I want to add more
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mb-2 px-4 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15"
            >
              <p className="text-[12px] text-red-400">{error}</p>
            </motion.div>
          )}

          <ChatInput
            onSend={sendMessage}
            onRetry={retry}
            showRetry={!!error}
            disabled={sending || loading || showConfirmButtons}
            placeholder={
              showConfirmButtons
                ? "Click a button above to continue..."
                : messages.length === 0
                  ? "Paste your idea or describe what you need..."
                  : "Reply or add more details..."
            }
          />
        </div>

        {/* Desktop prompt panel */}
        {hasPrompts && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
            className="hidden lg:block"
            style={{ flex: "0 0 42%" }}
          >
            <PromptPanel prompts={prompts} onRegenerate={regeneratePrompts} regenerating={sending} />
          </motion.div>
        )}

        {/* Mobile prompt panel */}
        <AnimatePresence>
          {promptPanelOpen && hasPrompts && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setPromptPanelOpen(false)}
            >
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-0 h-full w-full max-w-md bg-[#08080c]"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/4">
                  <span className="text-[13px] font-semibold text-zinc-300">Generated Prompts</span>
                  <button
                    onClick={() => setPromptPanelOpen(false)}
                    className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-smooth"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="h-[calc(100%-48px)]">
                  <PromptPanel prompts={prompts} onRegenerate={regeneratePrompts} regenerating={sending} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
