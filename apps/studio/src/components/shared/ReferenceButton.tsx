"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, MessageSquare, Search, Lightbulb, Loader2, X } from "lucide-react";
import { cn } from "@ai-system/shared-ui";

interface RefItem {
  type: "chat" | "research" | "critic";
  id: string;
  title: string;
  status: string;
  preview?: string;
}

const typeConfig = {
  chat: { icon: MessageSquare, color: "text-emerald-400", label: "Chat" },
  research: { icon: Search, color: "text-cyan-400", label: "Research" },
  critic: { icon: Lightbulb, color: "text-amber-400", label: "Critique" },
};

export function ReferenceButton({
  onReference,
}: {
  onReference: (context: string, title: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RefItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleOpen = async () => {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch("/api/references");
      if (res.ok) setItems(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const handleSelect = async (item: RefItem) => {
    setFetching(item.id);
    try {
      const res = await fetch(`/api/references/${item.type}/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        onReference(data.context, data.title);
        setOpen(false);
      }
    } catch {} finally { setFetching(null); }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={cn(
          "p-1.5 rounded-md transition-smooth",
          open ? "bg-violet-500/10 text-violet-400" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
        )}
        title="Reference a previous session"
      >
        <Link2 size={14} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 mb-2 w-72 max-h-80 bg-[#0c0c14] border border-white/8 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/4">
              <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Reference</span>
              <button onClick={() => setOpen(false)} className="p-0.5 rounded hover:bg-white/5 text-zinc-600">
                <X size={12} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-64">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 size={16} className="text-zinc-600 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <p className="text-[12px] text-zinc-600 text-center py-6">No sessions yet</p>
              ) : (
                items.map((item) => {
                  const config = typeConfig[item.type];
                  const Icon = config.icon;
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      onClick={() => handleSelect(item)}
                      disabled={fetching === item.id}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/3 transition-smooth disabled:opacity-50"
                    >
                      {fetching === item.id ? (
                        <Loader2 size={12} className="text-zinc-500 animate-spin shrink-0" />
                      ) : (
                        <Icon size={12} className={cn("shrink-0", config.color)} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-zinc-300 truncate">{item.title}</p>
                        <p className="text-[10px] text-zinc-600">{config.label}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
