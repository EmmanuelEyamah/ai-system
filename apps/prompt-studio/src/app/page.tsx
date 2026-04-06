"use client";

import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, MessageSquare, Zap, Target, Layers, Clock, Star, Trash2, MessageCircle } from "lucide-react";
import { useChats } from "@/hooks/useChats";
import { cn } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } },
};

const features = [
  {
    icon: Target,
    title: "Intent Analysis",
    desc: "Detects task type, identifies context gaps, and asks precise clarifying questions.",
  },
  {
    icon: Layers,
    title: "5 Prompt Variants",
    desc: "Best, concise, advanced, OpenAI-tuned, and Claude-tuned — each genuinely different.",
  },
  {
    icon: Zap,
    title: "Live Testing",
    desc: "Run any prompt against GPT-4o or Claude instantly. Copy, refine, regenerate.",
  },
];

function ChatCard({
  chat,
  onNavigate,
  onDelete,
  onToggleStar,
}: {
  chat: { id: string; title: string; taskType: string | null; starred: boolean; _count?: { messages: number } };
  onNavigate: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.08)" }}
      className="group relative"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onNavigate}
        onKeyDown={(e) => e.key === "Enter" && onNavigate()}
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/2 border border-white/4 hover:bg-white/3 text-left cursor-pointer transition-smooth"
      >
        <MessageSquare size={14} className="text-zinc-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-zinc-300 truncate">{chat.title}</p>
          <p className="text-[11px] text-zinc-700">
            {chat._count?.messages || 0} messages
            {chat.taskType && ` · ${chat.taskType}`}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={onToggleStar}
            className={cn(
              "p-1.5 rounded-md hover:bg-white/5 transition-colors",
              chat.starred ? "text-amber-400" : "text-zinc-700 hover:text-amber-400"
            )}
          >
            <Star size={13} fill={chat.starred ? "currentColor" : "none"} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-white/5 text-zinc-700 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
        {chat.starred && (
          <Star size={10} fill="currentColor" className="text-amber-400/50 shrink-0 group-hover:hidden" />
        )}
        <ArrowRight size={12} className="text-zinc-700 shrink-0 hidden group-hover:block" />
      </div>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const { starredChats, recentChats, loading, createChat, deleteChat, toggleStar } = useChats();

  const handleNewChat = async () => {
    const chatId = await createChat();
    if (chatId) router.push(`/chat/${chatId}`);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteChat(id);
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleStar(id);
  };

  const hasChats = starredChats.length > 0 || recentChats.length > 0;

  return (
    <div className="h-full flex flex-col relative bg-grid noise">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-100 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/4"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles size={16} className="text-emerald-400" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-200">Prompt Studio</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/8 text-sm text-zinc-300 hover:bg-white/8 hover:border-white/12 transition-smooth"
        >
          <Sparkles size={14} />
          New Chat
        </motion.button>
      </motion.header>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-3xl mx-auto px-6 pt-20 pb-12"
        >
          {/* Hero */}
          <motion.div variants={item} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-glow" />
              <span className="text-xs font-medium text-emerald-400/90">Multi-Agent Prompt Engineering</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-5">
              <span className="text-white">Craft perfect</span>
              <br />
              <span className="gradient-text">prompts, instantly</span>
            </h1>

            <p className="text-base text-zinc-500 max-w-md mx-auto leading-relaxed mb-10">
              Paste any idea. Our agents analyze, clarify, and generate
              optimized prompts for ChatGPT and Claude.
            </p>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNewChat}
              className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-all duration-200 glow"
            >
              Start Building
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          </motion.div>

          {/* Features */}
          <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-16">
            {features.map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -2, borderColor: "rgba(255,255,255,0.08)" }}
                className="group p-5 rounded-xl bg-white/2 border border-white/4 transition-smooth"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/8 border border-emerald-500/10 flex items-center justify-center mb-4">
                  <f.icon size={16} className="text-emerald-400/80" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-200 mb-1.5">{f.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Starred Chats */}
          {!loading && starredChats.length > 0 && (
            <motion.div variants={item} className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Star size={13} className="text-amber-400/60" fill="currentColor" />
                <h2 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">Favorites</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <AnimatePresence>
                  {starredChats.map((chat) => (
                    <ChatCard
                      key={chat.id}
                      chat={chat}
                      onNavigate={() => router.push(`/chat/${chat.id}`)}
                      onDelete={(e) => handleDelete(e, chat.id)}
                      onToggleStar={(e) => handleToggleStar(e, chat.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Recent Chats */}
          {!loading && recentChats.length > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={13} className="text-zinc-600" />
                <h2 className="text-[11px] font-semibold text-zinc-600 uppercase tracking-widest">Recent</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <AnimatePresence>
                  {recentChats.slice(0, 6).map((chat) => (
                    <ChatCard
                      key={chat.id}
                      chat={chat}
                      onNavigate={() => router.push(`/chat/${chat.id}`)}
                      onDelete={(e) => handleDelete(e, chat.id)}
                      onToggleStar={(e) => handleToggleStar(e, chat.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && !hasChats && (
            <motion.div variants={item} className="text-center pt-4">
              <div className="w-12 h-12 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={20} className="text-zinc-700" />
              </div>
              <p className="text-[13px] text-zinc-600 mb-1">No conversations yet</p>
              <p className="text-[11px] text-zinc-700">Click &quot;Start Building&quot; to create your first prompt</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
