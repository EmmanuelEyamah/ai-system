"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft, Sparkles, X, Star, MessageCircle, LogOut } from "lucide-react";
import { useChats } from "@/hooks/useChats";
import { cn } from "@/lib/utils";

function ChatItem({
  chat,
  isActive,
  onNavigate,
  onDelete,
  onToggleStar,
}: {
  chat: { id: string; title: string; taskType: string | null; starred: boolean };
  isActive: boolean;
  onNavigate: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onToggleStar: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onNavigate}
      onKeyDown={(e) => e.key === "Enter" && onNavigate()}
      className={cn(
        "group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left cursor-pointer transition-smooth",
        isActive
          ? "bg-white/5 border border-white/6"
          : "hover:bg-white/3 border border-transparent"
      )}
    >
      <MessageSquare size={14} className={cn(
        "shrink-0 transition-colors",
        isActive ? "text-emerald-400" : "text-zinc-700"
      )} />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-[13px] truncate transition-colors",
          isActive ? "text-zinc-200" : "text-zinc-500"
        )}>
          {chat.title}
        </p>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={onToggleStar}
          className={cn(
            "p-1 rounded hover:bg-white/5 transition-colors",
            chat.starred ? "text-amber-400 opacity-100" : "text-zinc-700 hover:text-amber-400"
          )}
        >
          <Star size={12} fill={chat.starred ? "currentColor" : "none"} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded hover:bg-white/5 text-zinc-700 hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
      {/* Show star persistently if starred */}
      {chat.starred && (
        <Star size={10} fill="currentColor" className="text-amber-400/60 shrink-0 group-hover:hidden" />
      )}
    </div>
  );
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { starredChats, recentChats, loading, createChat, deleteChat, toggleStar } = useChats();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNewChat = async () => {
    const chatId = await createChat();
    if (chatId) {
      router.push(`/chat/${chatId}`);
      setMobileOpen(false);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteChat(id);
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleStar(id);
  };

  const handleChatClick = (id: string) => {
    router.push(`/chat/${id}`);
    setMobileOpen(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  const currentChatId = pathname?.split("/chat/")[1];
  const isEmpty = starredChats.length === 0 && recentChats.length === 0;

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
            <Sparkles size={13} className="text-emerald-400" />
          </div>
          <span className="text-[13px] font-semibold text-zinc-300 tracking-tight">Prompt Studio</span>
        </div>
        <button
          onClick={() => { setCollapsed(true); setMobileOpen(false); }}
          className="p-1.5 rounded-md hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-smooth hidden md:block"
        >
          <PanelLeftClose size={16} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-md hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-smooth md:hidden"
        >
          <X size={16} />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-3 mb-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-emerald-500/8 border border-emerald-500/10 text-emerald-400 text-[13px] font-medium hover:bg-emerald-500/12 hover:border-emerald-500/15 transition-smooth"
        >
          <Plus size={15} />
          New Chat
        </motion.button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          <div className="space-y-1 px-1 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg animate-shimmer" />
            ))}
          </div>
        ) : isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center pt-12 px-4 text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-white/3 border border-white/5 flex items-center justify-center mb-3">
              <MessageCircle size={18} className="text-zinc-700" />
            </div>
            <p className="text-[13px] text-zinc-600 mb-1">No conversations yet</p>
            <p className="text-[11px] text-zinc-700">Start a new chat to begin crafting prompts</p>
          </motion.div>
        ) : (
          <>
            {/* Starred Section */}
            {starredChats.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <Star size={11} className="text-amber-400/60" fill="currentColor" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Favorites</span>
                </div>
                <AnimatePresence mode="popLayout">
                  {starredChats.map((chat, i) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ChatItem
                        chat={chat}
                        isActive={currentChatId === chat.id}
                        onNavigate={() => handleChatClick(chat.id)}
                        onDelete={(e) => handleDeleteChat(e, chat.id)}
                        onToggleStar={(e) => handleToggleStar(e, chat.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Recent Section */}
            {recentChats.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <MessageSquare size={11} className="text-zinc-600" />
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Recent</span>
                </div>
                <AnimatePresence mode="popLayout">
                  {recentChats.map((chat, i) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <ChatItem
                        chat={chat}
                        isActive={currentChatId === chat.id}
                        onNavigate={() => handleChatClick(chat.id)}
                        onDelete={(e) => handleDeleteChat(e, chat.id)}
                        onToggleStar={(e) => handleToggleStar(e, chat.id)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-zinc-600 hover:text-zinc-400 hover:bg-white/3 transition-smooth"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-white/5 border border-white/8 text-zinc-400 hover:text-zinc-200 transition-smooth"
      >
        <PanelLeft size={18} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-70 bg-[#08080c] border-r border-white/4 flex flex-col overflow-hidden"
            >
              {sidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop collapsed */}
      {collapsed && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 56, opacity: 1 }}
          className="hidden md:flex h-full bg-[#08080c] border-r border-white/4 flex-col items-center py-4 gap-2"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCollapsed(false)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-smooth"
          >
            <PanelLeft size={18} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNewChat}
            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-smooth"
          >
            <Plus size={18} />
          </motion.button>
        </motion.div>
      )}

      {/* Desktop expanded */}
      {!collapsed && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 260, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          className="hidden md:flex h-full bg-[#08080c] border-r border-white/4 flex-col overflow-hidden"
        >
          {sidebarContent}
        </motion.div>
      )}
    </>
  );
}
