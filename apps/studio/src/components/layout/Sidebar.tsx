"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, MessageSquare, Search, Trash2, PanelLeftClose, PanelLeft,
  Layers, X, Star, LogOut, ChevronDown, Lightbulb, TrendingUp,
  Folder, PenTool, Target, Heart,
} from "lucide-react";
import { useStudio } from "@/providers/StudioProvider";
import { cn } from "@ai-system/shared-ui";

type ModuleKey = "chats" | "research" | "critiques" | "trends" | "content" | "strategist" | "coach";

const MODULE_CONFIG: Record<ModuleKey, {
  label: string; icon: typeof MessageSquare; iconColor: string; activeColor: string;
  route: string; apiPath: string;
}> = {
  chats: { label: "Prompt Studio", icon: MessageSquare, iconColor: "text-emerald-400/60", activeColor: "text-emerald-400", route: "/chat", apiPath: "/api/chat" },
  research: { label: "Research Hub", icon: Search, iconColor: "text-cyan-400/60", activeColor: "text-cyan-400", route: "/research", apiPath: "/api/research" },
  critiques: { label: "Idea Critic", icon: Lightbulb, iconColor: "text-amber-400/60", activeColor: "text-amber-400", route: "/critic", apiPath: "/api/critic" },
  trends: { label: "Trends", icon: TrendingUp, iconColor: "text-orange-400/60", activeColor: "text-orange-400", route: "/trends", apiPath: "/api/trends" },
  content: { label: "Content Studio", icon: PenTool, iconColor: "text-rose-400/60", activeColor: "text-rose-400", route: "/content", apiPath: "/api/content" },
  strategist: { label: "Strategist", icon: Target, iconColor: "text-indigo-400/60", activeColor: "text-indigo-400", route: "/strategist", apiPath: "/api/strategist" },
  coach: { label: "Coach", icon: Heart, iconColor: "text-pink-400/60", activeColor: "text-pink-400", route: "/coach", apiPath: "/api/coach" },
};

