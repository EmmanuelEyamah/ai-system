"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Check, Loader2 } from "lucide-react";
import type { ResearchReport } from "@ai-system/shared-types";

export function ExportModal({
  report,
  sessionId,
  isOpen,
  onClose,
}: {
  report: ResearchReport;
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(report.sections.map((s) => s.id))
  );
  const [exporting, setExporting] = useState(false);

  const toggleSection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === report.sections.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(report.sections.map((s) => s.id)));
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/research/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          sectionIds: Array.from(selectedIds),
        }),
      });

      if (res.ok) {
        const html = await res.text();
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
        }
        onClose();
      }
    } catch {
      // silent fail
    } finally {
      setExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md mx-4 bg-[#0c0c12] border border-white/6 rounded-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/4">
              <h3 className="text-[14px] font-semibold text-zinc-200">Export Report</h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-smooth"
              >
                <X size={16} />
              </button>
            </div>

            {/* Section list */}
            <div className="px-5 py-4 max-h-80 overflow-y-auto">
              <button
                onClick={toggleAll}
                className="text-[12px] text-cyan-400 hover:text-cyan-300 mb-3 transition-colors"
              >
                {selectedIds.size === report.sections.length ? "Deselect All" : "Select All"}
              </button>

              <div className="space-y-1.5">
                {report.sections
                  .sort((a, b) => a.order - b.order)
                  .map((section) => {
                    const isSelected = selectedIds.has(section.id);
                    return (
                      <button
                        key={section.id}
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/3 transition-smooth text-left"
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? "bg-cyan-500 border-cyan-500"
                              : "border-white/10 bg-transparent"
                          }`}
                        >
                          {isSelected && <Check size={10} className="text-black" />}
                        </div>
                        <span className="text-[13px] text-zinc-300">{section.title}</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-white/4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleExport}
                disabled={selectedIds.size === 0 || exporting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 disabled:text-zinc-600 text-black font-semibold text-[13px] transition-all glow"
              >
                {exporting ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <>
                    <Download size={15} />
                    Export {selectedIds.size} Section{selectedIds.size !== 1 ? "s" : ""}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
