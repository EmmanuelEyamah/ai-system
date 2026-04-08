"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Loader2, TrendingUp, Youtube, MessageCircle, Globe, Linkedin,
  Twitter, Instagram, Music2, BarChart3, Sparkles, Calendar, ExternalLink,
  Lightbulb, Search, AlertCircle,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { SaveToFolder } from "@/components/shared/SaveToFolder";
import { useTrends } from "@/modules/trends/hooks/useTrends";

const platformConfig: Record<string, { icon: typeof Youtube; color: string; label: string }> = {
  youtube: { icon: Youtube, color: "text-red-400", label: "YouTube" },
  reddit: { icon: MessageCircle, color: "text-orange-400", label: "Reddit" },
  web: { icon: Globe, color: "text-blue-400", label: "Web" },
  linkedin: { icon: Linkedin, color: "text-sky-400", label: "LinkedIn" },
  twitter: { icon: Twitter, color: "text-zinc-300", label: "Twitter/X" },
  instagram: { icon: Instagram, color: "text-pink-400", label: "Instagram" },
  tiktok: { icon: Music2, color: "text-emerald-400", label: "TikTok" },
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function TrendsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const {
    results, analysis, ideas, calendar,
    sessionTitle, sessionQuery,
    searching, analyzing, generatingIdeas, generatingCalendar,
    loadingPlatforms, error,
    fetchSession, searchTrends, analyzeTrends, generateIdeas, generateCalendar,
  } = useTrends(id);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  // Auto-search on first load if no results
  useEffect(() => {
    if (results.length === 0 && !searching) {
      searchTrends();
    }
  }, [results.length, searching, searchTrends]);

  return (
    <AppShell>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <motion.header initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="border-b border-white/4 pl-14 pr-4 md:px-6 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <TrendingUp size={14} className="text-orange-400 shrink-0" />
              <span className="text-[12px] font-medium text-orange-400 shrink-0">Trends</span>
              <span className="text-zinc-700 shrink-0">|</span>
              <span className="text-[12px] text-zinc-300 truncate">{sessionTitle || sessionQuery || "Loading..."}</span>
              <span className="text-[11px] text-zinc-600 shrink-0">
                {searching ? "Searching..." : `${results.length} results`}
              </span>
            </div>
            <SaveToFolder itemType="trends" itemId={id} itemTitle={sessionTitle || sessionQuery || "Trend Search"} />
          </div>
        </motion.header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">

            {/* Loading platforms */}
            {loadingPlatforms.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Loader2 size={13} className="text-orange-400 animate-spin" />
                <span className="text-[12px] text-zinc-500">
                  Loading {loadingPlatforms.map((p) => platformConfig[p]?.label || p).join(", ")}...
                </span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/15 mb-4">
                <AlertCircle size={14} className="text-red-400" />
                <p className="text-[13px] text-red-400">{error}</p>
              </div>
            )}

            {/* Trend Board */}
            {results.length > 0 && (
              <>
                <div className="space-y-2 mb-6">
                  {results.map((item, i) => {
                    const config = platformConfig[item.platform] || platformConfig.web;
                    const Icon = config.icon;
                    const engagementParts = Object.entries(item.engagement)
                      .filter(([, v]) => v > 0)
                      .map(([k, v]) => `${formatNumber(v)} ${k}`);

                    return (
                      <motion.div
                        key={`${item.platform}-${i}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-white/2 border border-white/4 rounded-xl p-4 hover:bg-white/3 transition-smooth"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                            <div className="text-[11px] font-bold text-orange-400 bg-orange-500/10 rounded px-1.5 py-0.5">
                              {item.trendScore}
                            </div>
                            <Icon size={14} className={config.color} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                              className="text-[13px] font-medium text-zinc-200 hover:text-white transition-colors leading-snug">
                              {item.title}
                              <ExternalLink size={10} className="inline ml-1 text-zinc-600" />
                            </a>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-500">{config.label}</span>
                              {item.author && <span className="text-[11px] text-zinc-600">{item.author}</span>}
                              {engagementParts.map((e, j) => (
                                <span key={j} className="text-[11px] text-zinc-500">{e}</span>
                              ))}
                              {item.postedAt && (
                                <span className="text-[11px] text-zinc-700">
                                  {new Date(item.postedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mb-8">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={analyzeTrends} disabled={analyzing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/15 text-orange-400 text-[13px] font-medium hover:bg-orange-500/20 disabled:opacity-50 transition-smooth">
                    {analyzing ? <Loader2 size={14} className="animate-spin" /> : <BarChart3 size={14} />}
                    {analyzing ? "Analyzing..." : "Analyze Trends"}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={generateIdeas} disabled={generatingIdeas}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[13px] font-medium hover:bg-emerald-500/20 disabled:opacity-50 transition-smooth">
                    {generatingIdeas ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {generatingIdeas ? "Generating..." : "Generate Ideas"}
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={generateCalendar} disabled={generatingCalendar}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/15 text-violet-400 text-[13px] font-medium hover:bg-violet-500/20 disabled:opacity-50 transition-smooth">
                    {generatingCalendar ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
                    {generatingCalendar ? "Generating..." : "Content Calendar"}
                  </motion.button>
                </div>
              </>
            )}

            {/* Analysis */}
            {analysis && (() => {
              const a = analysis as {
                dominantPattern?: { description: string; evidence: string };
                hookPatterns?: { pattern: string; example: string; avgEngagement: string }[];
                contentGaps?: { gap: string; evidence: string; opportunity: string }[];
                platformBreakdown?: { platform: string; insight: string; bestFormat: string }[];
                timingInsights?: string;
                nicheHeatScore?: number;
                competitionLevel?: number;
                bestPlatformNow?: string;
                underservedAngle?: string;
              };
              return (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 mb-6">

                  {/* Scores bar */}
                  <div className="bg-white/2 border border-white/4 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BarChart3 size={15} className="text-orange-400" />
                      <h3 className="text-[14px] font-semibold text-zinc-200">Trend Intelligence</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-orange-500/5 border border-orange-500/10 rounded-lg p-3 text-center">
                        <p className="text-[22px] font-bold text-orange-400">{a.nicheHeatScore || "—"}<span className="text-[11px] text-zinc-600">/10</span></p>
                        <p className="text-[10px] text-zinc-600 uppercase mt-0.5">Niche Heat</p>
                      </div>
                      <div className="bg-white/3 border border-white/4 rounded-lg p-3 text-center">
                        <p className="text-[22px] font-bold text-zinc-300">{a.competitionLevel || "—"}<span className="text-[11px] text-zinc-600">/10</span></p>
                        <p className="text-[10px] text-zinc-600 uppercase mt-0.5">Competition</p>
                      </div>
                      <div className="bg-white/3 border border-white/4 rounded-lg p-3 text-center">
                        <p className="text-[14px] font-semibold text-cyan-400 capitalize">{a.bestPlatformNow || "—"}</p>
                        <p className="text-[10px] text-zinc-600 uppercase mt-0.5">Best Platform</p>
                      </div>
                      <div className="bg-white/3 border border-white/4 rounded-lg p-3 text-center">
                        <p className="text-[12px] text-zinc-400">{a.timingInsights?.slice(0, 60) || "—"}...</p>
                        <p className="text-[10px] text-zinc-600 uppercase mt-0.5">Best Timing</p>
                      </div>
                    </div>
                  </div>

                  {/* Dominant pattern */}
                  {a.dominantPattern && (
                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest text-orange-400/70 font-semibold mb-2">Dominant Pattern</p>
                      <p className="text-[13px] text-zinc-200 font-medium mb-1">{a.dominantPattern.description}</p>
                      <p className="text-[11px] text-zinc-500">{a.dominantPattern.evidence}</p>
                    </div>
                  )}

                  {/* Hook patterns */}
                  {a.hookPatterns && a.hookPatterns.length > 0 && (
                    <div className="bg-white/2 border border-white/4 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest text-emerald-400/70 font-semibold mb-3">Winning Hook Patterns</p>
                      <div className="space-y-2.5">
                        {a.hookPatterns.map((h, i) => (
                          <div key={i} className="bg-white/2 border border-white/3 rounded-lg p-3">
                            <p className="text-[13px] text-zinc-200 font-medium">{h.pattern}</p>
                            <p className="text-[11px] text-zinc-500 mt-1 italic">&ldquo;{h.example}&rdquo;</p>
                            <p className="text-[11px] text-emerald-400/70 mt-1">{h.avgEngagement}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content gaps */}
                  {a.contentGaps && a.contentGaps.length > 0 && (
                    <div className="bg-white/2 border border-white/4 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold mb-3">Content Gaps (Your Opportunities)</p>
                      <div className="space-y-3">
                        {a.contentGaps.map((g, i) => (
                          <div key={i} className="border-l-2 border-amber-500/30 pl-3">
                            <p className="text-[13px] text-zinc-200 font-medium">{g.gap}</p>
                            <p className="text-[11px] text-zinc-600 mt-1">{g.evidence}</p>
                            <div className="bg-amber-500/5 border border-amber-500/8 rounded-md px-3 py-2 mt-2">
                              <p className="text-[11px] text-amber-400">Opportunity: {g.opportunity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Platform breakdown */}
                  {a.platformBreakdown && a.platformBreakdown.length > 0 && (
                    <div className="bg-white/2 border border-white/4 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest text-cyan-400/70 font-semibold mb-3">Platform Breakdown</p>
                      <div className="space-y-2.5">
                        {a.platformBreakdown.map((pb, i) => {
                          const pConfig = platformConfig[pb.platform] || platformConfig.web;
                          const PIcon = pConfig.icon;
                          return (
                            <div key={i} className="bg-white/2 border border-white/3 rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-1.5">
                                <PIcon size={13} className={pConfig.color} />
                                <span className="text-[12px] font-semibold text-zinc-200 capitalize">{pConfig.label}</span>
                              </div>
                              <p className="text-[12px] text-zinc-400 mb-1.5">{pb.insight}</p>
                              <div className="bg-white/3 rounded-md px-2.5 py-1.5">
                                <p className="text-[10px] text-zinc-600 uppercase mb-0.5">Best Format</p>
                                <p className="text-[11px] text-zinc-300">{pb.bestFormat}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Underserved angle */}
                  {a.underservedAngle && (
                    <div className="bg-violet-500/5 border border-violet-500/10 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest text-violet-400/70 font-semibold mb-2">Biggest Underserved Angle</p>
                      <p className="text-[13px] text-zinc-300 leading-relaxed">{a.underservedAngle}</p>
                    </div>
                  )}

                  {/* Timing insights full */}
                  {a.timingInsights && (
                    <div className="bg-white/2 border border-white/4 rounded-xl p-4">
                      <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold mb-2">Timing Insights</p>
                      <p className="text-[12px] text-zinc-400 leading-relaxed">{a.timingInsights}</p>
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {/* Ideas */}
            {ideas?.ideas && ideas.ideas.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/2 border border-white/4 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={15} className="text-emerald-400" />
                  <h3 className="text-[14px] font-semibold text-zinc-200">Content Ideas</h3>
                </div>
                <div className="space-y-3">
                  {ideas.ideas.map((idea, i) => {
                    const config = platformConfig[idea.platform] || platformConfig.web;
                    const IdeaIcon = config.icon;
                    return (
                      <div key={i} className="bg-white/2 border border-white/3 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <IdeaIcon size={12} className={config.color} />
                          <span className="text-[10px] text-zinc-600 uppercase">{config.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${idea.estimatedPerformance === "high" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
                            {idea.estimatedPerformance}
                          </span>
                        </div>
                        <p className="text-[13px] font-medium text-zinc-200 mb-1">{idea.title}</p>
                        <p className="text-[12px] text-zinc-500 mb-2">{idea.hook}</p>
                        <p className="text-[11px] text-zinc-600">{idea.whyNow}</p>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => router.push(`/critic/new?context=${encodeURIComponent(idea.title)}`)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                            <Lightbulb size={10} /> Critique
                          </button>
                          <button onClick={() => navigator.clipboard.writeText(idea.hook || idea.title)}
                            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
                            Copy Hook
                          </button>
                          <button onClick={() => router.push(`/research/new?q=${encodeURIComponent(idea.title)}`)}
                            className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1">
                            <Search size={10} /> Research
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Calendar */}
            {calendar?.days && calendar.days.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white/2 border border-white/4 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar size={15} className="text-violet-400" />
                  <h3 className="text-[14px] font-semibold text-zinc-200">7-Day Content Plan</h3>
                </div>
                <div className="space-y-1.5">
                  {calendar.days.map((day, i) => {
                    const config = platformConfig[day.platform.toLowerCase()] || platformConfig.web;
                    return (
                      <div key={i} className="flex items-center gap-3 bg-white/2 rounded-lg px-3 py-2.5">
                        <span className="text-[11px] font-semibold text-violet-400 w-20 shrink-0">{day.day}</span>
                        <span className="text-[10px] text-zinc-600 bg-white/5 px-1.5 py-0.5 rounded shrink-0">{day.platform}</span>
                        <span className="text-[12px] text-zinc-300 flex-1 min-w-0 truncate">{day.topic}</span>
                        <span className="text-[10px] text-zinc-600 shrink-0">{day.bestTime}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Empty state */}
            {searching && results.length === 0 && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="text-orange-400 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
