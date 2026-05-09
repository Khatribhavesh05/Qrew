"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Sparkles,
  Palette,
  Code2,
  ServerCog,
  GitBranch,
  Rocket,
  Square,
  FileCode2,
  AlertCircle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type GenStepId = "jordan" | "morgan_frontend" | "morgan_backend" | "morgan_review";
type StepStatus = "waiting" | "running" | "done" | "error";

interface GenStep {
  id: GenStepId;
  label: string;
  agent: string;
  agentEmoji: string;
  agentColor: string;
  icon: React.ReactNode;
  description: string;
}

type Phase = "idle" | "generating" | "code_ready" | "deploying" | "live" | "cancelled" | "error";

interface DeployState {
  loading: boolean;
  githubUrl: string;
  liveUrl: string;
  error: string | null;
}

interface BuildPageState {
  steps: Record<GenStepId, StepStatus>;
  currentStep: GenStepId | null;
  stepCode: Partial<Record<GenStepId, string>>;
  bgUrl: string | null;
  colors: string[];
  fonts: string[];
  startupName: string;
  fileCount: number;
  filePaths: string[];
  phase: Phase;
  deployState: DeployState;
  error: string | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const GEN_STEPS: GenStep[] = [
  {
    id: "jordan",
    label: "Brand Identity",
    agent: "Jordan",
    agentEmoji: "🎨",
    agentColor: "#F59E0B",
    icon: <Palette size={14} />,
    description: "Generating brand assets with Flux AI",
  },
  {
    id: "morgan_frontend",
    label: "Frontend",
    agent: "Morgan",
    agentEmoji: "⚙️",
    agentColor: "#3B82F6",
    icon: <Code2 size={14} />,
    description: "Building landing page with v0 API",
  },
  {
    id: "morgan_backend",
    label: "Backend",
    agent: "Morgan",
    agentEmoji: "⚙️",
    agentColor: "#3B82F6",
    icon: <ServerCog size={14} />,
    description: "Generating API routes, DB schema, Stripe",
  },
  {
    id: "morgan_review",
    label: "Code Review",
    agent: "Morgan",
    agentEmoji: "⚙️",
    agentColor: "#3B82F6",
    icon: <Sparkles size={14} />,
    description: "Self-correction pass (Claude Haiku)",
  },
];

const INITIAL_STEPS: Record<GenStepId, StepStatus> = {
  jordan: "waiting",
  morgan_frontend: "waiting",
  morgan_backend: "waiting",
  morgan_review: "waiting",
};

// ── Main component ────────────────────────────────────────────────────────────

export default function BuildPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const startupId = params.startupId as string;
  const buildType = searchParams.get("type") ?? "standard";

  const [state, setState] = useState<BuildPageState>({
    steps: { ...INITIAL_STEPS },
    currentStep: null,
    stepCode: {},
    bgUrl: null,
    colors: ["#0A0A0A", "#6366F1", "#818CF8"],
    fonts: ["Space Grotesk", "Inter"],
    startupName: "Your Startup",
    fileCount: 0,
    filePaths: [],
    phase: "idle",
    deployState: { loading: false, githubUrl: "", liveUrl: "", error: null },
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);
  // Track which step chunks belong to (updated by step_start events)
  const currentStepRef = useRef<GenStepId | null>(null);

  // ── SSE via fetch (AbortController support) ─────────────────────────────────

  const startBuild = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({ ...prev, phase: "generating" }));

