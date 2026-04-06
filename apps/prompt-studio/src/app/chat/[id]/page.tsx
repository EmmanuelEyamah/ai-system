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
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(true);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  const hasPrompts = prompts.length > 0;
  const showDesktopPanel = hasPrompts && desktopPanelOpen;

  return (
    <div className="h-full flex bg-[#050507]">
      <Sidebar />

      <div className="flex-1 flex min-w-0 relative">
        {/* Chat panel — full width on mobile, 45% on desktop when prompts exist */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${showDesktopPanel ? "lg:max-w-[45%] lg:flex-none" : ""}`}
        >
          {/* Header */}
          <div className="h-auto min-h-12 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 pl-14 md:pl-6 py-2 border-b border-white/4">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-[13px] text-zinc-500">
                {sending ? "Thinking..." : "Ready"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <ModelSelector selection={models} onChange={updateModels} />
              </div>
              {hasPrompts && (
                <>
                  <button
                    onClick={() => setPromptPanelOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[12px] font-medium"
                  >
                    <Layers size={13} />
                    Prompts ({prompts.length})
                  </button>
                  {!desktopPanelOpen && (
                    <button
                      onClick={() => setDesktopPanelOpen(true)}
                      className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[12px] font-medium"
                    >
                      <Layers size={13} />
                      Show Prompts ({prompts.length})
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Mobile model selector */}
          <div className="sm:hidden flex items-center gap-2 px-4 py-2 border-b border-white/4 overflow-x-auto">
            <ModelSelector selection={models} onChange={updateModels} />
          </div>

          <MessageList messages={messages} loading={sending} />

          {/* Confirm buttons */}
          <AnimatePresence>
            {showConfirmButtons && !sending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-4"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generatePrompts}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[13px] transition-all glow"
                >
                  <Sparkles size={15} />
                  Generate Prompts
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addMore}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 text-zinc-300 font-medium text-[13px] transition-all"
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
              className="mx-4 sm:mx-6 mb-2 px-4 py-2.5 rounded-lg bg-red-500/8 border border-red-500/15"
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

        {/* Desktop prompt panel — hidden below lg */}
        <AnimatePresence>
          {showDesktopPanel && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "55%" }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className="hidden lg:flex overflow-hidden"
            >
              <PromptPanel
                prompts={prompts}
                onRegenerate={regeneratePrompts}
                onClose={() => setDesktopPanelOpen(false)}
                regenerating={sending}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile/Tablet prompt panel — full screen overlay */}
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
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-x-0 bottom-0 h-[90%] sm:right-0 sm:left-auto sm:w-full sm:max-w-lg sm:h-full sm:inset-x-auto bg-[#08080c] rounded-t-2xl sm:rounded-none"
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
                <div className="h-[calc(100%-48px)] overflow-hidden">
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
