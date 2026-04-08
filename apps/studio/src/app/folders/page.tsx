"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, Plus, Trash2, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useFolders } from "@/hooks/useFolders";
import { cn } from "@ai-system/shared-ui";

const COLORS = [
  { id: "violet", cls: "bg-violet-500", border: "border-violet-500/30" },
  { id: "emerald", cls: "bg-emerald-500", border: "border-emerald-500/30" },
  { id: "cyan", cls: "bg-cyan-500", border: "border-cyan-500/30" },
  { id: "orange", cls: "bg-orange-500", border: "border-orange-500/30" },
  { id: "pink", cls: "bg-pink-500", border: "border-pink-500/30" },
  { id: "amber", cls: "bg-amber-500", border: "border-amber-500/30" },
];

export default function FoldersPage() {
  const router = useRouter();
  const { folders, loading, createFolder, deleteFolder } = useFolders();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("violet");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const id = await createFolder(newName.trim(), newDesc.trim() || undefined, newColor);
    if (id) { setNewName(""); setNewDesc(""); setCreating(false); }
  };

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/4 pl-14 pr-4 md:px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder size={14} className="text-violet-400" />
              <span className="text-[14px] font-semibold text-zinc-200">Folders</span>
              <span className="text-[12px] text-zinc-600">({folders.length})</span>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setCreating(!creating)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/15 text-violet-400 text-[12px] font-medium hover:bg-violet-500/20 transition-smooth">
              <Plus size={13} /> New Folder
            </motion.button>
          </div>
        </motion.header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              className="relative bg-linear-to-br from-violet-500/5 via-transparent to-cyan-500/5 border border-white/4 rounded-2xl p-6 sm:p-8 mb-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                    <Folder size={18} className="text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-zinc-200">Your Folders</h2>
                    <p className="text-[12px] text-zinc-500">{folders.length} folder{folders.length !== 1 ? "s" : ""} &middot; Organize your work into collections</p>
                  </div>
                </div>
                <p className="text-[13px] text-zinc-500 leading-relaxed max-w-lg">
                  Group related prompts, research, ideas, and trends into folders. Reference an entire folder to give any module rich context from all your past work.
                </p>
              </div>
            </motion.div>

            {/* Create form */}
            <AnimatePresence>
              {creating && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  className="bg-white/2 border border-white/5 rounded-xl p-4 mb-6 overflow-hidden">
                  <div className="space-y-3">
                    <input value={newName} onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                      placeholder="Folder name (e.g., DOXA Brand)"
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/3 border border-white/6 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/30 transition-all" />
                    <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Description (optional)"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-white/3 border border-white/6 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/30 transition-all" />
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        {COLORS.map((c) => (
                          <button key={c.id} onClick={() => setNewColor(c.id)}
                            className={cn("w-6 h-6 rounded-full transition-all", c.cls, newColor === c.id ? "ring-2 ring-white/40 scale-110" : "opacity-40 hover:opacity-70")} />
                        ))}
                      </div>
                      <div className="flex gap-2 ml-auto">
                        <button onClick={() => setCreating(false)} className="px-3 py-1.5 text-[12px] text-zinc-600 hover:text-zinc-400 transition-smooth">Cancel</button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={handleCreate} disabled={!newName.trim()}
                          className="px-4 py-1.5 rounded-lg bg-violet-500 text-white text-[12px] font-medium disabled:opacity-40 transition-all">
                          Create
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="text-violet-400 animate-spin" />
              </div>
            )}

            {/* Empty */}
            {!loading && folders.length === 0 && !creating && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mx-auto mb-4">
                  <Folder size={24} className="text-violet-400" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-200 mb-2">No folders yet</h2>
                <p className="text-[13px] text-zinc-500">Create a folder to organize your prompts, research, ideas, and trends</p>
              </div>
            )}

            {/* Folder grid */}
            {!loading && folders.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence>
                  {folders.map((folder, i) => {
                    const colorConfig = COLORS.find((c) => c.id === folder.color) || COLORS[0];
                    return (
                      <motion.div
                        key={folder.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ y: -2 }}
                        className="group relative"
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(`/folders/${folder.id}`)}
                          onKeyDown={(e) => e.key === "Enter" && router.push(`/folders/${folder.id}`)}
                          className={`p-4 rounded-xl bg-white/2 border ${colorConfig.border} hover:bg-white/3 cursor-pointer transition-smooth`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-md ${colorConfig.cls} shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <h3 className="text-[14px] font-semibold text-zinc-200 truncate">{folder.name}</h3>
                              {folder.description && (
                                <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{folder.description}</p>
                              )}
                              <p className="text-[11px] text-zinc-700 mt-1">{folder.items.length} item{folder.items.length !== 1 ? "s" : ""}</p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 text-zinc-700 hover:text-red-400 transition-all"
                            >
                              <Trash2 size={12} />
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
