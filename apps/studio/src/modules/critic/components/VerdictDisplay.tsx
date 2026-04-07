"use client";

import { motion } from "framer-motion";
import { TrendingUp, AlertTriangle, Zap, ExternalLink, CheckCircle2, Map, Calendar } from "lucide-react";
import { MarkdownRenderer } from "@ai-system/shared-ui";

interface Verdict {
  viabilityScore?: number;
  viabilityLabel?: string;
  realityCheck?: {
    title: string;
    strengths: string[];
    weaknesses: string[];
    competitors: { name: string; what_they_do: string; their_weakness: string }[];
    marketData: string;
  };
  upgradedVersion?: {
    title: string;
    originalIdea: string;
    improvedIdea: string;
    positioning: string;
    targetAudience: string;
    keyDifferentiator: string;
  };
  actionPlan?: {
    title: string;
    steps: { timeframe: string; action: string; why: string }[];
    resources: string[];
    socialCopy?: string;
  };
  roadmap?: {
    title: string;
    phases: { name: string; goals: string[]; tasks: string[]; milestone: string }[];
    contentCalendar?: { day: string; platform: string; contentType: string; topic: string }[];
  };
}

function getScoreColor(score: number) {
  if (score >= 8) return { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", ring: "ring-emerald-500/30" };
  if (score >= 5) return { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-400", ring: "ring-amber-500/30" };
  return { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", ring: "ring-red-500/30" };
}

export function VerdictDisplay({ verdict }: { verdict: Verdict }) {
  const score = verdict.viabilityScore || 0;
  const colors = getScoreColor(score);

  return (
    <div className="space-y-4">
      {/* Score header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${colors.bg} border ${colors.border} rounded-xl p-5 text-center`}
      >
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${colors.bg} ring-2 ${colors.ring} mb-3`}>
          <span className={`text-2xl font-bold ${colors.text}`}>{score}</span>
          <span className="text-[10px] text-zinc-500 ml-0.5">/10</span>
        </div>
        <p className={`text-[14px] font-semibold ${colors.text}`}>{verdict.viabilityLabel || "Assessment"}</p>
      </motion.div>

      {/* Reality Check */}
      {verdict.realityCheck && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/2 border border-white/4 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-amber-400" />
            <h3 className="text-[14px] font-semibold text-zinc-200">{verdict.realityCheck.title}</h3>
          </div>

          {verdict.realityCheck.strengths?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-semibold mb-2">What's Strong</p>
              <div className="space-y-1.5">
                {verdict.realityCheck.strengths.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-zinc-400">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verdict.realityCheck.weaknesses?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-red-400/70 font-semibold mb-2">What You're Missing</p>
              <div className="space-y-1.5">
                {verdict.realityCheck.weaknesses.map((w, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-[13px] text-zinc-400">{w}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verdict.realityCheck.competitors?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">Competitors</p>
              <div className="space-y-2">
                {verdict.realityCheck.competitors.map((c, i) => (
                  <div key={i} className="bg-white/2 rounded-lg p-3">
                    <p className="text-[13px] font-medium text-zinc-300">{c.name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{c.what_they_do}</p>
                    <p className="text-[11px] text-amber-400/70 mt-0.5">Gap: {c.their_weakness}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verdict.realityCheck.marketData && (
            <div className="bg-white/2 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">Market Data</p>
              <MarkdownRenderer content={verdict.realityCheck.marketData} />
            </div>
          )}
        </motion.div>
      )}

      {/* Upgraded Version */}
      {verdict.upgradedVersion && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white/2 border border-white/4 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-violet-400" />
            <h3 className="text-[14px] font-semibold text-zinc-200">{verdict.upgradedVersion.title}</h3>
          </div>

          <div className="space-y-3">
            <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest text-red-400/60 font-semibold mb-1">Your Original</p>
              <p className="text-[13px] text-zinc-400">{verdict.upgradedVersion.originalIdea}</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest text-emerald-400/60 font-semibold mb-1">Upgraded Version</p>
              <p className="text-[13px] text-zinc-300">{verdict.upgradedVersion.improvedIdea}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-white/2 rounded-lg p-3">
                <p className="text-[10px] text-zinc-600 font-semibold mb-1">Positioning</p>
                <p className="text-[12px] text-zinc-400">{verdict.upgradedVersion.positioning}</p>
              </div>
              <div className="bg-white/2 rounded-lg p-3">
                <p className="text-[10px] text-zinc-600 font-semibold mb-1">Target</p>
                <p className="text-[12px] text-zinc-400">{verdict.upgradedVersion.targetAudience}</p>
              </div>
              <div className="bg-white/2 rounded-lg p-3">
                <p className="text-[10px] text-zinc-600 font-semibold mb-1">Differentiator</p>
                <p className="text-[12px] text-zinc-400">{verdict.upgradedVersion.keyDifferentiator}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Plan */}
      {verdict.actionPlan && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white/2 border border-white/4 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={15} className="text-cyan-400" />
            <h3 className="text-[14px] font-semibold text-zinc-200">{verdict.actionPlan.title}</h3>
          </div>

          {verdict.actionPlan.steps?.length > 0 && (
            <div className="space-y-2 mb-4">
              {verdict.actionPlan.steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-white/2 rounded-lg p-3">
                  <div className="shrink-0 w-16">
                    <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">{step.timeframe}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-zinc-300">{step.action}</p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">{step.why}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {verdict.actionPlan.resources?.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">Resources</p>
              <div className="space-y-1">
                {verdict.actionPlan.resources.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ExternalLink size={10} className="text-violet-400 shrink-0" />
                    <p className="text-[12px] text-zinc-400">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {verdict.actionPlan.socialCopy && (
            <div className="bg-violet-500/5 border border-violet-500/10 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-widest text-violet-400/60 font-semibold mb-1">Ready-to-Post Copy</p>
              <p className="text-[13px] text-zinc-300 whitespace-pre-wrap">{verdict.actionPlan.socialCopy}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Roadmap */}
      {verdict.roadmap && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white/2 border border-white/4 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Map size={15} className="text-emerald-400" />
            <h3 className="text-[14px] font-semibold text-zinc-200">{verdict.roadmap.title}</h3>
          </div>

          {/* Phases */}
          {verdict.roadmap.phases?.length > 0 && (
            <div className="space-y-3 mb-4">
              {verdict.roadmap.phases.map((phase, i) => (
                <div key={i} className="bg-white/2 border border-white/3 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-emerald-400">{i + 1}</span>
                    </div>
                    <h4 className="text-[13px] font-semibold text-zinc-200">{phase.name}</h4>
                  </div>

                  {phase.goals?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">Goals</p>
                      <div className="space-y-1">
                        {phase.goals.map((g, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <CheckCircle2 size={11} className="text-emerald-400/60 mt-0.5 shrink-0" />
                            <p className="text-[12px] text-zinc-400">{g}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {phase.tasks?.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-1">Tasks</p>
                      <div className="space-y-1">
                        {phase.tasks.map((t, j) => (
                          <p key={j} className="text-[12px] text-zinc-500 pl-3 border-l border-white/6">
                            {t}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-emerald-500/5 border border-emerald-500/8 rounded-md px-3 py-1.5 mt-2">
                    <p className="text-[10px] text-emerald-400/70 font-semibold">Milestone: <span className="text-zinc-400 font-normal">{phase.milestone}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content Calendar */}
          {verdict.roadmap.contentCalendar && verdict.roadmap.contentCalendar.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={13} className="text-violet-400" />
                <p className="text-[11px] uppercase tracking-widest text-zinc-600 font-semibold">Weekly Content Calendar</p>
              </div>
              <div className="space-y-1.5">
                {verdict.roadmap.contentCalendar.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-white/2 rounded-lg px-3 py-2">
                    <span className="text-[11px] font-semibold text-violet-400 w-20 shrink-0">{item.day}</span>
                    <span className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded shrink-0">{item.platform}</span>
                    <span className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded shrink-0">{item.contentType}</span>
                    <span className="text-[12px] text-zinc-400 truncate min-w-0">{item.topic}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
