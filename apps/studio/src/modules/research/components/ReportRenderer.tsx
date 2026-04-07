"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ExternalLink, Download, Sparkles } from "lucide-react";
import { MarkdownRenderer } from "@ai-system/shared-ui";
import type { ResearchReport } from "@ai-system/shared-types";

export function ReportRenderer({
  report,
  onExport,
  onGeneratePrompt,
}: {
  report: ResearchReport;
  onExport: () => void;
  onGeneratePrompt?: (context: string) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(report.sections.map((s) => s.id))
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Report header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-zinc-200">Research Report</h2>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onExport}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 text-[12px] text-zinc-400 hover:text-zinc-200 hover:bg-white/8 transition-smooth"
        >
          <Download size={13} />
          Export
        </motion.button>
      </div>

      {/* Executive summary */}
      {report.summary && (
        <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-xl p-5 mb-4">
          <h3 className="text-[11px] uppercase tracking-widest text-cyan-400/70 font-semibold mb-3">
            Executive Summary
          </h3>
          <MarkdownRenderer content={report.summary} />
        </div>
      )}

      {/* Sections */}
      {report.sections
        .sort((a, b) => a.order - b.order)
        .map((section) => {
          const isExpanded = expandedSections.has(section.id);

          return (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/2 border border-white/4 rounded-xl overflow-hidden"
            >
              {/* Section header — use div, not button, to avoid nesting issue */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => toggleSection(section.id)}
                onKeyDown={(e) => e.key === "Enter" && toggleSection(section.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/2 transition-smooth cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-zinc-500" />
                  ) : (
                    <ChevronRight size={14} className="text-zinc-500" />
                  )}
                  <h3 className="text-[14px] font-semibold text-zinc-200">
                    {section.title}
                  </h3>
                </div>
                {onGeneratePrompt && section.id !== "sources" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onGeneratePrompt(
                        `Based on this research section "${section.title}":\n\n${section.content.slice(0, 500)}`
                      );
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/8 border border-emerald-500/10 text-[11px] text-emerald-400 hover:bg-emerald-500/15 transition-smooth"
                  >
                    <Sparkles size={11} />
                    Prompt
                  </motion.button>
                )}
              </div>

              {/* Section content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-5 pb-5 border-t border-white/3 pt-4">
                      <MarkdownRenderer content={section.content} />

                      {/* Sources */}
                      {section.sources && section.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/4">
                          <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">
                            Sources
                          </p>
                          <div className="space-y-1">
                            {section.sources.map((source, i) => (
                              <a
                                key={i}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-[12px] text-cyan-400/70 hover:text-cyan-400 transition-colors"
                              >
                                <ExternalLink size={10} className="shrink-0" />
                                <span className="truncate">{source.title || source.url}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
    </div>
  );
}