    try {
      const response = await fetch(
        `/api/startups/${startupId}/build?type=${buildType}`,
        { signal: controller.signal }
      );

      if (!response.ok || !response.body) {
        setState(prev => ({ ...prev, phase: "error", error: `Server error ${response.status}` }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6)) as {
              type: string;
              step?: GenStepId;
              chunk?: string;
              data?: { bgUrl?: string; colors?: string[]; fonts?: string[] };
              startupName?: string;
              fileCount?: number;
              filePaths?: string[];
              message?: string;
            };

            if (data.type === "step_start" && data.step) {
              currentStepRef.current = data.step;
              setState(prev => ({
                ...prev,
                currentStep: data.step!,
                steps: { ...prev.steps, [data.step!]: "running" },
              }));
            }

            if (data.type === "step_done" && data.step) {
              setState(prev => ({
                ...prev,
                steps: { ...prev.steps, [data.step!]: "done" },
                ...(data.data?.bgUrl ? { bgUrl: data.data.bgUrl } : {}),
                ...(data.data?.colors ? { colors: data.data.colors } : {}),
                ...(data.data?.fonts ? { fonts: data.data.fonts } : {}),
              }));
            }

            if (data.type === "code_chunk" && data.chunk) {
              const step = (data.step as GenStepId | undefined) ?? currentStepRef.current;
              if (step) {
                setState(prev => ({
                  ...prev,
                  stepCode: {
                    ...prev.stepCode,
                    [step]: (prev.stepCode[step] ?? "") + data.chunk,
                  },
                }));
              }
            }

            if (data.type === "code_ready") {
              setState(prev => ({
                ...prev,
                phase: "code_ready",
                startupName: data.startupName ?? prev.startupName,
                fileCount: data.fileCount ?? 0,
                filePaths: data.filePaths ?? [],
                steps: Object.fromEntries(
                  GEN_STEPS.map(s => [s.id, "done"])
                ) as Record<GenStepId, StepStatus>,
              }));
            }

            if (data.type === "cancelled") {
              setState(prev => ({ ...prev, phase: "cancelled" }));
            }

            if (data.type === "error") {
              setState(prev => ({ ...prev, phase: "error", error: data.message ?? "Build failed" }));
            }
          } catch {
            // skip bad JSON
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User stopped — cancel already handled in handleStop
        return;
      }
      setState(prev => ({
        ...prev,
        phase: "error",
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, [startupId, buildType]);

  useEffect(() => {
    void startBuild();
    return () => { abortRef.current?.abort(); };
  }, [startBuild]);

  // ── Stop generation ─────────────────────────────────────────────────────────

  const handleStop = async () => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, phase: "cancelled" }));
    // Signal server to cancel
    await fetch(`/api/startups/${startupId}/build/cancel`, { method: "POST" }).catch(() => null);
  };

  // ── Manual deploy (Riley) ────────────────────────────────────────────────────

  const handleDeploy = async () => {
    setState(prev => ({
      ...prev,
      phase: "deploying",
      deployState: { loading: true, githubUrl: "", liveUrl: "", error: null },
    }));

    try {
      const res = await fetch(`/api/startups/${startupId}/deploy`, { method: "POST" });
      const data = (await res.json()) as { githubUrl?: string; liveUrl?: string; error?: string };

      if (!res.ok) {
        setState(prev => ({
          ...prev,
          phase: "code_ready",
          deployState: { loading: false, githubUrl: "", liveUrl: "", error: data.error ?? "Deploy failed" },
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        phase: "live",
        deployState: {
          loading: false,
          githubUrl: data.githubUrl ?? "",
          liveUrl: data.liveUrl ?? "",
          error: null,
        },
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        phase: "code_ready",
        deployState: {
          loading: false,
          githubUrl: "",
          liveUrl: "",
          error: err instanceof Error ? err.message : "Deploy failed",
        },
      }));
    }
  };

  const primary = state.colors[1] ?? "#6366F1";
  const doneCount = Object.values(state.steps).filter(s => s === "done").length;
  const progress = (doneCount / GEN_STEPS.length) * 100;
  const isGenerating = state.phase === "generating";
  const isStopped = state.phase === "cancelled";

  // Final delivery screen
  if (state.phase === "live") {
    return (
      <DeliveryScreen
        startupName={state.startupName}
        liveUrl={state.deployState.liveUrl}
        githubUrl={state.deployState.githubUrl}
        fileCount={state.fileCount}
        bgUrl={state.bgUrl}
        primaryColor={primary}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      {/* Ambient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${primary}15, transparent 60%)` }}
      />

      {/* Nav */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: "#1F1F1F" }}
      >
        <span className="text-lg font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "#A3A3A3" }}>
            Building <span style={{ color: "#F5F5F5" }}>{state.startupName}</span>
          </span>
          <span
            className="text-xs rounded-full px-2.5 py-1 capitalize"
            style={{ background: `${primary}18`, color: primary, border: `1px solid ${primary}30` }}
          >
            {buildType}
          </span>
          {/* Stop button — only visible while generating */}
          <AnimatePresence>
            {isGenerating && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => void handleStop()}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
                style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.25)" }}
              >
                <Square size={10} fill="#EF4444" />
                Stop
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="relative z-10 w-full h-0.5" style={{ background: "#111111" }}>
        <motion.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${primary}, #818CF8)` }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Body */}
      <div className="relative z-10 flex flex-1 overflow-hidden">

        {/* LEFT: Step progress cards */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">

          {GEN_STEPS.map((step) => (
            <StepCard
              key={step.id}
              step={step}
              status={state.steps[step.id]}
              code={state.stepCode[step.id] ?? ""}
              primaryColor={primary}
            />
          ))}

          {/* Cancelled state */}
          <AnimatePresence>
            {state.phase === "cancelled" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border px-5 py-4 flex items-center gap-3"
                style={{ borderColor: "#2A2A2A", background: "#111111" }}
              >
                <Square size={16} style={{ color: "#525252" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#A3A3A3" }}>Generation stopped</p>
                  <a href={`/app/${startupId}`} className="text-xs" style={{ color: "#525252" }}>← Back to report</a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state */}
          <AnimatePresence>
            {state.phase === "error" && state.error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border px-5 py-4"
                style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)" }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "#EF4444" }} />
                  <div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "#EF4444" }}>Build failed</p>
                    <p className="text-xs font-mono break-all" style={{ color: "#A3A3A3" }}>{state.error}</p>
                    <p className="text-xs mt-2" style={{ color: "#525252" }}>Check the terminal for full error details.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Code ready — delivery card */}
          <AnimatePresence>
            {(state.phase === "code_ready" || state.phase === "deploying") && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-2xl border p-5"
                style={{ background: "#111111", borderColor: "#1F1F1F" }}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}
                  >
                    ✅
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#F5F5F5" }}>Code Generated Successfully</p>
                    <p className="text-xs" style={{ color: "#A3A3A3" }}>
                      {state.fileCount} files ready to ship
                    </p>
                  </div>
                </div>

                {/* Deploy error */}
                {state.deployState.error && (
                  <div className="rounded-lg border px-3 py-2 mb-3 text-xs" style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444", background: "rgba(239,68,68,0.06)" }}>
                    {state.deployState.error}
                  </div>
                )}

                {/* Deploy button */}
                <motion.button
                  whileHover={!state.deployState.loading ? { scale: 1.02 } : {}}
                  whileTap={!state.deployState.loading ? { scale: 0.97 } : {}}
                  onClick={() => void handleDeploy()}
                  disabled={state.deployState.loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold mb-3 disabled:opacity-60"
                  style={{
                    background: primary,
                    color: "#fff",
                    boxShadow: state.deployState.loading ? "none" : `0 0 24px ${primary}40`,
                  }}
                >
                  {state.deployState.loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Riley is deploying...
                    </>
                  ) : (
                    <>
                      <Rocket size={14} />
                      Push to GitHub &amp; Deploy to Vercel
                    </>
                  )}
                </motion.button>

                {/* File list */}
                <FileList paths={state.filePaths} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Brand preview panel */}
        <div
          className="w-80 hidden lg:flex flex-col shrink-0 border-l overflow-hidden"
          style={{ borderColor: "#1F1F1F" }}
        >
          <div
            className="px-4 py-2.5 border-b flex items-center gap-2 shrink-0"
            style={{ borderColor: "#1F1F1F", background: "#0D0D0D" }}
          >
            <Sparkles size={11} style={{ color: "#525252" }} />
            <span className="text-xs" style={{ color: "#525252" }}>Brand Preview</span>
          </div>

          <BrandPanel
            bgUrl={state.bgUrl}
            colors={state.colors}
            fonts={state.fonts}
            startupName={state.startupName}
            primaryColor={primary}
            jordanDone={state.steps.jordan === "done"}
          />
        </div>
      </div>
    </div>
  );
}

