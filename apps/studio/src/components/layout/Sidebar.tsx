"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MessageSquare, Search, Trash2, PanelLeftClose, PanelLeft,
  Layers, X, Star, LogOut, ChevronDown, Lightbulb, TrendingUp, Folder, PenTool, Target,
} from "lucide-react";
import { useChats } from "@/modules/chat/hooks/useChats";
import { useResearchSessions } from "@/modules/research/hooks/useResearchSessions";
import { useCritiques } from "@/modules/critic/hooks/useCritiques";
import { useTrendSessions } from "@/modules/trends/hooks/useTrendSessions";
import { useContentSessions } from "@/modules/content/hooks/useContentSessions";
import { useStrategistSessions } from "@/modules/strategist/hooks/useStrategistSessions";
import { cn } from "@ai-system/shared-ui";

function ItemRow({
  icon: Icon,
  iconColor,
  activeColor,
  title,
  isActive,
  starred,
  onNavigate,
  onDelete,
  onToggleStar,
}: {
  icon: typeof MessageSquare;
  iconColor: string;
  activeColor: string;
  title: string;
  isActive: boolean;
  starred: boolean;
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
        "group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-smooth overflow-hidden",
        isActive ? "bg-white/5 border border-white/6" : "hover:bg-white/3 border border-transparent"
      )}
    >
      <Icon size={12} className={cn("shrink-0 transition-colors", isActive ? activeColor : iconColor)} />
      <span className={cn("block text-[12px] truncate transition-colors", isActive ? "text-zinc-200" : "text-zinc-500")} style={{ minWidth: 0, flex: "1 1 0%" }}>
        {title}
      </span>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={onToggleStar} className={cn("p-0.5 rounded hover:bg-white/5 transition-colors", starred ? "text-amber-400 opacity-100" : "text-zinc-700 hover:text-amber-400")}>
          <Star size={10} fill={starred ? "currentColor" : "none"} />
        </button>
        <button onClick={onDelete} className="p-0.5 rounded hover:bg-white/5 text-zinc-700 hover:text-red-400 transition-colors">
          <Trash2 size={10} />
        </button>
      </div>
      {starred && <Star size={8} fill="currentColor" className="text-amber-400/60 shrink-0 group-hover:hidden" />}
    </div>
  );
}

