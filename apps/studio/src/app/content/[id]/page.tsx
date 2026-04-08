"use client";

import { use, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Send, PenTool, Zap, PlusCircle, User, Bot, Link2, X, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ContentCard } from "@/modules/content/components/ContentCard";
import { ReferenceButton } from "@/components/shared/ReferenceButton";
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

  const [input, setInput] = useState("");
  const [references, setReferences] = useState<{ title: string; context: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchSession(); }, [fetchSession]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const addReference = (context: string, title: string) => {
    setReferences((prev) => [...prev, { title, context }]);
  };

  const removeReference = (index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const refContext = references.map((r) => r.context).join("\n\n---\n\n");
    const msg = refContext ? `${refContext}\n\n${input.trim()}` : input.trim();
    setReferences([]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(msg);
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
              <div className="bg-white/2 border border-white/5 rounded-xl p-1.5">
                {references.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 px-3 pt-2 pb-1">
                    {references.map((ref, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/15 text-[11px] text-violet-400">
                        <Link2 size={10} />
                        <span className="truncate max-w-36">{ref.title}</span>
                        <button onClick={() => removeReference(i)} className="hover:text-violet-300 ml-0.5"><X size={10} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-2">
                  <ReferenceButton onReference={(context, t) => addReference(context, t)} />
                  <textarea ref={textareaRef} value={input}
                    onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px"; }}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={messages.length === 0 ? "What content do you need? (use 🔗 to reference past work)" : status === "completed" ? "Give feedback or ask for changes..." : "Add more context..."}
                    rows={1} disabled={sending || showConfirmButtons || generating}
                    className="flex-1 px-3 py-2.5 bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none disabled:opacity-50" />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleSend} disabled={!input.trim() || sending || showConfirmButtons || generating}
                    className="p-2.5 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:bg-white/5 disabled:text-zinc-600 text-white transition-all shrink-0 mb-0.5">
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
