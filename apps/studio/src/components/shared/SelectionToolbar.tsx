"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Copy, Check } from "lucide-react";

export function SelectionToolbar() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState("");
  const [copied, setCopied] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || "";

      if (text.length < 10) {
        setVisible(false);
        return;
      }

      const range = selection?.getRangeAt(0);
      if (!range) return;

      const rect = range.getBoundingClientRect();
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
      setSelectedText(text);
      setVisible(true);
      setCopied(false);
    }, 10);
  }, []);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (toolbarRef.current?.contains(e.target as Node)) return;
    setVisible(false);
  }, []);

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [handleMouseUp, handleMouseDown]);

  const handleResearch = async () => {
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: selectedText }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/research/${data.sessionId}`);
      }
    } catch {
      // silent
    }
    setVisible(false);
  };

  const handlePrompt = async () => {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/chat/${data.chatId}?context=${encodeURIComponent(selectedText)}`);
      }
    } catch {
      // silent
    }
    setVisible(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setVisible(false), 800);
  };

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={toolbarRef}
          initial={{ opacity: 0, y: 4, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            position: "fixed",
            left: position.x,
            top: position.y,
            transform: "translate(-50%, -100%)",
            zIndex: 9999,
          }}
          className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-[#0c0c14] border border-white/10 shadow-2xl shadow-black/50"
        >
          <button
            onClick={handleResearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-cyan-400 hover:bg-cyan-500/10 transition-smooth"
          >
            <Search size={12} />
            Research
          </button>
          <div className="w-px h-4 bg-white/6" />
          <button
            onClick={handlePrompt}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-smooth"
          >
            <Sparkles size={12} />
            Prompt
          </button>
          <div className="w-px h-4 bg-white/6" />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-zinc-400 hover:bg-white/5 transition-smooth"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
