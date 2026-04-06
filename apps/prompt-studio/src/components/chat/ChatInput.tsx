"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, RotateCcw, Paperclip, X, FileText, Image as ImageIcon, File } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PendingFile {
  file: File;
  preview?: string;
  type: "image" | "pdf" | "document" | "other";
}

interface ChatInputProps {
  onSend: (message: string, files?: PendingFile[]) => void;
  onRetry?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showRetry?: boolean;
}

function getFileType(mimeType: string): PendingFile["type"] {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.startsWith("text/")) return "document";
  return "other";
}

function FilePreview({ file, onRemove }: { file: PendingFile; onRemove: () => void }) {
  const Icon = file.type === "image" ? ImageIcon : file.type === "pdf" ? FileText : File;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative group"
    >
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/8">
        {file.type === "image" && file.preview ? (
          <img src={file.preview} alt="" className="w-8 h-8 rounded object-cover" />
        ) : (
          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
            <Icon size={14} className="text-zinc-500" />
          </div>
        )}
        <div className="min-w-0 max-w-32">
          <p className="text-[11px] text-zinc-300 truncate">{file.file.name}</p>
          <p className="text-[10px] text-zinc-600">{(file.file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button
          onClick={onRemove}
          className="p-0.5 rounded hover:bg-white/10 text-zinc-600 hover:text-zinc-300 transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    </motion.div>
  );
}

export function ChatInput({ onSend, onRetry, disabled, placeholder, showRetry }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
    }
  }, [input]);

  const addFiles = (newFiles: FileList | File[]) => {
    const allowed = Array.from(newFiles).filter((f) => {
      const valid = f.size <= 10 * 1024 * 1024;
      return valid;
    });

    const pending: PendingFile[] = allowed.map((f) => {
      const type = getFileType(f.type);
      const preview = type === "image" ? URL.createObjectURL(f) : undefined;
      return { file: f, preview, type };
    });

    setFiles((prev) => [...prev, ...pending]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const file = prev[index];
      if (file.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = () => {
    const trimmed = input.trim();
    if ((!trimmed && files.length === 0) || disabled) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setInput("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      className="px-4 sm:px-6 pb-5 pt-2"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-3xl mx-auto">
        {/* Retry button */}
        {showRetry && onRetry && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-3"
          >
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 text-[12px] font-medium hover:bg-red-500/15 transition-smooth"
            >
              <RotateCcw size={13} />
              Retry last message
            </button>
          </motion.div>
        )}

        {/* File previews */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-2"
            >
              {files.map((f, i) => (
                <FilePreview key={i} file={f} onRemove={() => removeFile(i)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div
          className={cn(
            "relative flex items-end gap-2 rounded-xl border transition-all duration-200",
            dragging
              ? "bg-emerald-500/5 border-emerald-500/30 ring-2 ring-emerald-500/20"
              : "bg-white/3 border-white/6 focus-within:border-emerald-500/30 focus-within:bg-white/4"
          )}
        >
          {/* Attach button */}
          <div className="pl-2 pb-2.5">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/5 disabled:opacity-40 transition-smooth"
            >
              <Paperclip size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dragging ? "Drop files here..." : placeholder || "Describe your idea..."}
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none bg-transparent pr-2 py-3.5 text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed leading-relaxed"
          />

          <div className="pr-2 pb-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={disabled || (!input.trim() && files.length === 0)}
              className="p-2 rounded-lg bg-emerald-500 disabled:bg-white/5 disabled:text-zinc-700 text-black transition-all duration-200"
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-2">
          Enter to send &middot; Shift+Enter for new line &middot; Drag & drop or click <Paperclip size={10} className="inline" /> to attach files
        </p>
      </div>
    </div>
  );
}
