"use client";

import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Folder, Trash2, Loader2, MessageSquare, Search,
  Lightbulb, TrendingUp, ExternalLink, ArrowLeft,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@ai-system/shared-ui";

interface FolderItem {
  id: string;
  itemType: string;
  itemId: string;
  itemTitle: string;
  createdAt: string;
}

interface FolderData {
  id: string;
  name: string;
  description?: string;
  color: string;
  items: FolderItem[];
}

const typeConfig: Record<string, { icon: typeof MessageSquare; color: string; label: string; route: string }> = {
  chat: { icon: MessageSquare, color: "text-emerald-400", label: "Prompt Chat", route: "/chat" },
  research: { icon: Search, color: "text-cyan-400", label: "Research", route: "/research" },
  critic: { icon: Lightbulb, color: "text-amber-400", label: "Idea Critique", route: "/critic" },
  trends: { icon: TrendingUp, color: "text-orange-400", label: "Trends", route: "/trends" },
};

const COLORS: Record<string, string> = {
  violet: "bg-violet-500", emerald: "bg-emerald-500", cyan: "bg-cyan-500",
  orange: "bg-orange-500", pink: "bg-pink-500", amber: "bg-amber-500",
};

export default function FolderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [folder, setFolder] = useState<FolderData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFolder = useCallback(async () => {
    try {
      const res = await fetch(`/api/folders/${id}`);
      if (res.ok) setFolder(await res.json());
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchFolder(); }, [fetchFolder]);

  const handleRemoveItem = async (itemId: string) => {
    if (!folder) return;
    setFolder({ ...folder, items: folder.items.filter((i) => i.itemId !== itemId) });
    try {
      await fetch(`/api/folders/${id}/items`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
    } catch { await fetchFolder(); }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="text-violet-400 animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!folder) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Folder not found</p>
        </div>
      </AppShell>
    );
  }

  const colorCls = COLORS[folder.color] || "bg-violet-500";

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/4 pl-14 pr-4 md:px-6 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/folders")}
              className="p-1 rounded-md hover:bg-white/5 text-zinc-600 hover:text-zinc-400 transition-smooth">
              <ArrowLeft size={16} />
            </button>
            <div className={`w-4 h-4 rounded-md ${colorCls} shrink-0`} />
            <div className="min-w-0">
              <h1 className="text-[14px] font-semibold text-zinc-200 truncate">{folder.name}</h1>
              {folder.description && (
                <p className="text-[11px] text-zinc-600 truncate">{folder.description}</p>
              )}
            </div>
            <span className="text-[11px] text-zinc-700 shrink-0">{folder.items.length} items</span>
          </div>
        </motion.header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

            {folder.items.length === 0 ? (
              <div className="text-center py-16">
                <Folder size={32} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-[13px] text-zinc-600">This folder is empty</p>
                <p className="text-[11px] text-zinc-700 mt-1">Save sessions to this folder from any page using the 📁 button</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {folder.items.map((item, i) => {
                    const config = typeConfig[item.itemType] || typeConfig.chat;
                    const Icon = config.icon;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.03 }}
                        className="group bg-white/2 border border-white/4 rounded-xl p-4 hover:bg-white/3 transition-smooth"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            item.itemType === "chat" ? "bg-emerald-500/10 border border-emerald-500/15" :
                            item.itemType === "research" ? "bg-cyan-500/10 border border-cyan-500/15" :
                            item.itemType === "critic" ? "bg-amber-500/10 border border-amber-500/15" :
                            "bg-orange-500/10 border border-orange-500/15"
                          )}>
                            <Icon size={14} className={config.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-zinc-200 font-medium truncate">{item.itemTitle}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">{config.label}</span>
                              <span className="text-[10px] text-zinc-700">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => router.push(`${config.route}/${item.itemId}`)}
                              className="p-1.5 rounded-md hover:bg-white/5 text-zinc-600 hover:text-zinc-300 transition-smooth"
                              title="Open"
                            >
                              <ExternalLink size={13} />
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.itemId)}
                              className="p-1.5 rounded-md hover:bg-white/5 text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                              title="Remove from folder"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
