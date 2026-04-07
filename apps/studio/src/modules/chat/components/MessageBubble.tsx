"use client";

import { motion } from "framer-motion";
import { User, Bot, FileText, Image as ImageIcon, File } from "lucide-react";
import { MarkdownRenderer } from "@ai-system/shared-ui";
import { cn } from "@ai-system/shared-ui";

interface AttachmentData {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  url: string;
}

interface MessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
  index: number;
  attachments?: AttachmentData[];
}

export function MessageBubble({ role, content, index, attachments }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.4, 0.25, 1],
      }}
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-7 h-7 rounded-md flex items-center justify-center mt-0.5",
          isUser
            ? "bg-white/8 border border-white/10"
            : "bg-emerald-500/10 border border-emerald-500/15"
        )}
      >
        {isUser ? (
          <User size={13} className="text-zinc-400" />
        ) : (
          <Bot size={13} className="text-emerald-400" />
        )}
      </div>

      {/* Message */}
      <div className={cn("max-w-[75%] space-y-2")}>
        {/* Attachments */}
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((att) => (
              <AttachmentPreview key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Text content */}
        {content && (
          <div
            className={cn(
              "rounded-xl px-4 py-3",
              isUser
                ? "bg-white/5 border border-white/6"
                : "bg-transparent"
            )}
          >
            {isUser ? (
              <p className="text-[13px] text-zinc-300 whitespace-pre-wrap leading-relaxed">{content}</p>
            ) : (
              <MarkdownRenderer content={content} />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AttachmentPreview({ attachment }: { attachment: AttachmentData }) {
  if (attachment.fileType === "image") {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
        <div className="relative rounded-lg overflow-hidden border border-white/8 hover:border-white/15 transition-colors">
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="max-w-48 max-h-36 object-cover"
          />
          <div className="absolute bottom-0 inset-x-0 bg-linear-to-t from-black/60 to-transparent px-2 py-1">
            <p className="text-[10px] text-white/80 truncate">{attachment.fileName}</p>
          </div>
        </div>
      </a>
    );
  }

  const Icon = attachment.fileType === "pdf" ? FileText : File;

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/6 hover:bg-white/5 hover:border-white/10 transition-smooth"
    >
      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-zinc-500" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-zinc-300 truncate max-w-32">{attachment.fileName}</p>
        <p className="text-[10px] text-zinc-600">{attachment.fileType.toUpperCase()}</p>
      </div>
    </a>
  );
}
