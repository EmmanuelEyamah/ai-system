"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Star, AlertCircle, Search, RefreshCw } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AgentActivityFeed } from "@/components/research/AgentActivityFeed";
import { ReportRenderer } from "@/components/research/ReportRenderer";
import { FollowUpChat } from "@/components/research/FollowUpChat";
import { ExportModal } from "@/components/research/ExportModal";
import { useResearch } from "@/hooks/useResearch";
import { buildPromptStudioUrl } from "@/lib/handoff";

export default function ResearchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    events,
    report,
    status,
    query,
    title,
    starred,
    messages,
    loading,
    error,
    sending,
    fetchSession,
    startResearch,
    sendFollowUp,
  } = useResearch(id);

  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Auto-start research if session hasn't been researched yet
  useEffect(() => {
    if (loading) return;
    // Only start if pending or stuck in "researching" without a report (crashed previous run)
    if ((status === "pending" || (status === "researching" && !report)) && events.length === 0) {
      startResearch();
    }
  }, [status, loading, report, events.length, startResearch]);

  const handleGeneratePrompt = (context: string) => {
    const url = buildPromptStudioUrl({
      context,
      taskType: "image-generation",
      sourceSessionId: id,
    });
    window.open(url, "_blank");
  };

  const statusConfig = {
    pending: { label: "Pending", color: "text-zinc-500", dot: "bg-zinc-500" },
    researching: { label: "Researching...", color: "text-cyan-400", dot: "bg-cyan-400 animate-pulse-glow" },
    completed: { label: "Complete", color: "text-emerald-400", dot: "bg-emerald-400" },
    failed: { label: "Failed", color: "text-red-400", dot: "bg-red-400" },
  };

  const currentStatus = statusConfig[status] || statusConfig.pending;

  if (loading) {
    return (
      <div className="h-full flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-[#050507]">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between px-6 py-3.5 border-b border-white/4"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${currentStatus.dot}`} />
              <span className={`text-[12px] font-medium ${currentStatus.color}`}>
                {currentStatus.label}
              </span>
            </div>
            <span className="text-zinc-700">|</span>
            <h1 className="text-[14px] text-zinc-300 truncate font-medium">
              {title || query?.slice(0, 60)}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              className={`p-1.5 rounded-md hover:bg-white/5 transition-colors ${
                starred ? "text-amber-400" : "text-zinc-600 hover:text-amber-400"
              }`}
            >
              <Star size={15} fill={starred ? "currentColor" : "none"} />
            </button>
          </div>
        </motion.header>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {/* Query display */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Search size={14} className="text-cyan-400/60" />
                <span className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">
                  Research Query
                </span>
              </div>
              <p className="text-[15px] text-zinc-300 leading-relaxed">{query}</p>
            </div>

            {/* Error with retry */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/15 mb-6"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={15} className="text-red-400 shrink-0" />
                  <p className="text-[13px] text-red-400">{error}</p>
                </div>
                {(status === "failed" || !report) && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startResearch()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-500/10 border border-cyan-500/15 text-[12px] text-cyan-400 hover:bg-cyan-500/20 transition-smooth shrink-0 ml-3"
                  >
                    <RefreshCw size={12} />
                    Retry
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Activity feed */}
            {events.length > 0 && (
              <AgentActivityFeed
                events={events}
                isComplete={status === "completed" || status === "failed"}
              />
            )}

            {/* Researching state */}
            {status === "researching" && events.length === 0 && (
              <div className="flex items-center gap-3 py-8 justify-center">
                <Loader2 size={18} className="text-cyan-400 animate-spin" />
                <span className="text-[13px] text-zinc-500">Starting research agent...</span>
              </div>
            )}

            {/* Report */}
            {report && (
              <>
                <ReportRenderer
                  report={report}
                  onExport={() => setExportOpen(true)}
                  onGeneratePrompt={handleGeneratePrompt}
                />

                <FollowUpChat
                  messages={messages}
                  sending={sending}
                  onSendMessage={sendFollowUp}
                />

                <ExportModal
                  report={report}
                  sessionId={id}
                  isOpen={exportOpen}
                  onClose={() => setExportOpen(false)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