// ── StepCard ──────────────────────────────────────────────────────────────────

function StepCard({
  step, status, code, primaryColor,
}: {
  step: GenStep;
  status: StepStatus;
  code: string;
  primaryColor: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const isDone = status === "done";
  const isRunning = status === "running";
  const isWaiting = status === "waiting";
  const hasCode = code.length > 0;

  const statusColor = isDone ? "#10B981" : isRunning ? primaryColor : "#333333";
  const cardBg = isDone ? `${step.agentColor}06` : isRunning ? "#111111" : "#0D0D0D";
  const cardBorder = isDone ? `${step.agentColor}20` : isRunning ? `${primaryColor}25` : "#1A1A1A";

  return (
    <motion.div
      layout
      className="rounded-xl border overflow-hidden"
      style={{ background: cardBg, borderColor: cardBorder }}
      animate={{ borderColor: cardBorder }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Agent avatar */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 relative"
          style={{
            background: isWaiting ? "#1A1A1A" : `${step.agentColor}18`,
            border: `1px solid ${isWaiting ? "#222" : step.agentColor + "30"}`,
          }}
        >
          <span style={{ opacity: isWaiting ? 0.3 : 1 }}>{step.agentEmoji}</span>
          {isRunning && (
            <motion.div
              className="absolute inset-0 rounded-lg border-2"
              style={{ borderColor: step.agentColor }}
              animate={{ scale: [1, 1.2], opacity: [0.7, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-sm font-semibold"
              style={{ color: isWaiting ? "#333333" : "#F5F5F5" }}
            >
              {step.agent}
            </span>
            <span
              className="text-xs rounded-full px-2 py-0.5 font-medium"
              style={{
                background: isWaiting ? "#1A1A1A" : `${step.agentColor}15`,
                color: isWaiting ? "#333333" : step.agentColor,
              }}
            >
              {step.label}
            </span>
          </div>
          <p className="text-xs truncate" style={{ color: isWaiting ? "#2A2A2A" : "#525252" }}>
            {isDone ? "Done" : isRunning ? step.description : "Waiting..."}
          </p>
        </div>

        {/* Status */}
        <div className="shrink-0 flex items-center gap-2">
          {isDone && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
              <CheckCircle2 size={16} style={{ color: "#10B981" }} />
            </motion.div>
          )}
          {isRunning && <Loader2 size={14} className="animate-spin" style={{ color: primaryColor }} />}
          {isWaiting && <Circle size={14} style={{ color: "#1F1F1F" }} />}

          {/* Toggle code */}
          {hasCode && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
              style={{ color: "#525252", background: "#161616" }}
            >
              <FileCode2 size={10} />
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable code block */}
      <AnimatePresence>
        {expanded && hasCode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="border-t mx-0 px-4 py-3 overflow-auto"
              style={{ borderColor: "#1A1A1A", maxHeight: "260px" }}
            >
              <pre
                className="text-xs leading-relaxed whitespace-pre-wrap break-all"
                style={{
                  color: "#7C8B8B",
                  fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
                }}
              >
                {code.slice(0, 4000)}
                {code.length > 4000 && (
                  <span style={{ color: "#333" }}>{"\n\n... " + (code.length - 4000) + " more chars"}</span>
                )}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── BrandPanel ────────────────────────────────────────────────────────────────

function BrandPanel({
  bgUrl, colors, fonts, startupName, primaryColor, jordanDone,
}: {
  bgUrl: string | null;
  colors: string[];
  fonts: string[];
  startupName: string;
  primaryColor: string;
  jordanDone: boolean;
}) {
  if (!jordanDone || !bgUrl) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-4 p-6"
        style={{ background: "#0D0D0D" }}
      >
        <motion.div
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <Palette size={28} style={{ color: "#2A2A2A" }} />
        </motion.div>
        <p className="text-xs text-center" style={{ color: "#2A2A2A" }}>
          Jordan is generating
          <br />your brand identity...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto">
      {/* BG image hero */}
      <div
        className="relative flex flex-col items-center justify-center p-6 text-center shrink-0"
        style={{
          backgroundImage: `url(${bgUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "200px",
        }}
      >
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.85))" }} />
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs mb-3"
            style={{ background: `${primaryColor}25`, color: primaryColor, border: `1px solid ${primaryColor}40` }}
          >
            <Sparkles size={9} />
            Brand ready
          </motion.div>
          <h2 className="text-xl font-bold" style={{ color: "#FFFFFF", textShadow: "0 2px 16px rgba(0,0,0,0.8)" }}>
            {startupName}
          </h2>
        </div>
      </div>

      {/* Brand info cards */}
      <div className="p-4 flex flex-col gap-3">
        {/* Colors */}
        <div
          className="rounded-xl border p-3"
          style={{ background: "#0D0D0D", borderColor: "#1A1A1A" }}
        >
          <p className="text-xs mb-2 font-medium" style={{ color: "#525252" }}>Brand Colors</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-md border"
                  style={{ background: c, borderColor: "rgba(255,255,255,0.08)" }}
                />
                <span className="text-xs font-mono" style={{ color: "#525252" }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fonts */}
        <div
          className="rounded-xl border p-3"
          style={{ background: "#0D0D0D", borderColor: "#1A1A1A" }}
        >
          <p className="text-xs mb-2 font-medium" style={{ color: "#525252" }}>Typography</p>
          {fonts.map((f, i) => (
            <div key={i} className="flex items-center gap-2 mb-1 last:mb-0">
              <span
                className="text-xs rounded-full px-2 py-0.5"
                style={{ background: "#161616", color: "#A3A3A3" }}
              >
                {i === 0 ? "Display" : "Body"}
              </span>
              <span className="text-xs" style={{ color: "#F5F5F5" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── FileList ──────────────────────────────────────────────────────────────────

function FileList({ paths }: { paths: string[] }) {
  const [open, setOpen] = useState(false);
  if (paths.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs w-full py-1"
        style={{ color: "#525252" }}
      >
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {open ? "Hide" : "View"} {paths.length} generated files
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-lg border p-3 mt-1 max-h-40 overflow-y-auto"
              style={{ borderColor: "#1A1A1A", background: "#0D0D0D" }}
            >
              {paths.map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                  <FileCode2 size={10} style={{ color: "#333", flexShrink: 0 }} />
                  <span className="text-xs font-mono truncate" style={{ color: "#525252" }}>{p}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Delivery screen ────────────────────────────────────────────────────────────

function DeliveryScreen({
  startupName, liveUrl, githubUrl, fileCount, bgUrl, primaryColor,
}: {
  startupName: string; liveUrl: string; githubUrl: string;
  fileCount: number; bgUrl: string | null; primaryColor: string;
}) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#0A0A0A", color: "#F5F5F5" }}
    >
      {bgUrl && (
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.12 }}
        />
      )}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${primaryColor}12, transparent 70%)` }}
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <span className="text-xl font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        </motion.div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: `${primaryColor}18`,
            border: `2px solid ${primaryColor}40`,
            boxShadow: `0 0 60px ${primaryColor}30`,
          }}
        >
          <span className="text-4xl">🎉</span>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: "-0.03em" }}>
            {startupName} is live!
          </h1>
          <p className="text-sm mb-8" style={{ color: "#A3A3A3" }}>
            {fileCount} files generated, pushed to GitHub, deployed to Vercel.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col gap-3 mb-8"
        >
          {liveUrl && (
            <a
              href={liveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm font-semibold group"
              style={{ background: primaryColor, borderColor: primaryColor, color: "#fff", boxShadow: `0 0 30px ${primaryColor}40` }}
            >
              <Globe size={16} />
              <span className="flex-1 text-left">{liveUrl.replace("https://", "")}</span>
              <span className="text-xs opacity-70 group-hover:opacity-100">View Live →</span>
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm font-medium"
              style={{ background: "#111111", borderColor: "#1F1F1F", color: "#F5F5F5" }}
            >
              <GitBranch size={16} style={{ color: "#A3A3A3" }} />
              <span className="flex-1 text-left text-sm" style={{ color: "#A3A3A3" }}>
                {githubUrl.replace("https://github.com/", "")}
              </span>
              <ExternalLink size={12} style={{ color: "#525252" }} />
            </a>
          )}
          <a
            href="/app"
            className="flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm"
            style={{ borderColor: "#1F1F1F", color: "#A3A3A3" }}
          >
            <LayoutDashboard size={14} />
            Go to Dashboard
          </a>
        </motion.div>

        {!liveUrl && !githubUrl && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xs" style={{ color: "#525252" }}>
            Connect GitHub and add VERCEL_TOKEN to enable auto-deploy.
          </motion.p>
        )}
      </div>
    </div>
  );
}
