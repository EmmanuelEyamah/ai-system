"use client";

import { use, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, PenTool, Zap, PlusCircle, User, Bot, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ContentCard } from "@/modules/content/components/ContentCard";
import { SmartInput } from "@/components/shared/SmartInput";
import { ModuleHandoff } from "@/components/shared/ModuleHandoff";
import { SaveToFolder } from "@/components/shared/SaveToFolder";
import { useContent } from "@/modules/content/hooks/useContent";
import { MarkdownRenderer, LoadingDots } from "@ai-system/shared-ui";
import { cleanMessageForDisplay } from "@/lib/display-utils";

export default function ContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    messages, contentData, status, title, showConfirmButtons,
    loading, sending, generating, error,
    fetchSession, sendMessage, generateContent, repurposePost, sendFeedback, addMore,
  } = useContent(id);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const handleSend = async (message: string, files?: { file: File }[]) => {
    let images: { data: string; mimeType: string }[] | undefined;
    if (files && files.length > 0) {
      try {
        const formData = new FormData();
        files.forEach((f) => formData.append("files", f.file));
        const res = await fetch("/api/process-files", { method: "POST", body: formData });
        if (res.ok) { const data = await res.json(); images = data.files; }
      } catch {}
    }
    await sendMessage(message, images);
  };

  if (loading) {
    return <AppShell><div className="flex-1 flex items-center justify-center"><Loader2 size={24} className="text-rose-400 animate-spin" /></div></AppShell>;
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/4 pl-14 pr-4 md:px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool size={14} className="text-rose-400" />
              <span className="text-[12px] font-medium text-rose-400">Content Studio</span>
              <span className="text-zinc-700">|</span>
              <span className="text-[12px] text-zinc-500">
                {status === "conversation" ? "Briefing..." : status === "generating" ? "Creating content..." : status === "completed" ? "Content ready" : ""}
              </span>
            </div>
            <SaveToFolder itemType="content" itemId={id} itemTitle={title || "Content"} />
          </div>
        </motion.header>

        {/* Scrollable content */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            {/* Empty state */}
            {messages.length === 0 && !contentData && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/15 flex items-center justify-center mx-auto mb-4">
                  <PenTool size={24} className="text-rose-400" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-200 mb-2">Content Studio</h2>
                <p className="text-[13px] text-zinc-500 max-w-sm mx-auto">
                  Tell me what content you need. I&apos;ll ask a few questions, then create platform-specific posts with scores, timing, and strategy notes.
                </p>
              </motion.div>
            )}

            {/* Messages */}
            {messages.filter((m) => m.content !== "__GENERATE_CONTENT__").map((msg, i) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex gap-3 mb-4">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-white/5 border border-white/8" : "bg-rose-500/10 border border-rose-500/15"
                }`}>
                  {msg.role === "user" ? <User size={13} className="text-zinc-400" /> : <Bot size={13} className="text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <MarkdownRenderer content={msg.role === "user" ? cleanMessageForDisplay(msg.content) : msg.content} />
                  {msg.role === "assistant" && i === messages.filter((m) => m.content !== "__GENERATE_CONTENT__").length - 1 && !sending && (
                    <ModuleHandoff context={msg.content} currentModule="content" />
                  )}
                </div>
              </motion.div>
            ))}

            {sending && (
              <div className="flex gap-3 mb-4">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/15 flex items-center justify-center shrink-0">
                  <Bot size={13} className="text-rose-400" />
                </div>
                <div className="pt-2"><LoadingDots /></div>
              </div>
            )}

            {/* Confirm buttons */}
            <AnimatePresence>
              {showConfirmButtons && !sending && status === "conversation" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 py-4">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generateContent}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-semibold text-[13px] transition-all">
                    <Zap size={15} /> Create Content
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={addMore}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 text-zinc-300 font-medium text-[13px] transition-all">
                    <PlusCircle size={15} /> Add more context
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generating */}
            {generating && (
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 size={18} className="text-rose-400 animate-spin" />
                <span className="text-[13px] text-zinc-500">Creating platform-specific content...</span>
              </div>
            )}

            {/* Retry on failure or empty content */}
            {(status === "failed" || (status === "completed" && (!contentData?.posts || contentData.posts.length === 0))) && (
              <div className="flex justify-center py-4">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generateContent}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-400 font-medium text-[13px] hover:bg-rose-500/20 transition-all">
                  <RefreshCw size={14} /> Retry Content Generation
                </motion.button>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/15 mb-4">
                <p className="text-[13px] text-red-400">{error}</p>
              </div>
            )}

            {/* Content Board */}
            {contentData?.posts && contentData.posts.length > 0 && (
              <div className="space-y-4">
                {/* Strategy overview */}
                {contentData.overallStrategy && (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 mb-2">
                    <p className="text-[10px] uppercase tracking-widest text-rose-400/60 font-semibold mb-1">Overall Strategy</p>
                    <p className="text-[13px] text-zinc-300">{contentData.overallStrategy}</p>
                    {contentData.repurposeChain && (
                      <p className="text-[11px] text-zinc-500 mt-2">
                        <RefreshCw size={10} className="inline mr-1" />
                        {contentData.repurposeChain}
                      </p>
                    )}
                  </div>
                )}

                {contentData.posts.map((post, i) => (
                  <ContentCard
                    key={`${post.platform}-${i}`}
                    post={post}
                    sessionId={id}
                    onRepurpose={(target) => repurposePost(post, target)}
                    onFeedback={(fb) => sendFeedback(post.content.slice(0, 200), fb)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        {(status === "conversation" || status === "completed") && (
          <div className="px-4 sm:px-6 py-3 border-t border-white/4 shrink-0">
            <div className="max-w-2xl mx-auto">
              <SmartInput
                onSend={(msg, files) => handleSend(msg, files)}
                disabled={showConfirmButtons || generating}
                sending={sending}
                placeholder={messages.length === 0 ? "What content do you need? (paste URLs or drop images)" : "Give feedback or ask for changes..."}
                accentColor="bg-rose-500 hover:bg-rose-400"
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
