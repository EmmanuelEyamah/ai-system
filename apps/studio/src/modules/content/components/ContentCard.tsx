"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Linkedin, Twitter, Instagram, Music2, Youtube, Facebook,
  Copy, Check, Clock, Target, BarChart3, RefreshCw,
  MessageSquare, ChevronDown, ChevronUp, Globe, Image as ImageIcon, Loader2,
} from "lucide-react";
import { MarkdownRenderer } from "@ai-system/shared-ui";
import { cn } from "@ai-system/shared-ui";

interface ScoreBreakdown {
  trendAlignment: number;
  hookStrength: number;
  platformFit: number;
  timing: number;
  brandFit: number;
}

interface VisualSlide {
  slideNumber: number;
  purpose: string;
  headline: string;
  subtext?: string;
  visualDirection: string;
  designTip: string;
}

interface VisualBrief {
  needed: boolean;
  type: string;
  slideCount?: number;
  slides?: VisualSlide[];
  overallStyle?: string;
  whyThisFormat?: string;
  colorSuggestion?: string;
  fontSuggestion?: string;
}

interface ContentPost {
  platform: string;
  formatType: string;
  formatReason: string;
  score: number;
  scoreBreakdown?: ScoreBreakdown;
  hook: string;
  content: string;
  cta: string;
  hashtags: string[];
  postingTime: string;
  postingReason: string;
  strategistNote: string;
  estimatedReach: string;
  repurposeAs: string;
  visualBrief?: VisualBrief;
}