function AccordionSection({
  label,
  icon: Icon,
  iconColor,
  count,
  defaultOpen,
  children,
}: {
  label: string;
  icon: typeof MessageSquare;
  iconColor: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left hover:bg-white/3 rounded-md transition-smooth"
      >
        <ChevronDown size={10} className={cn("text-zinc-600 transition-transform shrink-0", !open && "-rotate-90")} />
        <Icon size={11} className={cn("shrink-0", iconColor)} />
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold truncate">{label}</span>
        {count > 0 && <span className="text-[9px] text-zinc-700 shrink-0">({count})</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="py-0.5 overflow-hidden">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NewDropdown({ onNewChat, onNewResearch, onNewCritique, onNewTrend, onNewContent, onNewStrategist }: { onNewChat: () => void; onNewResearch: () => void; onNewCritique: () => void; onNewTrend: () => void; onNewContent: () => void; onNewStrategist: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-zinc-300 text-[12px] font-medium hover:bg-white/8 hover:border-white/12 transition-smooth"
      >
        <Plus size={13} />
        New
        <ChevronDown size={11} className={cn("text-zinc-500 transition-transform", open && "rotate-180")} />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-[#0c0c14] border border-white/8 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
          >
            <button
              onClick={() => { onNewChat(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/3 transition-smooth"
            >
              <MessageSquare size={13} className="text-emerald-400" />
              <div>
                <p className="text-[12px] text-zinc-200 font-medium">New Chat</p>
                <p className="text-[10px] text-zinc-600">Prompt engineering</p>
              </div>
            </button>
            <div className="h-px bg-white/4 mx-3" />
            <button
              onClick={() => { onNewResearch(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/3 transition-smooth"
            >
              <Search size={13} className="text-cyan-400" />
              <div>
                <p className="text-[12px] text-zinc-200 font-medium">New Research</p>
                <p className="text-[10px] text-zinc-600">Deep research agent</p>
              </div>
            </button>
            <div className="h-px bg-white/4 mx-3" />
            <button
              onClick={() => { onNewCritique(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/3 transition-smooth"
            >
              <Lightbulb size={13} className="text-amber-400" />
              <div>
                <p className="text-[12px] text-zinc-200 font-medium">New Idea Critique</p>
                <p className="text-[10px] text-zinc-600">Get honest feedback</p>
              </div>
            </button>
            <div className="h-px bg-white/4 mx-3" />
            <button
              onClick={() => { onNewTrend(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/3 transition-smooth"
            >
              <TrendingUp size={13} className="text-orange-400" />
              <div>
                <p className="text-[12px] text-zinc-200 font-medium">New Trend Search</p>
                <p className="text-[10px] text-zinc-600">Find trending content</p>
              </div>
            </button>
            <div className="h-px bg-white/4 mx-3" />
            <button
              onClick={() => { onNewContent(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/3 transition-smooth"
            >
              <PenTool size={13} className="text-rose-400" />
              <div>
                <p className="text-[12px] text-zinc-200 font-medium">New Content</p>
                <p className="text-[10px] text-zinc-600">Create platform content</p>
              </div>
            </button>
            <div className="h-px bg-white/4 mx-3" />
            <button
              onClick={() => { onNewStrategist(); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/3 transition-smooth"
            >
              <Target size={13} className="text-indigo-400" />
              <div>
                <p className="text-[12px] text-zinc-200 font-medium">New Strategy Session</p>
                <p className="text-[10px] text-zinc-600">Talk to your $500/hr advisor</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { starredChats, recentChats, loading: chatsLoading, createChat, deleteChat, toggleStar: toggleChatStar } = useChats();
  const { starredSessions, recentSessions, loading: researchLoading, createSession, deleteSession, toggleStar: toggleResearchStar } = useResearchSessions();
  const { critiques, loading: criticsLoading, createCritique, deleteCritique, toggleStar: toggleCriticStar } = useCritiques();
  const { sessions: trendSessions, loading: trendsLoading, deleteSession: deleteTrend, toggleStar: toggleTrendStar } = useTrendSessions();
  const { sessions: contentSessions, loading: contentLoading, createSession: createContent, deleteSession: deleteContent, toggleStar: toggleContentStar } = useContentSessions();
  const { sessions: strategistSessions, loading: strategistLoading, createSession: createStrategist, deleteSession: deleteStrategist, toggleStar: toggleStrategistStar } = useStrategistSessions();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const loading = chatsLoading || researchLoading || criticsLoading || trendsLoading || contentLoading || strategistLoading;
  const allChats = [...starredChats, ...recentChats];
  const allResearch = [...starredSessions, ...recentSessions];

  const handleNewChat = async () => {
    const chatId = await createChat();
    if (chatId) { router.push(`/chat/${chatId}`); setMobileOpen(false); }
  };

  const handleNewResearch = () => {
    router.push("/");
    setMobileOpen(false);
  };

  const handleNewCritique = async () => {
    const critiqueId = await createCritique();
    if (critiqueId) { router.push(`/critic/${critiqueId}`); setMobileOpen(false); }
  };

  const handleNewTrend = () => {
    router.push("/trends/new");
    setMobileOpen(false);
  };

  const handleNewContent = async () => {
    const sessionId = await createContent();
    if (sessionId) { router.push(`/content/${sessionId}`); setMobileOpen(false); }
  };

  const handleNewStrategist = async () => {
    const sessionId = await createStrategist();
    if (sessionId) { router.push(`/strategist/${sessionId}`); setMobileOpen(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  const currentChatId = pathname?.startsWith("/chat/") ? pathname.split("/chat/")[1] : null;
  const currentResearchId = pathname?.startsWith("/research/") ? pathname.split("/research/")[1] : null;
  const currentCriticId = pathname?.startsWith("/critic/") ? pathname.split("/critic/")[1] : null;
  const currentTrendId = pathname?.startsWith("/trends/") ? pathname.split("/trends/")[1] : null;
  const currentContentId = pathname?.startsWith("/content/") ? pathname.split("/content/")[1] : null;
  const currentStrategistId = pathname?.startsWith("/strategist/") ? pathname.split("/strategist/")[1] : null;

  const sidebarContent = (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 shrink-0">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { router.push("/"); setMobileOpen(false); }}>
          <div className="w-7 h-7 rounded-md bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
            <Layers size={13} className="text-violet-400" />
          </div>
          <span className="text-[13px] font-semibold text-zinc-300 tracking-tight">Studio</span>
        </div>
        <button onClick={() => { setCollapsed(true); setMobileOpen(false); }}
          className="p-1.5 rounded-md hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-smooth hidden md:block">
          <PanelLeftClose size={16} />
        </button>
        <button onClick={() => setMobileOpen(false)}
          className="p-1.5 rounded-md hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-smooth md:hidden">
          <X size={16} />
        </button>
      </div>

      {/* New button with dropdown */}
      <div className="px-3 mb-3 shrink-0">
        <NewDropdown onNewChat={handleNewChat} onNewResearch={handleNewResearch} onNewCritique={handleNewCritique} onNewTrend={handleNewTrend} onNewContent={handleNewContent} onNewStrategist={handleNewStrategist} />
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3 min-h-0">
        {loading ? (
          <div className="space-y-1 px-1 pt-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 rounded-lg animate-shimmer" />)}
          </div>
        ) : (
          <>
            <AccordionSection label="Prompt Studio" icon={MessageSquare} iconColor="text-emerald-400/60" count={allChats.length} defaultOpen={true}>
              {allChats.length === 0 ? (
                <p className="text-[11px] text-zinc-700 px-3 py-2">No chats yet</p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {allChats.map((chat, i) => (
                    <motion.div key={chat.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}>
                      <ItemRow icon={MessageSquare} iconColor="text-zinc-700" activeColor="text-emerald-400"
                        title={chat.title} isActive={currentChatId === chat.id} starred={chat.starred}
                        onNavigate={() => { router.push(`/chat/${chat.id}`); setMobileOpen(false); }}
                        onDelete={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                        onToggleStar={(e) => { e.stopPropagation(); toggleChatStar(chat.id); }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </AccordionSection>

            <AccordionSection label="Research Hub" icon={Search} iconColor="text-cyan-400/60" count={allResearch.length} defaultOpen={true}>
              {allResearch.length === 0 ? (
                <p className="text-[11px] text-zinc-700 px-3 py-2">No research yet</p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {allResearch.map((session, i) => (
                    <motion.div key={session.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}>
                      <ItemRow icon={Search} iconColor="text-zinc-700" activeColor="text-cyan-400"
                        title={session.title} isActive={currentResearchId === session.id} starred={session.starred}
                        onNavigate={() => { router.push(`/research/${session.id}`); setMobileOpen(false); }}
                        onDelete={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                        onToggleStar={(e) => { e.stopPropagation(); toggleResearchStar(session.id); }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </AccordionSection>

            <AccordionSection label="Idea Critic" icon={Lightbulb} iconColor="text-amber-400/60" count={critiques.length} defaultOpen={true}>
              {critiques.length === 0 ? (
                <p className="text-[11px] text-zinc-700 px-3 py-2">No ideas yet</p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {critiques.map((critique, i) => (
                    <motion.div key={critique.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}>
                      <ItemRow icon={Lightbulb} iconColor="text-zinc-700" activeColor="text-amber-400"
                        title={critique.title} isActive={currentCriticId === critique.id} starred={critique.starred}
                        onNavigate={() => { router.push(`/critic/${critique.id}`); setMobileOpen(false); }}
                        onDelete={(e) => { e.stopPropagation(); deleteCritique(critique.id); }}
                        onToggleStar={(e) => { e.stopPropagation(); toggleCriticStar(critique.id); }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </AccordionSection>

            <AccordionSection label="Trends" icon={TrendingUp} iconColor="text-orange-400/60" count={trendSessions.length} defaultOpen={true}>
              {trendSessions.length === 0 ? (
                <p className="text-[11px] text-zinc-700 px-3 py-2">No trend searches yet</p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {trendSessions.map((session, i) => (
                    <motion.div key={session.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}>
                      <ItemRow icon={TrendingUp} iconColor="text-zinc-700" activeColor="text-orange-400"
                        title={session.title} isActive={currentTrendId === session.id} starred={session.starred}
                        onNavigate={() => { router.push(`/trends/${session.id}`); setMobileOpen(false); }}
                        onDelete={(e) => { e.stopPropagation(); deleteTrend(session.id); }}
                        onToggleStar={(e) => { e.stopPropagation(); toggleTrendStar(session.id); }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </AccordionSection>

            <AccordionSection label="Content Studio" icon={PenTool} iconColor="text-rose-400/60" count={contentSessions.length} defaultOpen={true}>
              {contentSessions.length === 0 ? (
                <p className="text-[11px] text-zinc-700 px-3 py-2">No content yet</p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {contentSessions.map((session, i) => (
                    <motion.div key={session.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}>
                      <ItemRow icon={PenTool} iconColor="text-zinc-700" activeColor="text-rose-400"
                        title={session.title} isActive={currentContentId === session.id} starred={session.starred}
                        onNavigate={() => { router.push(`/content/${session.id}`); setMobileOpen(false); }}
                        onDelete={(e) => { e.stopPropagation(); deleteContent(session.id); }}
                        onToggleStar={(e) => { e.stopPropagation(); toggleContentStar(session.id); }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </AccordionSection>

            <AccordionSection label="Strategist" icon={Target} iconColor="text-indigo-400/60" count={strategistSessions.length} defaultOpen={true}>
              {strategistSessions.length === 0 ? (
                <p className="text-[11px] text-zinc-700 px-3 py-2">No sessions yet</p>
              ) : (
                <AnimatePresence mode="popLayout">
                  {strategistSessions.map((session, i) => (
                    <motion.div key={session.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}>
                      <ItemRow icon={Target} iconColor="text-zinc-700" activeColor="text-indigo-400"
                        title={session.title} isActive={currentStrategistId === session.id} starred={session.starred}
                        onNavigate={() => { router.push(`/strategist/${session.id}`); setMobileOpen(false); }}
                        onDelete={(e) => { e.stopPropagation(); deleteStrategist(session.id); }}
                        onToggleStar={(e) => { e.stopPropagation(); toggleStrategistStar(session.id); }}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </AccordionSection>
          </>
        )}
      </div>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-white/4 shrink-0 space-y-1">
        <button onClick={() => { router.push("/folders"); setMobileOpen(false); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-violet-400/70 hover:text-violet-400 hover:bg-violet-500/5 transition-smooth">
          <Folder size={14} /> View All Folders
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-zinc-600 hover:text-zinc-400 hover:bg-white/3 transition-smooth">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-white/5 border border-white/8 text-zinc-400 hover:text-zinc-200 transition-smooth">
        <PanelLeft size={18} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }} onClick={(e) => e.stopPropagation()}
              className="h-full w-64 bg-[#08080c] border-r border-white/4 overflow-hidden">
              {sidebarContent}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop collapsed */}
      {collapsed && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 56, opacity: 1 }}
          className="hidden md:flex h-full bg-[#08080c] border-r border-white/4 flex-col items-center py-4 gap-2 shrink-0">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setCollapsed(false)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-smooth">
            <PanelLeft size={18} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={handleNewChat}
            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-smooth">
            <Plus size={18} />
          </motion.button>
        </motion.div>
      )}

      {/* Desktop expanded */}
      {!collapsed && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 260, opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
          className="hidden md:flex h-full bg-[#08080c] border-r border-white/4 shrink-0 overflow-hidden">
          {sidebarContent}
        </motion.div>
      )}
    </>
  );
}
