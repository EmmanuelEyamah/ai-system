"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Globe, Youtube, FileText, Bot, CheckCircle2, XCircle,
  Loader2, Info, ChevronDown, ChevronUp
} from "lucide-react";
import { useState } from "react";
import type { ResearchSSEEvent, ResearchToolName } from "@ai-system/shared-types";

const toolIcons: Record<ResearchToolName, typeof Search> = {
  perplexity_search: Bot,
  serper_search: Globe,
  serpapi_search: Globe,
  youtube_search: Youtube,
  firecrawl_scrape: FileText,
  apify_actor_run: Search,
};

const toolLabels: Record<ResearchToolName, string> = {
  perplexity_search: "Perplexity AI",
  serper_search: "Serper (Google)",
  serpapi_search: "SerpAPI (Google)",
  youtube_search: "YouTube",
  firecrawl_scrape: "Firecrawl",
  apify_actor_run: "Apify",
};

export function AgentActivityFeed({
  events,
  isComplete,
}: {
  events: ResearchSSEEvent[];
  isComplete: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(isComplete);
  const prevComplete = useRef(isComplete);

  // Auto-collapse when research finishes
  useEffect(() => {
    if (isComplete && !prevComplete.current) {
      setCollapsed(true);
    }
    prevComplete.current = isComplete;
  }, [isComplete]);

  useEffect(() => {
    if (scrollRef.current && !collapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events, collapsed]);

  if (events.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-widest text-zinc-600 font-semibold hover:text-zinc-400 transition-colors"
      >
        {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
        Agent Activity ({events.length} events)
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              ref={scrollRef}
              className="max-h-80 overflow-y-auto bg-white/2 border border-white/4 rounded-xl p-3 space-y-1.5"
            >
              <AnimatePresence>
                {events.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2.5 px-2 py-1.5 rounded-lg"
                  >
                    {event.type === "tool_start" && (() => {
                      const Icon = toolIcons[event.payload.tool] || Search;
                      return (
                        <>
                          <Loader2 size={13} className="text-cyan-400 animate-spin mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Icon size={12} className="text-cyan-400/60" />
                              <span className="text-[12px] text-cyan-400 font-medium">
                                {toolLabels[event.payload.tool]}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                              {event.payload.query}
                            </p>
                          </div>
                        </>
                      );
                    })()}

                    {event.type === "tool_done" && (() => {
                      const Icon = toolIcons[event.payload.tool] || Search;
                      return (
                        <>
                          <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <Icon size={12} className="text-emerald-400/60" />
                              <span className="text-[12px] text-emerald-400 font-medium">
                                {toolLabels[event.payload.tool]}
                              </span>
                              {event.payload.durationMs > 0 && (
                                <span className="text-[10px] text-zinc-700">
                                  {(event.payload.durationMs / 1000).toFixed(1)}s
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                              {event.payload.resultPreview}
                            </p>
                          </div>
                        </>
                      );
                    })()}

                    {event.type === "tool_error" && (
                      <>
                        <XCircle size={13} className="text-red-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] text-red-400 font-medium">
                            {toolLabels[event.payload.tool]} failed
                          </span>
                          <p className="text-[11px] text-red-400/60 truncate mt-0.5">
                            {event.payload.error}
                          </p>
                        </div>
                      </>
                    )}

                    {event.type === "status" && (
                      <>
                        <Info size={13} className="text-zinc-500 mt-0.5 shrink-0" />
                        <span className="text-[12px] text-zinc-500">
                          {event.payload.message}
                        </span>
                      </>
                    )}

                    {event.type === "report_chunk" && (
                      <>
                        <FileText size={13} className="text-cyan-400 mt-0.5 shrink-0" />
                        <span className="text-[12px] text-cyan-400">
                          Writing: {event.payload.title}
                        </span>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {!isComplete && (
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <Loader2 size={12} className="text-cyan-400 animate-spin" />
                  <span className="text-[11px] text-zinc-600">Agent is working...</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
