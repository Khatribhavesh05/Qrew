"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, FileText, Zap, BarChart3, ArrowRight, Info, MessageSquare, Download, Rocket } from "lucide-react";
import { MCQPopup } from "./mcq-popup";
import { ReportPanel } from "./report-panel";
import { AgentChatPanel } from "./agent-chat-panel";
import type { MCQ } from "@/app/api/startups/[startupId]/mcqs/route";
import type { Startup } from "@/types";
import { supabase } from "@/lib/supabase";
import { CREDIT_COST } from "@/lib/credits";


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
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);

  // Guards — prevent duplicate calls
  const mcqsLoadedRef = useRef(false);
  const generationStartedRef = useRef(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("credits_balance")
        .eq("id", user.id)
        .single();
      setCreditsBalance((data as { credits_balance?: number } | null)?.credits_balance ?? 0);
    })();
  }, []);

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

  // ── Step 1: Load MCQs ONCE on mount ────────────────────────────────────────
  useEffect(() => {
    if (mcqsLoadedRef.current) return;
    mcqsLoadedRef.current = true;

    const rd = startup.report_data as Partial<Reports> | null;
    if (rd?.research && rd?.strategy) {
      console.log("[ReportView] Loading reports from DB — skipping generation");
      setReports({ research: rd.research, strategy: rd.strategy });
      setAgentStatus({ alex: "done", sam: "done" });
      setPhase("done");
      return;
    }

    if (startup.status === "report_ready" || startup.status === "live") {
      console.warn("[ReportView] Status is done but report_data is empty — skipping generation");
      setAgentStatus({ alex: "done", sam: "done" });
      setPhase("done");
      return;
    }

    console.log("[ReportView] No existing reports — loading MCQs then generating");

    const mcqTimeout = setTimeout(() => {
      console.warn("[MCQ] Timeout after 3s — skipping to generation");
      setPhase("generating");
      startGeneration();
    }, 3000);

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

        const data = (await res.json()) as { mcqs?: MCQ[]; error?: string; fallback?: boolean };
        console.log("[MCQ] Response:", data);

        if (data.fallback) {
          console.log("[MCQ] Using fallback questions (Gemini failed)");
        }

        const loaded = data.mcqs ?? [];
        console.log("[MCQ] Questions loaded:", loaded.length);

        if (loaded.length > 0) {
          setMcqs(loaded);
          setPhase("mcqs");
        } else {
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
  }, [startup.id, startup.report_data, startup.status]);


  // ── MCQ handlers ────────────────────────────────────────────────────────────
  const handleMCQAnswered = (field: string, value: string) => {
    setAnsweredCount((c) => c + 1);
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
    if (nextIndex >= mcqs.length) {
      startGeneration();
    }
  };

  const isGenerating = phase === "generating";
  const isDone = phase === "done";
  const currentMCQ = phase === "mcqs" ? mcqs[mcqIndex] ?? null : null;

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
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.06), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08), transparent 60%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(10,10,10,0.8)" }}>
        <span className="text-lg font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>{startup.name}</span>
          <Link href="/app" className="text-xs font-medium transition-colors" style={{ color: "#6B7280" }} onMouseEnter={e => e.currentTarget.style.color = "#9CA3AF"} onMouseLeave={e => e.currentTarget.style.color = "#6B7280"}>Dashboard →</Link>
        </div>
      </nav>

      <div className="relative z-10 w-full max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8">

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <StepBadge n={1} label="Research" done={agentStatus.alex === "done"} active={agentStatus.alex === "thinking"} />
          <div className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(99,102,241,0.3), rgba(255,255,255,0.05))" }} />
          <StepBadge n={2} label="Strategy" done={agentStatus.sam === "done"} active={agentStatus.sam === "thinking"} />
          <div className="h-px flex-1" style={{ background: "linear-gradient(to right, rgba(255,255,255,0.05), rgba(255,255,255,0.02))" }} />
          <StepBadge n={3} label="Build" done={false} active={false} />
        </div>

        {/* ── Phase: Loading MCQs ── */}
        {phase === "loading_mcqs" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-6 justify-center">
            <Loader2 size={18} className="animate-spin" style={{ color: "#6366F1" }} />
            <span className="text-sm font-medium" style={{ color: "#9CA3AF" }}>Preparing your questions…</span>
          </motion.div>
        )}

        {/* ── Phase: MCQs — show one at a time, wait for answer ── */}
        <AnimatePresence mode="wait">
          {currentMCQ && (
            <motion.div key={`mcq-wrapper-${mcqIndex}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold" style={{ color: "#6B7280" }}>
                  Question {mcqIndex + 1} of {mcqs.length}
                </span>
                <div className="flex gap-1.5">
                  {mcqs.map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: i === mcqIndex ? 1 : 0.8 }}
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: i === mcqIndex ? 32 : 24,
                        background: i < mcqIndex ? "#10B981" : i === mcqIndex ? "#6366F1" : "rgba(255,255,255,0.1)",
                      }}
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
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-center font-medium" style={{ color: "#6B7280" }}>
            ✓ {answeredCount} answer{answeredCount > 1 ? "s" : ""} saved — your team is using this
          </motion.p>
        )}

        {/* ── Phase: Generating — agent status cards ── */}
        {(isGenerating || isDone) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
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
              icon={<Zap size={18} color="#6366F1" />}
              label="Research Report"
              subtitle="Market analysis · Competitors · Audience"
              color="#6366F1"
              onClick={() => setPanel({ open: true, type: "research" })}
            />
          )}
          {reports.strategy && (
            <ArtifactCard
              key="strategy"
              icon={<BarChart3 size={18} color="#10B981" />}
              label="Strategy Report"
              subtitle="GTM · Pricing · 90-day roadmap"
              color="#10B981"
              onClick={() => setPanel({ open: true, type: "strategy" })}
            />
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border px-4 py-3 text-sm text-center font-medium"
            style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444", background: "rgba(239,68,68,0.06)" }}
          >
            {error}
          </motion.div>
        )}

        {/* Build CTA — appears once first report arrives */}
        <AnimatePresence>
          {(reports.research || isDone) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border p-6 backdrop-blur-sm"
              style={{ background: "rgba(17,17,17,0.6)", borderColor: "rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-2 mb-5">
                <FileText size={16} style={{ color: "#6B7280" }} />
                <span className="text-sm font-bold" style={{ color: "#9CA3AF" }}>Step 2 — Build your startup</span>
              </div>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "#9CA3AF" }}>
                Generate your full codebase. Preview live. Deploy when ready.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BuildCard
                  label="Standard"
                  credits="~1.5 credits"
                  desc="Professional website, live on your domain in minutes"
                  color="#6366F1"
                  tooltip={"✅ Full Next.js website\n✅ Unique AI generated background\n✅ Smooth scroll animations\n✅ Database + Auth + Stripe payments\n✅ Pushed to GitHub\n✅ Live on Vercel\n✅ 5 AI agents on standby"}
                  reportsReady={isDone}
                  startupId={startup.id}
                  type="standard"
                  cost={CREDIT_COST.standard}
                  creditsBalance={creditsBalance}
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
                  cost={CREDIT_COST.premium}
                  creditsBalance={creditsBalance}
                  comingSoon
                />
              </div>
              {!isDone && (
                <p className="text-xs text-center mt-4 font-medium" style={{ color: "#6B7280" }}>Waiting for all reports…</p>
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
  const color = done ? "#10B981" : active ? "#6366F1" : "#6B7280";
  return (
    <div className="flex items-center gap-2 shrink-0">
      <motion.div
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: `${color}20`, color, border: `2px solid ${color}40` }}
      >
        {done ? <CheckCircle size={14} strokeWidth={3} /> : n}
      </motion.div>
      <span className="text-xs font-bold hidden sm:block" style={{ color }}>{label}</span>
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
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        borderColor: isDone ? `${color}40` : "rgba(255,255,255,0.05)",
      }}
      whileHover={isDone && onClick ? { y: -2, scale: 1.01 } : {}}
      className="relative flex items-center gap-4 rounded-2xl border px-5 py-4 backdrop-blur-sm overflow-hidden"
      style={{
        background: isDone ? `${color}08` : "rgba(17,17,17,0.6)",
        cursor: isDone && onClick ? "pointer" : "default",
      }}
      onClick={isDone ? onClick : undefined}
    >
      {/* Glow effect */}
      {isDone && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 20% 50%, ${color}10, transparent 70%)` }}
        />
      )}

      <div className="relative z-10">
        <motion.div
          animate={isThinking ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="relative w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ background: isDone ? `${color}20` : "rgba(255,255,255,0.03)", border: `2px solid ${isDone ? `${color}50` : "rgba(255,255,255,0.05)"}` }}
        >
          {emoji}
          {isThinking && (
            <>
              <motion.div
                className="absolute inset-0 rounded-xl border-2"
                style={{ borderColor: color }}
                animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-xl border-2"
                style={{ borderColor: color }}
                animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
              />
            </>
          )}
        </motion.div>
      </div>

      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base font-bold" style={{ color: "#F5F5F5" }}>{name}</span>
          <span className="text-xs rounded-full px-2.5 py-1 font-semibold capitalize" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>{role}</span>
        </div>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          {subtitle ?? (isDone ? "Report ready" : isThinking ? "Working…" : "Waiting…")}
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-3 relative z-10">
        {isDone && onClick && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold"
            style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
          >
            <MessageSquare size={12} />
            Chat
          </motion.div>
        )}
        {isDone && (
          <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 400 }}>
            <CheckCircle size={20} style={{ color }} strokeWidth={2.5} />
          </motion.div>
        )}
        {isThinking && <Loader2 size={18} className="animate-spin" style={{ color }} />}
      </div>
    </motion.div>
  );
}

