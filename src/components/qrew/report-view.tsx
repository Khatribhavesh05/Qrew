"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, FileText, Zap, BarChart3, ArrowRight, Info, MessageSquare } from "lucide-react";
import { MCQPopup } from "./mcq-popup";
import { ReportPanel } from "./report-panel";
import { AgentChatPanel } from "./agent-chat-panel";
import type { MCQ } from "@/app/api/startups/[startupId]/mcqs/route";
import type { Startup } from "@/types";


interface ReportViewProps {
  startup: Startup;
}

type AgentState = "waiting" | "thinking" | "done";
type Phase = "loading_mcqs" | "mcqs" | "generating" | "done";

interface Reports {
  research: string;
  strategy: string;
}

export function ReportView({ startup }: ReportViewProps) {
  const [phase, setPhase] = useState<Phase>("loading_mcqs");
  const [agentStatus, setAgentStatus] = useState<{ alex: AgentState; sam: AgentState }>({
    alex: "waiting", sam: "waiting",
  });
  const [reports, setReports] = useState<Partial<Reports>>({});
  const [mcqs, setMcqs] = useState<MCQ[]>([]);
  const [mcqIndex, setMcqIndex] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [panel, setPanel] = useState<{ open: boolean; type: "research" | "strategy" }>({
    open: false, type: "research",
  });
  const [chatPanel, setChatPanel] = useState<{ open: boolean; agent: "alex" | "sam" }>({
    open: false, agent: "alex",
  });
  const [error, setError] = useState<string | null>(null);

  // Guards — prevent duplicate calls
  const mcqsLoadedRef = useRef(false);
  const generationStartedRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Step 1: Load MCQs ONCE on mount ────────────────────────────────────────
  useEffect(() => {
    if (mcqsLoadedRef.current) return;
    mcqsLoadedRef.current = true;

    // ── Primary guard: report_data in DB trumps everything ──────────────────
    // Check report_data FIRST regardless of status — avoids re-generation
    // when status is stale (e.g. stuck at "researching" but data exists)
    const rd = startup.report_data as Partial<Reports> | null;
    if (rd?.research && rd?.strategy) {
      console.log("[ReportView] Loading reports from DB — skipping generation");
      setReports({ research: rd.research, strategy: rd.strategy });
      setAgentStatus({ alex: "done", sam: "done" });
      setPhase("done");
      return;
    }

    // Status check: if report_ready/live but report_data is somehow missing,
    // still skip generation and show empty state rather than burn credits
    if (startup.status === "report_ready" || startup.status === "live") {
      console.warn("[ReportView] Status is done but report_data is empty — skipping generation");
      setAgentStatus({ alex: "done", sam: "done" });
      setPhase("done");
      return;
    }

    // Only reach here if report_data is null AND status is still in-progress
    console.log("[ReportView] No existing reports — loading MCQs then generating");

    // Safety timeout: if MCQ fetch takes > 8s, skip to generation
    const mcqTimeout = setTimeout(() => {
      console.warn("[MCQ] Timeout — skipping to generation");
      setPhase("generating");
      startGeneration();
    }, 8000);

    void (async () => {
      try {
        console.log("[MCQ] Fetching questions for startup:", startup.id);
        const res = await fetch(`/api/startups/${startup.id}/mcqs`);

        clearTimeout(mcqTimeout);

        if (!res.ok) {
          console.warn("[MCQ] API error:", res.status, "— skipping to generation");
          setPhase("generating");
          startGeneration();
          return;
        }

        const data = (await res.json()) as { mcqs?: MCQ[]; error?: string };
        console.log("[MCQ] Response:", data);

        if (data.error) {
          console.warn("[MCQ] API returned error:", data.error, "— skipping");
          setPhase("generating");
          startGeneration();
          return;
        }

        const loaded = data.mcqs ?? [];
        console.log("[MCQ] Questions loaded:", loaded.length);

        if (loaded.length > 0) {
          setMcqs(loaded);
          setPhase("mcqs");
        } else {
          // Clear idea — skip MCQs, go straight to generation
          console.log("[MCQ] Idea is clear — no questions needed, starting generation");
          setPhase("generating");
          startGeneration();
        }
      } catch (err) {
        clearTimeout(mcqTimeout);
        console.error("[MCQ] Fetch failed:", err, "— skipping to generation");
        setPhase("generating");
        startGeneration();
      }
    })();

    return () => { eventSourceRef.current?.close(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run once on mount only


  // ── Step 2: Start SSE generation ───────────────────────────────────────────
  const startGeneration = () => {
    if (generationStartedRef.current) return;
    generationStartedRef.current = true;
    setPhase("generating");

    const es = new EventSource(`/api/startups/${startup.id}/generate`);
    eventSourceRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as {
          type: string;
          agent?: string;
          state?: AgentState;
          content?: string;
          message?: string;
        };

        if (data.type === "status" && data.agent) {
          setAgentStatus((prev) => ({ ...prev, [data.agent!]: data.state ?? "waiting" }));
        }
        if (data.type === "report" && data.agent && data.content) {
          const key = data.agent === "alex" ? "research" : "strategy";
          setReports((prev) => ({ ...prev, [key]: data.content }));
        }
        if (data.type === "complete") {
          setPhase("done");
          setAgentStatus({ alex: "done", sam: "done" });
          es.close();
        }
        if (data.type === "error") {
          setError(data.message ?? "Generation failed");
          es.close();
        }
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      setError("Connection lost. Please refresh.");
      es.close();
    };
  };

  // ── MCQ handlers ────────────────────────────────────────────────────────────
  const handleMCQAnswered = (field: string, value: string) => {
    setAnsweredCount((c) => c + 1);
    // Save answer in background
    void fetch(`/api/startups/${startup.id}/mcqs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field, value }),
    });
    advanceMCQ();
  };

  const handleMCQSkipped = () => advanceMCQ();

  const advanceMCQ = () => {
    const nextIndex = mcqIndex + 1;
    setMcqIndex(nextIndex);
    // All MCQs done — start generation
    if (nextIndex >= mcqs.length) {
      startGeneration();
    }
  };

  const isGenerating = phase === "generating";
  const isDone = phase === "done";
  const currentMCQ = phase === "mcqs" ? mcqs[mcqIndex] ?? null : null;
  const bothDone = agentStatus.alex === "done" && agentStatus.sam === "done";

  const openChat = (agent: "alex" | "sam") => {
    setChatPanel({ open: true, agent });
  };

  return (
    <>
    <motion.div
      animate={{ marginLeft: chatPanel.open ? 380 : 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 35 }}
      className="min-h-screen flex flex-col"
      style={{ background: "#0A0A0A", color: "#F5F5F5" }}
    >
      {/* Ambient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.07), transparent 60%)" }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#1F1F1F" }}>
        <span className="text-lg font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: "#F5F5F5" }}>{startup.name}</span>
          <a href="/app" className="text-xs" style={{ color: "#525252" }}>Dashboard →</a>
        </div>
      </nav>

      <div className="relative z-10 w-full max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <StepBadge n={1} label="Research" done={agentStatus.alex === "done"} active={agentStatus.alex === "thinking"} />
          <div className="h-px flex-1" style={{ background: "#1F1F1F" }} />
          <StepBadge n={2} label="Strategy" done={agentStatus.sam === "done"} active={agentStatus.sam === "thinking"} />
          <div className="h-px flex-1" style={{ background: "#1F1F1F" }} />
          <StepBadge n={3} label="Build" done={false} active={false} />
        </div>

        {/* ── Phase: Loading MCQs ── */}
        {phase === "loading_mcqs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-4">
            <Loader2 size={16} className="animate-spin" style={{ color: "#6366F1" }} />
            <span className="text-sm" style={{ color: "#A3A3A3" }}>Preparing your questions…</span>
          </motion.div>
        )}

        {/* ── Phase: MCQs — show one at a time, wait for answer ── */}
        <AnimatePresence mode="wait">
          {currentMCQ && (
            <motion.div key={`mcq-wrapper-${mcqIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Progress */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs" style={{ color: "#525252" }}>
                  Question {mcqIndex + 1} of {mcqs.length}
                </span>
                <div className="flex gap-1">
                  {mcqs.map((_, i) => (
                    <div
                      key={i}
                      className="h-1 w-6 rounded-full transition-all"
                      style={{ background: i < mcqIndex ? "#6366F1" : i === mcqIndex ? "#6366F1" : "#1F1F1F", opacity: i < mcqIndex ? 0.4 : 1 }}
                    />
                  ))}
                </div>
              </div>
              <MCQPopup
                key={`mcq-${mcqIndex}`}
                mcq={currentMCQ}
                onAnswered={handleMCQAnswered}
                onSkipped={handleMCQSkipped}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {answeredCount > 0 && phase !== "mcqs" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-center" style={{ color: "#525252" }}>
            {answeredCount} answer{answeredCount > 1 ? "s" : ""} saved — your team is using this
          </motion.p>
        )}

        {/* ── Phase: Generating — agent status cards ── */}
        {(isGenerating || isDone) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            <AgentCard
              emoji="🔍" name="Alex" role="Research"
              state={agentStatus.alex} color="#6366F1"
              onClick={agentStatus.alex === "done" ? () => openChat("alex") : undefined}
            />
            <AgentCard
              emoji="📊" name="Sam" role="Strategy"
              state={agentStatus.sam} color="#10B981"
              onClick={agentStatus.sam === "done" ? () => openChat("sam") : undefined}
            />
          </motion.div>
        )}

        {/* Report artifact cards */}
        <AnimatePresence>
          {reports.research && (
            <ArtifactCard
              key="research"
              icon={<Zap size={16} color="#6366F1" />}
              label="Research Report"
              subtitle="Market analysis · Competitors · Audience"
              color="#6366F1"
              onClick={() => setPanel({ open: true, type: "research" })}
            />
          )}
          {reports.strategy && (
            <ArtifactCard
              key="strategy"
              icon={<BarChart3 size={16} color="#10B981" />}
              label="Strategy Report"
              subtitle="GTM · Pricing · 90-day roadmap"
              color="#10B981"
              onClick={() => setPanel({ open: true, type: "strategy" })}
            />
          )}
        </AnimatePresence>

        {error && (
          <div className="rounded-xl border px-4 py-3 text-sm text-center" style={{ borderColor: "#EF4444", color: "#EF4444", background: "rgba(239,68,68,0.06)" }}>
            {error}
          </div>
        )}

        {/* Build CTA — appears once first report arrives */}
        <AnimatePresence>
          {(reports.research || isDone) && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 rounded-2xl border p-5"
              style={{ background: "#111111", borderColor: "#1F1F1F" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText size={14} style={{ color: "#525252" }} />
                <span className="text-xs font-medium" style={{ color: "#525252" }}>Step 2 — Build your startup</span>
              </div>
              <p className="text-sm mb-5" style={{ color: "#A3A3A3" }}>
                Generate your full codebase. Preview live. Deploy when ready.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <BuildCard
                  label="Standard"
                  credits="~1.5 credits"
                  desc="Professional website, live on your domain in minutes"
                  color="#6366F1"
                  tooltip={"✅ Full Next.js website\n✅ Unique AI generated background\n✅ Smooth scroll animations\n✅ Database + Auth + Stripe payments\n✅ Pushed to GitHub\n✅ Live on Vercel\n✅ 5 AI agents on standby"}
                  reportsReady={isDone}
                  startupId={startup.id}
                  type="standard"
                />
                <BuildCard
                  label="Premium"
                  credits="~2.5 credits"
                  desc="Everything in Standard + cinematic scroll experience like Apple.com"
                  color="#10B981"
                  tooltip={"Everything in Standard +\n🎬 AI generated scroll video\n📱 Frame-by-frame scroll scrubbing\n⚡ Apple.com level experience\n🎨 Full brand identity package"}
                  reportsReady={isDone}
                  startupId={startup.id}
                  type="premium"
                  comingSoon
                />
              </div>
              {!isDone && (
                <p className="text-xs text-center mt-3" style={{ color: "#525252" }}>Waiting for all reports…</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Report side panel (right) */}
      <ReportPanel
        open={panel.open}
        title={panel.type === "research" ? "Research Report" : "Strategy Report"}
        agentName={panel.type === "research" ? "Alex" : "Sam"}
        agentRole={panel.type === "research" ? "Research Agent" : "Strategy Agent"}
        startupName={startup.name ?? "Startup"}
        content={panel.type === "research" ? (reports.research ?? "") : (reports.strategy ?? "")}
        accentColor={panel.type === "research" ? "#6366F1" : "#10B981"}
        accentRGB={panel.type === "research" ? [99, 102, 241] : [16, 185, 129]}
        onClose={() => setPanel((p) => ({ ...p, open: false }))}
      />
    </motion.div>

    {/* Agent chat panel (left) — outside the shifting wrapper so it stays fixed */}
    <AgentChatPanel
      open={chatPanel.open}
      agent={chatPanel.agent}
      startupId={startup.id}
      onClose={() => setChatPanel(p => ({ ...p, open: false }))}
    />
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StepBadge({ n, label, done, active }: { n: number; label: string; done: boolean; active: boolean }) {
  const color = done ? "#10B981" : active ? "#6366F1" : "#525252";
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${color}20`, color }}>
        {done ? <CheckCircle size={12} /> : n}
      </div>
      <span className="text-xs font-medium hidden sm:block" style={{ color }}>{label}</span>
    </div>
  );
}

function AgentCard({ emoji, name, role, state, color, subtitle, onClick }: {
  emoji: string; name: string; role: string; state: "waiting" | "thinking" | "done"; color: string; subtitle?: string; onClick?: () => void;
}) {
  const isThinking = state === "thinking";
  const isDone = state === "done";
  return (
    <motion.div
      animate={{ borderColor: isDone ? `${color}30` : "#1F1F1F" }}
      className="flex items-center gap-4 rounded-xl border px-4 py-3"
      style={{
        background: isDone ? `${color}08` : "#111111",
        borderColor: "#1F1F1F",
        cursor: isDone && onClick ? "pointer" : "default",
      }}
      onClick={isDone ? onClick : undefined}
      whileHover={isDone && onClick ? { scale: 1.012 } : {}}
      whileTap={isDone && onClick ? { scale: 0.99 } : {}}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 relative"
        style={{ background: isDone ? `${color}18` : "#161616", border: `1px solid ${isDone ? `${color}30` : "#1A1A1A"}` }}
      >
        {emoji}
        {isThinking && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2"
            style={{ borderColor: color }}
            animate={{ scale: [1, 1.25], opacity: [0.8, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>{name}</span>
          <span className="text-xs rounded-full px-2 py-0.5 capitalize" style={{ background: `${color}15`, color }}>{role}</span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#525252" }}>
          {subtitle ?? (isDone ? "Report ready" : isThinking ? "Working…" : "Waiting…")}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {isDone && onClick && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium"
            style={{ background: `${color}15`, color }}
          >
            <MessageSquare size={11} />
            Chat
          </motion.div>
        )}
        {isDone && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
            <CheckCircle size={16} style={{ color }} />
          </motion.div>
        )}
        {isThinking && <Loader2 size={16} className="animate-spin" style={{ color }} />}
      </div>
    </motion.div>
  );
}

function ArtifactCard({ icon, label, subtitle, color, onClick }: {
  icon: React.ReactNode; label: string; subtitle: string; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-xl border p-4 text-left group transition-colors"
      style={{ background: "#111111", borderColor: "#1F1F1F" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}40`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1F1F1F"; }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>📄 {label}</p>
        <p className="text-xs mt-0.5" style={{ color: "#525252" }}>{subtitle}</p>
      </div>
      <ArrowRight size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
    </motion.button>
  );
}

function BuildCard({
  label, credits, desc, color, tooltip,
  reportsReady, startupId, type, comingSoon,
}: {
  label: string; credits: string; desc: string; color: string; tooltip: string;
  reportsReady: boolean; startupId: string; type: string; comingSoon?: boolean;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isDisabled = !reportsReady || !!comingSoon;

  const handleClick = () => {
    if (isDisabled) return;
    window.location.href = `/app/${startupId}/build?type=${type}`;
  };

  return (
    <div
      className="flex flex-col rounded-xl border p-4 transition-all"
      style={{ borderColor: `${color}25`, background: `${color}06` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: comingSoon ? "#525252" : "#F5F5F5" }}>{label}</span>
          {comingSoon && (
            <span className="text-xs rounded-full px-2 py-0.5 font-medium" style={{ background: "#1F1F1F", color: "#525252", border: "1px solid #2A2A2A" }}>
              Soon
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs rounded-full px-2 py-0.5 font-medium"
            style={{ background: comingSoon ? "#1A1A1A" : `${color}18`, color: comingSoon ? "#525252" : color }}
          >
            {credits}
          </span>
          {/* ⓘ tooltip trigger */}
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="flex items-center justify-center rounded-full transition-colors"
              style={{ color: "#525252" }}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
            >
              <Info size={13} />
            </button>
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 bottom-full mb-2 z-50 rounded-xl border p-3 w-52 text-left"
                  style={{ background: "#161616", borderColor: `${color}30`, boxShadow: `0 8px 32px rgba(0,0,0,0.6)` }}
                >
                  {tooltip.split("\n").map((line, i) => (
                    <p key={i} className="text-xs leading-relaxed" style={{ color: line.startsWith("Everything") ? "#A3A3A3" : "#F5F5F5" }}>
                      {line}
                    </p>
                  ))}
                  {/* Arrow */}
                  <div
                    className="absolute right-1.5 top-full w-2 h-2 rotate-45"
                    style={{ background: "#161616", borderRight: `1px solid ${color}30`, borderBottom: `1px solid ${color}30`, marginTop: "-5px" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: "#525252" }}>{desc}</p>

      {/* CTA button */}
      <motion.button
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.97 } : {}}
        onClick={handleClick}
        disabled={isDisabled}
        className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all disabled:opacity-40"
        style={comingSoon
          ? { background: "#111111", color: "#525252", border: "1px solid #1F1F1F", cursor: "not-allowed" }
          : { background: color, color: "#fff", boxShadow: isDisabled ? "none" : `0 0 16px ${color}40` }
        }
      >
        {comingSoon ? "Coming Soon" : <>Start {label} Build <ArrowRight size={12} /></>}
      </motion.button>
    </div>
  );
}
