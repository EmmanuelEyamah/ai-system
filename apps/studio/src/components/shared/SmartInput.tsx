"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Paperclip, Link2, X, FileText, Image as ImageIcon, Loader2, Globe } from "lucide-react";
import { ReferenceButton } from "./ReferenceButton";
import { cn } from "@ai-system/shared-ui";

interface PendingFile {
  file: File;
  preview?: string;
  type: "image" | "pdf" | "document";
}

interface SmartInputProps {
  onSend: (message: string, files?: PendingFile[], urls?: string[]) => void;
  disabled?: boolean;
  sending?: boolean;
  placeholder?: string;
  accentColor?: string;
  showReference?: boolean;
}

function detectUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  return text.match(urlRegex) || [];
}

function getFileType(mimeType: string): "image" | "pdf" | "document" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "document";
}

export function SmartInput({
  onSend,
  disabled = false,
  sending = false,
  placeholder = "Type a message...",
  accentColor = "bg-violet-500 hover:bg-violet-400",
  showReference = true,
}: SmartInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [references, setReferences] = useState<{ title: string; context: string }[]>([]);
  const [detectedUrls, setDetectedUrls] = useState<string[]>([]);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px";
    }
  }, [input]);

  // Detect URLs as user types
  useEffect(() => {
    const urls = detectUrls(input);
    setDetectedUrls(urls);
  }, [input]);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || [])
      .filter((f) => f.size <= 10 * 1024 * 1024)
      .map((f) => ({
        file: f,
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
        type: getFileType(f.type),
      }));
    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      if (prev[index].preview) URL.revokeObjectURL(prev[index].preview!);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addReference = (context: string, title: string) => {
    setReferences((prev) => [...prev, { title, context }]);
  };

  const removeReference = (index: number) => {
    setReferences((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if ((!trimmed && files.length === 0) || disabled || sending) return;

    // Build message with references prepended
    const refContext = references.map((r) => r.context).join("\n\n---\n\n");
    const msg = refContext ? `${refContext}\n\n${trimmed}` : trimmed;

    onSend(msg, files.length > 0 ? files : undefined, detectedUrls.length > 0 ? detectedUrls : undefined);

    setInput("");
    setFiles([]);
    setReferences([]);
    setDetectedUrls([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle drag and drop
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files)
      .filter((f) => f.size <= 10 * 1024 * 1024)
      .map((f) => ({
        file: f,
        preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
        type: getFileType(f.type),
      }));
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "bg-white/2 border rounded-xl p-1.5 transition-smooth",
        dragging ? "border-violet-500/30 bg-violet-500/5" : "border-white/5"
      )}
    >
      {/* Reference cards */}
      {references.length > 0 && (
        <div className="px-3 pt-2 pb-1 space-y-1.5">
          {references.map((ref, i) => (
            <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-violet-500/5 border border-violet-500/10">
              <Link2 size={12} className="text-violet-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-violet-300 font-medium truncate">{ref.title}</p>
                <p className="text-[10px] text-zinc-600 truncate mt-0.5">{ref.context.slice(0, 120)}...</p>
              </div>
              <button onClick={() => removeReference(i)} className="text-zinc-600 hover:text-red-400 transition-smooth shrink-0 p-0.5">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* URL detection badge */}
      {detectedUrls.length > 0 && (
        <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/15 text-[10px] text-cyan-400">
            <Globe size={9} />
            {detectedUrls.length} URL{detectedUrls.length > 1 ? "s" : ""} detected — will be scraped for context
          </div>
        </div>
      )}

      {/* File previews */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-3 pt-2 pb-1">
            <div className="flex gap-2 overflow-x-auto">
              {files.map((f, i) => (
                <div key={i} className="relative shrink-0 group">
                  {f.type === "image" && f.preview ? (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/6">
                      <img src={f.preview} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/3 border border-white/6 flex flex-col items-center justify-center">
                      {f.type === "pdf" ? <FileText size={16} className="text-red-400" /> : <FileText size={16} className="text-zinc-500" />}
                      <span className="text-[8px] text-zinc-600 mt-1 truncate max-w-14">{f.file.name}</span>
                    </div>
                  )}
                  <button onClick={() => removeFile(i)}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-black/80 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={8} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-end gap-1.5">
        <div className="flex items-center gap-0.5 pl-1.5 pb-2">
          {showReference && (
            <ReferenceButton onReference={(context, title) => addReference(context, title)} />
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-white/5 disabled:opacity-40 transition-smooth"
            title="Attach files or images"
          >
            <Paperclip size={14} />
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv" className="hidden" onChange={handleFilesSelected} />
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled || sending}
          className="flex-1 px-2 py-2.5 bg-transparent text-[13px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none disabled:opacity-50"
        />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={(!input.trim() && files.length === 0) || disabled || sending}
          className={cn("p-2.5 rounded-lg text-white transition-all shrink-0 mb-0.5 disabled:bg-white/5 disabled:text-zinc-600", accentColor)}
        >
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </motion.button>
      </div>
    </div>
  );
}
