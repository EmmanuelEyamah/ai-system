"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderPlus, Check, Plus, Loader2, X } from "lucide-react";
import { cn } from "@ai-system/shared-ui";

interface FolderOption {
  id: string;
  name: string;
  color: string;
  items: { itemId: string }[];
}

const COLORS = [
  { id: "violet", label: "Violet", cls: "bg-violet-500" },
  { id: "emerald", label: "Green", cls: "bg-emerald-500" },
  { id: "cyan", label: "Cyan", cls: "bg-cyan-500" },
  { id: "orange", label: "Orange", cls: "bg-orange-500" },
  { id: "pink", label: "Pink", cls: "bg-pink-500" },
  { id: "amber", label: "Amber", cls: "bg-amber-500" },
];

export function SaveToFolder({
  itemType,
  itemId,
  itemTitle,
}: {
  itemType: string;
  itemId: string;
  itemTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [folders, setFolders] = useState<FolderOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("violet");
  const [saving, setSaving] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setCreating(false); }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await fetch("/api/folders");
      if (res.ok) setFolders(await res.json());
    } catch {}
  };

  const handleOpen = () => {
    if (open) { setOpen(false); setCreating(false); return; }
    setOpen(true);
    fetchFolders();
  };

  const handleSave = async (folderId: string) => {
    setSaving(folderId);
    try {
      await fetch(`/api/folders/${folderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, itemTitle }),
      });
      await fetchFolders();
    } catch {} finally { setSaving(null); }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (res.ok) {
        const folder = await res.json();
        await handleSave(folder.id);
        setNewName("");
        setCreating(false);
      }
    } catch {}
  };

  const isInFolder = (folder: FolderOption) => folder.items.some((i) => i.itemId === itemId);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium transition-smooth",
          open ? "bg-violet-500/10 text-violet-400" : "text-zinc-600 hover:text-zinc-400 hover:bg-white/5"
        )}
        title="Save to folder"
      >
        <FolderPlus size={13} />
        <span className="hidden sm:inline">Save</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-2 w-64 bg-[#0c0c14] border border-white/8 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/4">
              <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Save to folder</span>
              <button onClick={() => { setOpen(false); setCreating(false); }} className="p-0.5 rounded hover:bg-white/5 text-zinc-600">
                <X size={12} />
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto">
              {folders.length === 0 && !creating && (
                <p className="text-[12px] text-zinc-600 text-center py-4">No folders yet</p>
              )}
              {folders.map((folder) => {
                const inFolder = isInFolder(folder);
                const colorCls = COLORS.find((c) => c.id === folder.color)?.cls || "bg-violet-500";
                return (
                  <button
                    key={folder.id}
                    onClick={() => !inFolder && handleSave(folder.id)}
                    disabled={inFolder || saving === folder.id}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-white/3 transition-smooth disabled:opacity-60"
                  >
                    <div className={`w-2.5 h-2.5 rounded-sm ${colorCls} shrink-0`} />
                    <span className="text-[12px] text-zinc-300 flex-1 truncate">{folder.name}</span>
                    {saving === folder.id ? (
                      <Loader2 size={12} className="text-zinc-500 animate-spin shrink-0" />
                    ) : inFolder ? (
                      <Check size={12} className="text-emerald-400 shrink-0" />
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Create new folder */}
            {creating ? (
              <div className="border-t border-white/4 p-3 space-y-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Folder name..."
                  autoFocus
                  className="w-full px-2.5 py-1.5 rounded-md bg-white/3 border border-white/6 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/30"
                />
                <div className="flex gap-1">
                  {COLORS.map((c) => (
                    <button key={c.id} onClick={() => setNewColor(c.id)}
                      className={cn("w-5 h-5 rounded-full", c.cls, newColor === c.id ? "ring-2 ring-white/30" : "opacity-50 hover:opacity-80")}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreate} disabled={!newName.trim()}
                    className="flex-1 text-[11px] py-1.5 rounded-md bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 disabled:opacity-40 transition-smooth">
                    Create & Save
                  </button>
                  <button onClick={() => setCreating(false)}
                    className="text-[11px] py-1.5 px-2 rounded-md text-zinc-600 hover:text-zinc-400 transition-smooth">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 border-t border-white/4 text-[12px] text-violet-400 hover:bg-white/3 transition-smooth"
              >
                <Plus size={12} />
                New folder
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
