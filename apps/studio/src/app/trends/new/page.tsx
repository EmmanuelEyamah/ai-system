"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, Search, Youtube, MessageCircle, Globe,
  Linkedin, Twitter, Instagram, Music2, Loader2, User, Hash,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { cn } from "@ai-system/shared-ui";

type SearchMode = "topic" | "channel" | "account";

const platforms = [
  { id: "youtube", label: "YouTube", icon: Youtube, color: "text-red-400", border: "border-red-500/20", bg: "bg-red-500/10" },
  { id: "reddit", label: "Reddit", icon: MessageCircle, color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/10" },
  { id: "web", label: "Web", icon: Globe, color: "text-blue-400", border: "border-blue-500/20", bg: "bg-blue-500/10" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, color: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/10" },
  { id: "twitter", label: "Twitter/X", icon: Twitter, color: "text-zinc-300", border: "border-zinc-500/20", bg: "bg-zinc-500/10" },
  { id: "instagram", label: "Instagram", icon: Instagram, color: "text-pink-400", border: "border-pink-500/20", bg: "bg-pink-500/10" },
  { id: "tiktok", label: "TikTok", icon: Music2, color: "text-emerald-400", border: "border-emerald-500/20", bg: "bg-emerald-500/10" },
];

const modes: { id: SearchMode; label: string; icon: typeof Search; desc: string }[] = [
  { id: "topic", label: "Topic / Niche", icon: Hash, desc: "Search trending content in a niche" },
  { id: "channel", label: "YouTube Channel", icon: Youtube, desc: "Track a specific channel's performance" },
  { id: "account", label: "Account / Profile", icon: User, desc: "Track a specific person's content" },
];

export default function NewTrendPage() {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("topic");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(["youtube", "reddit", "web"]));
  const [creating, setCreating] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === platforms.length) setSelected(new Set());
    else setSelected(new Set(platforms.map((p) => p.id)));
  };

  const handleSearch = async () => {
    if (!query.trim() || creating) return;
    if (mode === "topic" && selected.size === 0) return;
    setCreating(true);
    try {
      const selectedPlatforms = mode === "channel"
        ? ["youtube"]
        : mode === "account"
          ? Array.from(selected).length > 0 ? Array.from(selected) : ["linkedin", "twitter"]
          : Array.from(selected);

      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          platforms: selectedPlatforms,
          searchMode: mode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/trends/${data.sessionId}`);
      }
    } catch {} finally { setCreating(false); }
  };

  const placeholders: Record<SearchMode, string> = {
    topic: "e.g., AI tools for small businesses, fitness coaching, SaaS marketing",
    channel: "e.g., Alex Hormozi, @hormozi, or youtube.com/@hormozi",
    account: "e.g., Justin Welsh, @justinwelsh, or a profile URL",
  };

  const labels: Record<SearchMode, string> = {
    topic: "What niche or topic?",
    channel: "YouTube channel name or URL",
    account: "Account name, handle, or profile URL",
  };

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/15 flex items-center justify-center mx-auto mb-4">
                <TrendingUp size={24} className="text-orange-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Trend Search</h1>
              <p className="text-[13px] text-zinc-500">Find trending content, track channels, or follow accounts</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {/* Search mode toggle */}
              <div className="mb-6">
                <label className="block text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">
                  Search by
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {modes.map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          setMode(m.id);
                          if (m.id === "channel") setSelected(new Set(["youtube"]));
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-smooth",
                          mode === m.id
                            ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                            : "bg-white/2 border-white/4 text-zinc-600 hover:bg-white/3"
                        )}
                      >
                        <Icon size={16} />
                        <span className="text-[11px] font-medium">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Query input */}
              <div className="mb-6">
                <label className="block text-[11px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">
                  {labels[mode]}
                </label>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={placeholders[mode]}
                  className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/6 text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/30 focus:bg-white/4 transition-all"
                />
              </div>

              {/* Platform checkboxes — hide for YouTube channel mode */}
              {mode !== "channel" && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
                      {mode === "account" ? "Search on" : "Platforms"}
                    </label>
                    <button onClick={selectAll} className="text-[11px] text-orange-400 hover:text-orange-300 transition-colors">
                      {selected.size === platforms.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {platforms.map((p) => {
                      const isSelected = selected.has(p.id);
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.id}
                          onClick={() => toggle(p.id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-smooth",
                            isSelected ? `${p.bg} ${p.border} ${p.color}` : "bg-white/2 border-white/4 text-zinc-600 hover:bg-white/3"
                          )}
                        >
                          <Icon size={14} />
                          <span className="text-[12px] font-medium">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {mode === "channel" && (
                <div className="mb-6 bg-white/2 border border-white/4 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Youtube size={14} className="text-red-400" />
                    <span className="text-[12px] text-zinc-400">Will search this channel's recent videos using YouTube API</span>
                  </div>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                disabled={!query.trim() || creating || (mode === "topic" && selected.size === 0)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:bg-white/5 disabled:text-zinc-600 text-black font-semibold text-[14px] transition-all"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                {creating ? "Searching..." : mode === "channel" ? "Search Channel" : mode === "account" ? "Track Account" : "Search Trends"}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
