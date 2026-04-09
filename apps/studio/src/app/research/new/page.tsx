"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function NewResearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/research/${data.sessionId}`);
      }
    } catch {} finally { setCreating(false); }
  };

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Research Hub</h1>
              <p className="text-[13px] text-zinc-500">Enter any topic, question, or URL to research</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="bg-white/2 border border-white/5 rounded-2xl p-1.5">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSearch(); } }}
                  placeholder="e.g., 'AI tools market in 2026', 'doxaxprience.com competitors', 'how to get leads for SaaS'"
                  rows={3}
                  className="w-full px-4 py-3.5 rounded-xl bg-transparent text-[14px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none"
                />
                <div className="flex items-center justify-end px-3 pb-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSearch}
                    disabled={!query.trim() || creating}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-zinc-600 text-black font-semibold text-[13px] transition-all"
                  >
                    {creating ? <Loader2 size={15} className="animate-spin" /> : <Search size={14} />}
                    {creating ? "Starting..." : "Research"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
