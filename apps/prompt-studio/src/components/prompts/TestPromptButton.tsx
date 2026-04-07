"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, X, Loader2 } from "lucide-react";

interface TestPromptButtonProps {
  prompt: string;
  model: "openai" | "claude";
}

export function TestPromptButton({ prompt, model }: TestPromptButtonProps) {
  const [open, setOpen] = useState(false);
  const [output, setOutput] = useState("");
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setOpen(true);
    setTesting(true);
    setOutput("");

    try {
      const res = await fetch("/api/prompts/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });

      if (!res.ok || !res.body) {
        setOutput("Error: Failed to test prompt");
        setTesting(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let result = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const text = JSON.parse(line.slice(2));
              result += text;
              setOutput(result);
            } catch {
              // skip
            }
          }
        }
      }
    } catch {
      setOutput("Error: Failed to connect");
    } finally {
      setTesting(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleTest}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium bg-emerald-500/8 hover:bg-emerald-500/15 border border-emerald-500/15 text-emerald-400 transition-smooth"
      >
        <Play size={11} />
        Test
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl mx-4 bg-[#0c0c12] border border-white/6 rounded-2xl overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/4">
                <div className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                  <span className="text-[13px] font-medium text-zinc-300">
                    {model === "openai" ? "GPT-4o" : "Claude"} Output
                  </span>
                  {testing && (
                    <Loader2 size={13} className="animate-spin text-zinc-500" />
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-md hover:bg-white/5 text-zinc-600 hover:text-zinc-300 transition-smooth"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Output */}
              <div className="p-5 max-h-100 overflow-y-auto">
                {output ? (
                  <pre className="text-[13px] text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
                    {output}
                  </pre>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-[13px]">Generating response...</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