const platformConfig: Record<string, { icon: typeof Linkedin; color: string; bg: string; border: string; label: string }> = {
  linkedin: { icon: Linkedin, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/15", label: "LinkedIn" },
  facebook: { icon: Facebook, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/15", label: "Facebook" },
  twitter: { icon: Twitter, color: "text-zinc-300", bg: "bg-zinc-500/10", border: "border-zinc-500/15", label: "Twitter/X" },
  instagram: { icon: Instagram, color: "text-pink-400", bg: "bg-pink-500/10", border: "border-pink-500/15", label: "Instagram" },
  tiktok: { icon: Music2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/15", label: "TikTok" },
  youtube: { icon: Youtube, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/15", label: "YouTube" },
};

function getScoreColor(score: number) {
  if (score >= 8) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/15";
  if (score >= 6) return "text-amber-400 bg-amber-500/10 border-amber-500/15";
  return "text-red-400 bg-red-500/10 border-red-500/15";
}

export function ContentCard({
  post,
  sessionId,
  onRepurpose,
  onFeedback,
}: {
  post: ContentPost;
  sessionId: string;
  onRepurpose?: (targetPlatform: string) => void;
  onFeedback?: (feedback: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [visualScores, setVisualScores] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [scoring, setScoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = platformConfig[post.platform] || { icon: Globe, color: "text-zinc-400", bg: "bg-white/5", border: "border-white/8", label: post.platform };
  const Icon = config.icon;

  const handleCopy = () => {
    const fullContent = `${post.content}${post.hashtags?.length ? `\n\n${post.hashtags.map((h) => `#${h}`).join(" ")}` : ""}`;
    navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPending = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleScoreAll = async () => {
    if (pendingFiles.length === 0) return;
    setScoring(true);
    setVisualScores([]);
    try {
      const results: string[] = [];
      for (const { file } of pendingFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("platform", post.platform);
        formData.append("context", post.hook || post.content?.slice(0, 200) || "");
        const res = await fetch(`/api/content/${sessionId}/score-visual`, { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          results.push(data.analysis);
        } else {
          results.push("Failed to score this image.");
        }
      }
      setVisualScores(results);
      // Clean up previews
      pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview));
      setPendingFiles([]);
    } catch {} finally { setScoring(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/2 border ${config.border} rounded-xl overflow-hidden`}
    >
      {/* Header */}
      <div
        role="button" tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => e.key === "Enter" && setExpanded(!expanded)}
        className="flex items-center justify-between px-4 py-3 hover:bg-white/2 transition-smooth cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center`}>
            <Icon size={15} className={config.color} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-semibold text-zinc-200">{config.label}</span>
              <span className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded">{post.formatType?.replace(/_/g, " ")}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock size={10} className="text-zinc-600" />
              <span className="text-[11px] text-zinc-500">{post.postingTime}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-md border text-[12px] font-bold ${getScoreColor(post.score)}`}>
            {post.score?.toFixed(1)}
          </div>
          {expanded ? <ChevronUp size={14} className="text-zinc-600" /> : <ChevronDown size={14} className="text-zinc-600" />}
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/3 pt-3">
          {/* Strategist note */}
          <div className="bg-violet-500/5 border border-violet-500/10 rounded-lg px-3 py-2 mb-3">
            <p className="text-[10px] uppercase tracking-widest text-violet-400/60 font-semibold mb-1">Strategist&apos;s Note</p>
            <p className="text-[12px] text-zinc-400 leading-relaxed">{post.strategistNote}</p>
          </div>

          {/* Format reason */}
          <p className="text-[11px] text-zinc-600 mb-3 italic">{post.formatReason}</p>

          {/* Content */}
          <div className="bg-black/20 border border-white/4 rounded-lg p-3 mb-3">
            <MarkdownRenderer content={post.content} />
          </div>

          {/* Hashtags */}
          {post.hashtags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {post.hashtags.map((h, i) => (
                <span key={i} className="text-[10px] text-cyan-400/60 bg-cyan-500/5 px-1.5 py-0.5 rounded">#{h}</span>
              ))}
            </div>
          )}

          {/* Score breakdown */}
          {post.scoreBreakdown && (
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {Object.entries(post.scoreBreakdown).map(([key, val]) => (
                <div key={key} className="text-center bg-white/2 rounded-md py-1.5">
                  <p className={cn("text-[13px] font-bold", val >= 8 ? "text-emerald-400" : val >= 6 ? "text-amber-400" : "text-red-400")}>{val}</p>
                  <p className="text-[8px] text-zinc-600 uppercase">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                </div>
              ))}
            </div>
          )}

          {/* Visual Brief */}
          {post.visualBrief?.needed && (
            <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-rose-400/60 font-semibold">Visual Creative Brief</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const vb = post.visualBrief!;
                    const slides = (vb.slides || []).map((s) =>
                      `Slide ${s.slideNumber} — ${s.purpose}\nHeadline: ${s.headline}${s.subtext ? `\nSubtext: ${s.subtext}` : ""}\nVisual: ${s.visualDirection}\nTip: ${s.designTip}`
                    ).join("\n\n");
                    const brief = [
                      `VISUAL CREATIVE BRIEF`,
                      `Format: ${vb.type}${vb.slideCount ? ` (${vb.slideCount} slides)` : ""}`,
                      vb.whyThisFormat ? `Why: ${vb.whyThisFormat}` : "",
                      "",
                      slides,
                      "",
                      vb.overallStyle ? `Style: ${vb.overallStyle}` : "",
                      vb.colorSuggestion ? `Colors: ${vb.colorSuggestion}` : "",
                      vb.fontSuggestion ? `Fonts: ${vb.fontSuggestion}` : "",
                    ].filter(Boolean).join("\n");
                    navigator.clipboard.writeText(brief);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 border border-white/8 text-[10px] text-zinc-400 hover:text-zinc-200 hover:bg-white/8 transition-smooth"
                >
                  {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  {copied ? "Copied" : "Copy Brief"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-2 text-[11px]">
                <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">{post.visualBrief.type}</span>
                {post.visualBrief.slideCount && <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">{post.visualBrief.slideCount} slides</span>}
              </div>

              {post.visualBrief.whyThisFormat && (
                <p className="text-[11px] text-zinc-500 mb-2 italic">{post.visualBrief.whyThisFormat}</p>
              )}

              {/* Slides */}
              {post.visualBrief.slides && post.visualBrief.slides.length > 0 && (
                <div className="space-y-2 mb-2">
                  {post.visualBrief.slides.map((slide) => (
                    <div key={slide.slideNumber} className="bg-black/20 border border-white/4 rounded-md p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">{slide.slideNumber}</span>
                        <span className="text-[10px] text-zinc-600 uppercase">{slide.purpose}</span>
                      </div>
                      <p className="text-[12px] text-zinc-200 font-medium">{slide.headline}</p>
                      {slide.subtext && <p className="text-[11px] text-zinc-500 mt-0.5">{slide.subtext}</p>}
                      <p className="text-[10px] text-zinc-600 mt-1">{slide.visualDirection}</p>
                      <p className="text-[10px] text-rose-400/50 mt-0.5">{slide.designTip}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Style guide */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                {post.visualBrief.overallStyle && (
                  <div className="bg-white/2 rounded-md px-2 py-1.5">
                    <p className="text-[9px] text-zinc-600 uppercase">Style</p>
                    <p className="text-[10px] text-zinc-400">{post.visualBrief.overallStyle}</p>
                  </div>
                )}
                {post.visualBrief.colorSuggestion && (
                  <div className="bg-white/2 rounded-md px-2 py-1.5">
                    <p className="text-[9px] text-zinc-600 uppercase">Colors</p>
                    <p className="text-[10px] text-zinc-400">{post.visualBrief.colorSuggestion}</p>
                  </div>
                )}
                {post.visualBrief.fontSuggestion && (
                  <div className="bg-white/2 rounded-md px-2 py-1.5">
                    <p className="text-[9px] text-zinc-600 uppercase">Fonts</p>
                    <p className="text-[10px] text-zinc-400">{post.visualBrief.fontSuggestion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mb-3 text-[11px] text-zinc-600">
            <span className="flex items-center gap-1"><Target size={10} /> {post.estimatedReach}</span>
            {post.repurposeAs && <span className="flex items-center gap-1"><RefreshCw size={10} /> {post.repurposeAs}</span>}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-white/8 text-[11px] text-zinc-300 hover:bg-white/8 transition-smooth">
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied ? "Copied" : "Copy"}
            </motion.button>

            {onRepurpose && (
              <div className="flex gap-1">
                {Object.entries(platformConfig).filter(([k]) => k !== post.platform).map(([key, cfg]) => {
                  const PIcon = cfg.icon;
                  return (
                    <motion.button key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); onRepurpose(key); }}
                      className={`p-1.5 rounded-md ${cfg.bg} border ${cfg.border} transition-smooth`}
                      title={`Repurpose for ${cfg.label}`}>
                      <PIcon size={11} className={cfg.color} />
                    </motion.button>
                  );
                })}
              </div>
            )}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.stopPropagation(); setShowFeedback(!showFeedback); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-white/8 text-[11px] text-zinc-500 hover:text-zinc-300 transition-smooth">
              <MessageSquare size={11} /> Feedback
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              disabled={scoring}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-500/8 border border-rose-500/15 text-[11px] text-rose-400 hover:bg-rose-500/15 disabled:opacity-50 transition-smooth">
              <ImageIcon size={11} />
              Score Visual
            </motion.button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelected} />
          </div>

          {/* Pending files preview */}
          {pendingFiles.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">
                  {pendingFiles.length} image{pendingFiles.length !== 1 ? "s" : ""} selected
                </p>
                <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-smooth">
                    + Add more
                  </button>
                  <button onClick={() => { pendingFiles.forEach((f) => URL.revokeObjectURL(f.preview)); setPendingFiles([]); }}
                    className="text-[11px] text-zinc-600 hover:text-red-400 transition-smooth">
                    Clear all
                  </button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="relative shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-white/6 group">
                    <img src={f.preview} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                    <button onClick={() => removePendingFile(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px]">✕</span>
                    </button>
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">{i + 1}</span>
                  </div>
                ))}
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleScoreAll} disabled={scoring}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 mt-2 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:bg-white/5 disabled:text-zinc-600 text-white text-[12px] font-medium transition-all">
                {scoring ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                {scoring ? `Scoring ${pendingFiles.length} image${pendingFiles.length !== 1 ? "s" : ""}...` : `Analyze ${pendingFiles.length} Image${pendingFiles.length !== 1 ? "s" : ""}`}
              </motion.button>
            </div>
          )}

          {/* Visual Score Results */}
          {visualScores.length > 0 && (
            <div className="mt-3 space-y-3">
              {visualScores.map((score, i) => (
                <div key={i} className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-3">
                  <p className="text-[10px] uppercase tracking-widest text-rose-400/60 font-semibold mb-2">
                    {visualScores.length > 1 ? `Image ${i + 1} Score` : "Visual Score"}
                  </p>
                  <MarkdownRenderer content={score} />
                </div>
              ))}
            </div>
          )}

          {/* Feedback input */}
          {showFeedback && onFeedback && (
            <div className="mt-3 flex gap-2">
              <input value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && feedbackText.trim()) { onFeedback(feedbackText.trim()); setFeedbackText(""); setShowFeedback(false); } }}
                placeholder="e.g., 1,200 impressions, 3 comments, 45 likes"
                className="flex-1 px-3 py-1.5 rounded-md bg-white/3 border border-white/6 text-[12px] text-zinc-200 placeholder:text-zinc-600 focus:outline-none" />
              <button onClick={() => { if (feedbackText.trim()) { onFeedback(feedbackText.trim()); setFeedbackText(""); setShowFeedback(false); } }}
                className="px-3 py-1.5 rounded-md bg-violet-500/20 text-violet-400 text-[11px] font-medium hover:bg-violet-500/30 transition-smooth">
                Analyze
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