function ItemRow({ icon: Icon, iconColor, activeColor, title, isActive, starred, onNavigate, onDelete, onToggleStar }: {
  icon: typeof MessageSquare; iconColor: string; activeColor: string; title: string;
  isActive: boolean; starred: boolean; onNavigate: () => void;
  onDelete: (e: React.MouseEvent) => void; onToggleStar: (e: React.MouseEvent) => void;
}) {
  return (
    <div role="button" tabIndex={0} onClick={onNavigate}
      onKeyDown={(e) => e.key === "Enter" && onNavigate()}
      className={cn(
        "group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left cursor-pointer transition-smooth overflow-hidden",
        isActive ? "bg-white/5 border border-white/6" : "hover:bg-white/3 border border-transparent"
      )}>
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

function AccordionSection({ label, icon: Icon, iconColor, count, defaultOpen, children }: {
  label: string; icon: typeof MessageSquare; iconColor: string; count: number; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  return (
    <div className="mb-1">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-left hover:bg-white/3 rounded-md transition-smooth">
        <ChevronDown size={10} className={cn("text-zinc-600 transition-transform shrink-0", !open && "-rotate-90")} />
        <Icon size={11} className={cn("shrink-0", iconColor)} />
        <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold truncate">{label}</span>
        {count > 0 && <span className="text-[9px] text-zinc-700 shrink-0">({count})</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="py-0.5 overflow-hidden">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const NEW_OPTIONS: { key: ModuleKey; icon: typeof MessageSquare; color: string; label: string; desc: string }[] = [
  { key: "chats", icon: MessageSquare, color: "text-emerald-400", label: "New Chat", desc: "Prompt engineering" },
  { key: "research", icon: Search, color: "text-cyan-400", label: "New Research", desc: "Deep research agent" },
  { key: "critiques", icon: Lightbulb, color: "text-amber-400", label: "New Idea Critique", desc: "Get honest feedback" },
  { key: "trends", icon: TrendingUp, color: "text-orange-400", label: "New Trend Search", desc: "Find trending content" },
  { key: "content", icon: PenTool, color: "text-rose-400", label: "New Content", desc: "Create platform content" },
  { key: "strategist", icon: Target, color: "text-indigo-400", label: "New Strategy", desc: "$500/hr marketing advisor" },
  { key: "coach", icon: Heart, color: "text-pink-400", label: "New Coaching", desc: "Personal growth coach" },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading, refetch, removeItem, updateItem, addItem } = useStudio();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const newRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (newRef.current && !newRef.current.contains(e.target as Node)) setNewOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getActiveId = (route: string) => {
    if (pathname?.startsWith(route + "/")) return pathname.split(route + "/")[1];
    return null;
  };

  const handleNew = async (moduleKey: ModuleKey) => {
    setNewOpen(false);
    if (moduleKey === "trends") { router.push("/trends/new"); setMobileOpen(false); return; }
    const config = MODULE_CONFIG[moduleKey];
    try {
      const res = await fetch(config.apiPath, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) {
        const d = await res.json();
        const id = d.sessionId || d.chatId || d.critiqueId || d.id;
        if (id) {
          addItem(moduleKey, { id, title: "New", starred: false, updatedAt: new Date().toISOString() });
          router.push(`${config.route}/${id}`);
          setMobileOpen(false);
        }
      }
    } catch {}
  };

  const handleDelete = async (e: React.MouseEvent, moduleKey: ModuleKey, id: string) => {
    e.stopPropagation();
    removeItem(moduleKey, id);
    try { await fetch(`${MODULE_CONFIG[moduleKey].apiPath}/${id}`, { method: "DELETE" }); } catch { refetch(); }
  };

  const handleStar = async (e: React.MouseEvent, moduleKey: ModuleKey, id: string, currentStarred: boolean) => {
    e.stopPropagation();
    updateItem(moduleKey, id, { starred: !currentStarred });
    try {
      await fetch(`${MODULE_CONFIG[moduleKey].apiPath}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ starred: !currentStarred }) });
    } catch { updateItem(moduleKey, id, { starred: currentStarred }); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-full overflow-hidden">
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

      <div className="px-3 mb-3 shrink-0" ref={newRef}>
        <div className="relative">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={() => setNewOpen(!newOpen)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8 text-zinc-300 text-[12px] font-medium hover:bg-white/8 hover:border-white/12 transition-smooth">
            <Plus size={13} /> New <ChevronDown size={11} className={cn("text-zinc-500 transition-transform", newOpen && "rotate-180")} />
          </motion.button>
          <AnimatePresence>
            {newOpen && (
              <motion.div initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }} transition={{ duration: 0.12 }}
                className="absolute top-full left-0 right-0 mt-1.5 bg-[#0c0c14] border border-white/8 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 max-h-96 overflow-y-auto">
                {NEW_OPTIONS.map((opt, i) => {
                  const Icon = opt.icon;
                  return (
                    <div key={opt.key}>
                      {i > 0 && <div className="h-px bg-white/4 mx-3" />}
                      <button onClick={() => handleNew(opt.key)}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left hover:bg-white/3 transition-smooth">
                        <Icon size={13} className={opt.color} />
                        <div>
                          <p className="text-[12px] text-zinc-200 font-medium">{opt.label}</p>
                          <p className="text-[10px] text-zinc-600">{opt.desc}</p>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3 min-h-0">
        {loading ? (
          <div className="space-y-1 px-1 pt-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-8 rounded-lg animate-shimmer" />)}
          </div>
        ) : (
          (Object.keys(MODULE_CONFIG) as ModuleKey[]).map((moduleKey) => {
            const config = MODULE_CONFIG[moduleKey];
            const items = data[moduleKey];
            const Icon = config.icon;
            const activeId = getActiveId(config.route);

            return (
              <AccordionSection key={moduleKey} label={config.label} icon={Icon}
                iconColor={config.iconColor} count={items.length} defaultOpen={items.length > 0}>
                {items.length === 0 ? (
                  <p className="text-[11px] text-zinc-700 px-3 py-2">No sessions yet</p>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {items.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: -20 }} transition={{ delay: i * 0.02 }}>
                        <ItemRow icon={Icon} iconColor="text-zinc-700" activeColor={config.activeColor}
                          title={item.title} isActive={activeId === item.id} starred={item.starred}
                          onNavigate={() => { router.push(`${config.route}/${item.id}`); setMobileOpen(false); }}
                          onDelete={(e) => handleDelete(e, moduleKey, item.id)}
                          onToggleStar={(e) => handleStar(e, moduleKey, item.id, item.starred)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </AccordionSection>
            );
          })
        )}
      </div>

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
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 p-2 rounded-lg bg-white/5 border border-white/8 text-zinc-400 hover:text-zinc-200 transition-smooth">
        <PanelLeft size={18} />
      </button>

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

      {collapsed && (
        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 56, opacity: 1 }}
          className="hidden md:flex h-full bg-[#08080c] border-r border-white/4 flex-col items-center py-4 gap-2 shrink-0">
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => setCollapsed(false)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-smooth">
            <PanelLeft size={18} />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => handleNew("chats")}
            className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-smooth">
            <Plus size={18} />
          </motion.button>
        </motion.div>
      )}

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