function ArtifactCard({ icon, label, subtitle, color, onClick }: {
  icon: React.ReactNode; label: string; subtitle: string; color: string; onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-2xl border p-5 text-left group transition-all backdrop-blur-sm"
      style={{ background: "rgba(17,17,17,0.6)", borderColor: "rgba(255,255,255,0.05)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = `${color}40`;
        (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 32px ${color}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-bold mb-1" style={{ color: "#F5F5F5" }}>📄 {label}</p>
        <p className="text-xs" style={{ color: "#9CA3AF" }}>{subtitle}</p>
      </div>
      <ArrowRight size={18} className="shrink-0 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" style={{ color }} />
    </motion.button>
  );
}

function BuildCard({
  label, credits, desc, color, tooltip,
  reportsReady, startupId, type, comingSoon, cost, creditsBalance,
}: {
  label: string; credits: string; desc: string; color: string; tooltip: string;
  reportsReady: boolean; startupId: string; type: string; comingSoon?: boolean;
  cost: number; creditsBalance: number | null;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const insufficientCredits =
    !comingSoon && creditsBalance !== null && creditsBalance < cost;
  const isDisabled = !reportsReady || !!comingSoon || insufficientCredits;

  const handleClick = () => {
    if (isDisabled) return;
    window.location.href = `/app/${startupId}/build?type=${type}`;
  };

  return (
    <motion.div
      whileHover={!isDisabled ? { y: -2, scale: 1.01 } : {}}
      className="flex flex-col rounded-2xl border p-5 transition-all backdrop-blur-sm"
      style={{
        borderColor: comingSoon ? "rgba(255,255,255,0.05)" : `${color}30`,
        background: comingSoon ? "rgba(17,17,17,0.4)" : `${color}06`,
        opacity: comingSoon ? 0.6 : 1,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold" style={{ color: comingSoon ? "#6B7280" : "#F5F5F5" }}>{label}</span>
          {comingSoon && (
            <span className="text-xs rounded-full px-2 py-0.5 font-bold" style={{ background: "rgba(255,255,255,0.05)", color: "#6B7280" }}>
              Soon
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs rounded-full px-2.5 py-1 font-bold"
            style={{ background: comingSoon ? "rgba(255,255,255,0.03)" : `${color}18`, color: comingSoon ? "#6B7280" : color }}
          >
            {credits}
          </span>
          <div className="relative">
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="flex items-center justify-center rounded-full transition-colors"
              style={{ color: "#6B7280" }}
            >
              <Info size={14} />
            </button>
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 bottom-full mb-2 z-50 rounded-xl border p-3 w-56 text-left backdrop-blur-md"
                  style={{ background: "rgba(22,22,22,0.95)", borderColor: `${color}30`, boxShadow: `0 8px 32px rgba(0,0,0,0.6)` }}
                >
                  {tooltip.split("\n").map((line, i) => (
                    <p key={i} className="text-xs leading-relaxed mb-1" style={{ color: line.startsWith("Everything") ? "#9CA3AF" : "#F5F5F5" }}>
                      {line}
                    </p>
                  ))}
                  <div
                    className="absolute right-2 top-full w-2 h-2 rotate-45"
                    style={{ background: "rgba(22,22,22,0.95)", borderRight: `1px solid ${color}30`, borderBottom: `1px solid ${color}30`, marginTop: "-5px" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "#9CA3AF" }}>{desc}</p>

      {insufficientCredits ? (
        <a
          href="/app?buy=true"
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all"
          style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.3)" }}
        >
          Insufficient credits — Buy more
        </a>
      ) : (
        <motion.button
          whileHover={!isDisabled ? { scale: 1.02 } : {}}
          whileTap={!isDisabled ? { scale: 0.98 } : {}}
          onClick={comingSoon ? undefined : handleClick}
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all"
          style={comingSoon
            ? { background: "rgba(255,255,255,0.03)", color: "#6B7280", border: "1px solid rgba(255,255,255,0.05)", cursor: "not-allowed" }
            : { background: color, color: "#fff", boxShadow: isDisabled ? "none" : `0 0 20px ${color}40`, opacity: isDisabled ? 0.5 : 1 }
          }
        >
          {comingSoon ? "Coming Soon" : <><Rocket size={14} /> Start {label} Build</>}
        </motion.button>
      )}
    </motion.div>
  );
}

// Made with Bob
