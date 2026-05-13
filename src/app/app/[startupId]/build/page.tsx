"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, Circle, Loader2,
  ChevronDown, ChevronUp,
  ExternalLink, Globe,
  Square, FileCode2, AlertCircle,
  Download, GitBranch, Rocket, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

type GenStepId =
  | "jordan"
  | "morgan_frontend"
  | "morgan_backend"
  | "morgan_review"
  | "riley_github"
  | "riley_deploy";

type StepStatus = "waiting" | "running" | "done" | "failed";
type Phase = "idle" | "running" | "stopped" | "complete" | "error";

interface StepDef {
  id: GenStepId;
  label: string;
  sublabel: string;
  agent: string;
  emoji: string;
  color: string;
  description: string;
}

interface SseEvent {
  type: string;
  step?: string;
  chunk?: string;
  data?: { bgUrl?: string; colors?: string[]; fonts?: string[] };
  startupName?: string;
  fileCount?: number;
  filePaths?: string[];
  message?: string;
}

interface BuildState {
  phase: Phase;
  steps: Record<GenStepId, StepStatus>;
  stepCode: Partial<Record<GenStepId, string>>;
  stepFiles: Partial<Record<GenStepId, string[]>>;
  startupName: string;
  industry: string | null;
  audience: string | null;
  colors: string[];
  fonts: string[];
  bgUrl: string | null;
  fileCount: number;
  filePaths: string[];
  error: string | null;
  deployError: string | null;
  githubUrl: string;
  liveUrl: string;
}

// ── Step definitions ──────────────────────────────────────────────────────────

const STEPS: StepDef[] = [
  {
    id: "jordan",
    label: "Brand Identity",
    sublabel: "Fal.ai Flux",
    agent: "Jordan",
    emoji: "🎨",
    color: "#F59E0B",
    description: "Generating brand assets, colors, and background image",
  },
  {
    id: "morgan_frontend",
    label: "Frontend",
    sublabel: "v0 API",
    agent: "Morgan",
    emoji: "⚙️",
    color: "#3B82F6",
    description: "Building landing page with v0",
  },
  {
    id: "morgan_backend",
    label: "Backend",
    sublabel: "Claude Sonnet",
    agent: "Morgan",
    emoji: "⚙️",
    color: "#3B82F6",
    description: "Generating API routes, database schema, Stripe payments",
  },
  {
    id: "morgan_review",
    label: "Self-Correction",
    sublabel: "Gemini Flash",
    agent: "Morgan",
    emoji: "✨",
    color: "#8B5CF6",
    description: "Reviewing and fixing code quality issues",
  },
  {
    id: "riley_github",
    label: "GitHub Push",
    sublabel: "GitHub API",
    agent: "Riley",
    emoji: "🚀",
    color: "#EF4444",
    description: "Pushing generated code to your repository",
  },
  {
    id: "riley_deploy",
    label: "Vercel Deploy",
    sublabel: "Vercel API",
    agent: "Riley",
    emoji: "🌐",
    color: "#EF4444",
    description: "Deploying to production on Vercel",
  },
];

const INITIAL_STEPS: Record<GenStepId, StepStatus> = {
  jordan: "waiting",
  morgan_frontend: "waiting",
  morgan_backend: "waiting",
  morgan_review: "waiting",
  riley_github: "waiting",
  riley_deploy: "waiting",
};

// ── Helper: extract file paths from code chunks ───────────────────────────────

function extractFilePaths(chunk: string): string[] {
  const paths: string[] = [];
  for (const m of chunk.matchAll(/"path"\s*:\s*"([^"]+\.[a-z]{2,4})"/g)) paths.push(m[1]);
  for (const m of chunk.matchAll(/^\/\/ ([\w/-]+\.[tj]sx?)$/gm)) paths.push(m[1]);
  return [...new Set(paths)];
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BuildPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const startupId = params.startupId as string;
  const buildType = searchParams.get("type") ?? "standard";

  const [state, setState] = useState<BuildState>({
    phase: "idle",
    steps: { ...INITIAL_STEPS },
    stepCode: {},
    stepFiles: {},
    startupName: "Your Startup",
    industry: null,
    audience: null,
    colors: ["#0A0A0A", "#6366F1", "#818CF8", "#C7D2FE"],
    fonts: ["Space Grotesk", "Inter"],
    bgUrl: null,
    fileCount: 0,
    filePaths: [],
    error: null,
    deployError: null,
    githubUrl: "",
    liveUrl: "",
  });

  const abortRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);
  const currentStepRef = useRef<GenStepId | null>(null);

  // ── Load brand from Supabase immediately ─────────────────────────────────────

  useEffect(() => {
    void (async () => {
      const [{ data: brain }, { data: startup }] = await Promise.all([
        supabase
          .from("company_brain")
          .select("startup_name, colors, fonts")
          .eq("startup_id", startupId)
          .maybeSingle(),
        supabase
          .from("startups")
          .select("name, industry, audience")
          .eq("id", startupId)
          .maybeSingle(),
      ]);

      setState(prev => {
        const rawFonts = (brain as { fonts?: string | null } | null)?.fonts;
        const parsedFonts = (() => {
          if (!rawFonts) return prev.fonts;
          try { return JSON.parse(rawFonts) as string[]; }
          catch { return [rawFonts]; }
        })();

        return {
          ...prev,
          startupName:
            (brain as { startup_name?: string | null } | null)?.startup_name ??
            (startup as { name?: string | null } | null)?.name ??
            prev.startupName,
          colors: (brain as { colors?: string[] | null } | null)?.colors ?? prev.colors,
          fonts: parsedFonts,
          industry: (startup as { industry?: string | null } | null)?.industry ?? null,
          audience: (startup as { audience?: string | null } | null)?.audience ?? null,
        };
      });
    })();
  }, [startupId]);

  // ── Build SSE ─────────────────────────────────────────────────────────────────

  const startBuild = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;

    const controller = new AbortController();
    abortRef.current = controller;
    setState(prev => ({ ...prev, phase: "running" }));

    try {
      const response = await fetch(
        `/api/startups/${startupId}/build?type=${buildType}`,
        { signal: controller.signal }
      );

      if (!response.ok || !response.body) {
        setState(prev => ({
          ...prev,
          phase: "error",
          error: `Server error ${response.status}`,
        }));
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
            const ev = JSON.parse(line.slice(6)) as SseEvent;

            if (ev.type === "step_start" && ev.step) {
              const step = ev.step as GenStepId;
              currentStepRef.current = step;
              setState(prev => ({ ...prev, steps: { ...prev.steps, [step]: "running" } }));
            }

            if (ev.type === "step_done" && ev.step) {
              const step = ev.step as GenStepId;
              setState(prev => ({
                ...prev,
                steps: { ...prev.steps, [step]: "done" },
                ...(ev.data?.colors ? { colors: ev.data.colors } : {}),
                ...(ev.data?.fonts ? { fonts: ev.data.fonts } : {}),
                ...(ev.data?.bgUrl ? { bgUrl: ev.data.bgUrl } : {}),
              }));
            }

            if (ev.type === "code_chunk" && ev.chunk) {
              const step = (ev.step as GenStepId | undefined) ?? currentStepRef.current;
              if (!step) continue;
              const files = extractFilePaths(ev.chunk);
              setState(prev => ({
                ...prev,
                stepCode: {
                  ...prev.stepCode,
                  [step]: (prev.stepCode[step] ?? "") + ev.chunk,
                },
                ...(files.length > 0 ? {
                  stepFiles: {
                    ...prev.stepFiles,
                    [step]: [...new Set([...(prev.stepFiles[step] ?? []), ...files])],
                  },
                } : {}),
              }));
            }

            if (ev.type === "code_ready") {
              setState(prev => ({
                ...prev,
                phase: "complete",
                startupName: ev.startupName ?? prev.startupName,
                fileCount: ev.fileCount ?? 0,
                filePaths: ev.filePaths ?? [],
                steps: {
                  ...prev.steps,
                  jordan: "done",
                  morgan_frontend: "done",
                  morgan_backend: "done",
                  morgan_review: "done",
                },
              }));
            }

            if (ev.type === "cancelled") {
              setState(prev => ({ ...prev, phase: "stopped" }));
            }

            if (ev.type === "error") {
              setState(prev => ({
                ...prev,
                phase: "error",
                error: ev.message ?? "Build failed",
              }));
            }
          } catch { /* skip bad JSON */ }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setState(prev => ({
        ...prev,
        phase: "error",
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, [startupId, buildType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void startBuild();
    return () => { abortRef.current?.abort(); };
  }, [startBuild]);

  // ── Actions ───────────────────────────────────────────────────────────────────

  const handleStop = async () => {
    abortRef.current?.abort();
    setState(prev => ({ ...prev, phase: "stopped" }));
    await fetch(`/api/startups/${startupId}/build/cancel`, { method: "POST" }).catch(() => null);
  };

  const handleResume = () => {
    startedRef.current = false;
    setState(prev => ({
      ...prev,
      phase: "idle",
      steps: { ...INITIAL_STEPS },
      stepCode: {},
      stepFiles: {},
      error: null,
    }));
    void startBuild();
  };

  const handleDeploy = async () => {
    setState(prev => ({
      ...prev,
      steps: { ...prev.steps, riley_github: "running" },
      deployError: null,
    }));

    try {
      const res = await fetch(`/api/startups/${startupId}/deploy`, { method: "POST" });
      const data = (await res.json()) as { githubUrl?: string; liveUrl?: string; error?: string };

      if (!res.ok) {
        setState(prev => ({
          ...prev,
          steps: { ...prev.steps, riley_github: "failed" },
          deployError: data.error ?? "Deploy failed",
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        steps: { ...prev.steps, riley_github: "done", riley_deploy: "running" },
        githubUrl: data.githubUrl ?? "",
      }));

      await new Promise(r => setTimeout(r, 1200));

      setState(prev => ({
        ...prev,
        steps: { ...prev.steps, riley_deploy: "done" },
        liveUrl: data.liveUrl ?? "",
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        steps: { ...prev.steps, riley_github: "failed" },
        deployError: err instanceof Error ? err.message : "Deploy failed",
      }));
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────────

  const primary = state.colors[1] ?? "#6366F1";
  const totalDone = Object.values(state.steps).filter(s => s === "done").length;
  const progress = Math.round((totalDone / STEPS.length) * 100);
  const isRunning = state.phase === "running";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "#0A0A0A", color: "#F5F5F5" }}
    >
      <TopBar
        startupName={state.startupName}
        buildType={buildType}
        progress={progress}
        isRunning={isRunning}
        primaryColor={primary}
        onStop={() => void handleStop()}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — 60% */}
        <div className="flex-[3] overflow-y-auto p-5 flex flex-col gap-3 min-w-0">

          {STEPS.map(step => (
            <StepCard
              key={step.id}
              step={step}
              status={state.steps[step.id]}
              code={state.stepCode[step.id] ?? ""}
              files={state.stepFiles[step.id] ?? []}
              primaryColor={primary}
            />
          ))}

          {/* Stopped */}
          <AnimatePresence>
            {state.phase === "stopped" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border px-5 py-4 flex items-center justify-between"
                style={{ borderColor: "#2A2A2A", background: "#111111" }}
              >
                <div className="flex items-center gap-3">
                  <Square size={15} style={{ color: "#525252" }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#A3A3A3" }}>Build stopped</p>
                    <Link href={`/app/${startupId}`} className="text-xs" style={{ color: "#525252" }}>
                      ← Back to report
                    </Link>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleResume}
                  className="text-xs rounded-lg px-3 py-1.5 font-semibold cursor-pointer"
                  style={{
                    background: `${primary}18`,
                    color: primary,
                    border: `1px solid ${primary}30`,
                  }}
                >
                  Resume Build
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
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
                    <p
                      className="text-xs font-mono break-all leading-relaxed"
                      style={{ color: "#A3A3A3" }}
                    >
                      {state.error}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delivery card */}
          <AnimatePresence>
            {state.phase === "complete" && (
              <DeliveryCard
                startupId={startupId}
                fileCount={state.fileCount}
                filePaths={state.filePaths}
                onDeploy={() => void handleDeploy()}
                deployError={state.deployError}
                githubUrl={state.githubUrl}
                liveUrl={state.liveUrl}
                rileyGithubStatus={state.steps.riley_github}
                rileyDeployStatus={state.steps.riley_deploy}
                primaryColor={primary}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Right panel — 40% */}
        <div
          className="hidden lg:flex flex-col flex-[2] border-l overflow-hidden"
          style={{ borderColor: "#1F1F1F" }}
        >
          <RightPanel
            colors={state.colors}
            fonts={state.fonts}
            bgUrl={state.bgUrl}
            startupName={state.startupName}
            industry={state.industry}
            audience={state.audience}
            jordanDone={state.steps.jordan === "done"}
            isRunning={isRunning}
            primaryColor={primary}
          />
        </div>
      </div>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────

function TopBar({
  startupName, buildType, progress, isRunning, primaryColor, onStop,
}: {
  startupName: string;
  buildType: string;
  progress: number;
  isRunning: boolean;
  primaryColor: string;
  onStop: () => void;
}) {
  return (
    <div className="shrink-0 border-b" style={{ borderColor: "#1F1F1F" }}>
      <div className="flex items-center gap-3 px-5 py-3.5">
        <span
          className="text-sm font-bold shrink-0"
          style={{ color: "#6366F1", letterSpacing: "-0.04em" }}
        >
          qrew
        </span>
        <div className="w-px h-4 shrink-0" style={{ background: "#1F1F1F" }} />

        <span className="text-sm font-semibold truncate" style={{ color: "#F5F5F5" }}>
          {startupName}
        </span>
        <span
          className="text-xs rounded-full px-2 py-0.5 capitalize shrink-0"
          style={{
            background: `${primaryColor}18`,
            color: primaryColor,
            border: `1px solid ${primaryColor}30`,
          }}
        >
          {buildType}
        </span>

        <span className="text-xs font-mono ml-auto shrink-0" style={{ color: "#525252" }}>
          {progress}%
        </span>

        <AnimatePresence>
          {isRunning && (
            <motion.button
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onStop}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 cursor-pointer"
              style={{
                background: "rgba(239,68,68,0.1)",
                color: "#EF4444",
                border: "1px solid rgba(239,68,68,0.22)",
              }}
            >
              <Square size={9} fill="#EF4444" />
              Stop Generation
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ background: "#111111" }}>
        <motion.div
          className="h-full"
          style={{
            background: `linear-gradient(to right, ${primaryColor}, #818CF8)`,
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ── StepCard ──────────────────────────────────────────────────────────────────

function StepCard({
  step, status, code, files, primaryColor,
}: {
  step: StepDef;
  status: StepStatus;
  code: string;
  files: string[];
  primaryColor: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const isDone = status === "done";
  const isRunning = status === "running";
  const isWaiting = status === "waiting";
  const isFailed = status === "failed";
  const hasContent = code.length > 0 || files.length > 0;

  const cardBg = isDone
    ? `${step.color}07`
    : isRunning
    ? "#111111"
    : isFailed
    ? "rgba(239,68,68,0.04)"
    : "#0D0D0D";

  const cardBorder = isDone
    ? `${step.color}22`
    : isRunning
    ? `${primaryColor}32`
    : isFailed
    ? "rgba(239,68,68,0.28)"
    : "#1A1A1A";

  const statusText = isDone
    ? "Complete"
    : isRunning
    ? step.description
    : isFailed
    ? "Failed"
    : "Waiting";

  return (
    <motion.div
      layout
      className="rounded-xl border overflow-hidden"
      style={{ background: cardBg, borderColor: cardBorder }}
      animate={{ borderColor: cardBorder }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Agent avatar */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 relative"
          style={{
            background: isWaiting ? "#161616" : `${step.color}18`,
            border: `1px solid ${isWaiting ? "#1E1E1E" : step.color + "35"}`,
          }}
        >
          <span style={{ opacity: isWaiting ? 0.2 : 1 }}>{step.emoji}</span>
          {isRunning && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2"
              style={{ borderColor: step.color }}
              animate={{ scale: [1, 1.25], opacity: [0.7, 0] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          )}
        </div>

        {/* Agent name + labels */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span
              className="text-sm font-semibold"
              style={{ color: isWaiting ? "#2A2A2A" : "#F5F5F5" }}
            >
              {step.agent}
            </span>
            <span
              className="text-xs rounded-full px-2 py-0.5 font-medium"
              style={{
                background: isWaiting ? "#161616" : `${step.color}15`,
                color: isWaiting ? "#2A2A2A" : step.color,
              }}
            >
              {step.label}
            </span>
            <span
              className="text-[10px] rounded-full px-2 py-0.5"
              style={{ background: "#161616", color: "#303030" }}
            >
              {step.sublabel}
            </span>
          </div>

          <p
            className="text-xs truncate"
            style={{ color: isWaiting ? "#1F1F1F" : isFailed ? "#EF4444" : "#525252" }}
          >
            {statusText}
            {isRunning && files.length > 0 && (
              <span style={{ color: "#6366F1", marginLeft: "8px" }}>
                {files.length} file{files.length !== 1 ? "s" : ""} detected
              </span>
            )}
          </p>
        </div>

        {/* Status icon + expand toggle */}
        <div className="shrink-0 flex items-center gap-2">
          {isDone && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 14 }}
            >
              <CheckCircle2 size={16} style={{ color: "#10B981" }} />
            </motion.div>
          )}
          {isRunning && (
            <Loader2 size={14} className="animate-spin" style={{ color: step.color }} />
          )}
          {isWaiting && <Circle size={14} style={{ color: "#1F1F1F" }} />}
          {isFailed && <AlertCircle size={14} style={{ color: "#EF4444" }} />}

          {hasContent && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors cursor-pointer"
              style={{ color: "#525252", background: "#161616" }}
            >
              <FileCode2 size={10} />
              {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable panel: file names + code preview */}
      <AnimatePresence>
        {expanded && hasContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t" style={{ borderColor: "#1A1A1A" }}>
              {/* File name chips */}
              {files.length > 0 && (
                <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
                  {files.slice(0, 24).map((f, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono rounded-md px-2 py-0.5"
                      style={{ background: "#161616", color: "#525252" }}
                    >
                      {f.split("/").pop()}
                    </span>
                  ))}
                  {files.length > 24 && (
                    <span className="text-[10px]" style={{ color: "#2D2D2D" }}>
                      +{files.length - 24} more
                    </span>
                  )}
                </div>
              )}

              {/* Code preview */}
              {code.length > 0 && (
                <div className="px-4 pb-3 overflow-auto" style={{ maxHeight: "240px" }}>
                  <pre
                    className="text-xs leading-relaxed whitespace-pre-wrap break-all"
                    style={{
                      color: "#3D4A4A",
                      fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
                    }}
                  >
                    {code.slice(0, 3500)}
                    {code.length > 3500 && (
                      <span style={{ color: "#2A2A2A" }}>
                        {"\n\n... +" + (code.length - 3500).toLocaleString() + " chars"}
                      </span>
                    )}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── DeliveryCard ──────────────────────────────────────────────────────────────

function DeliveryCard({
  startupId, fileCount, filePaths, onDeploy, deployError,
  githubUrl, liveUrl, rileyGithubStatus, rileyDeployStatus, primaryColor,
}: {
  startupId: string;
  fileCount: number;
  filePaths: string[];
  onDeploy: () => void;
  deployError: string | null;
  githubUrl: string;
  liveUrl: string;
  rileyGithubStatus: StepStatus;
  rileyDeployStatus: StepStatus;
  primaryColor: string;
}) {
  const isDeploying =
    rileyGithubStatus === "running" || rileyDeployStatus === "running";
  const isDeployed = rileyDeployStatus === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border p-5 mt-1"
      style={{
        background: "#111111",
        borderColor: "rgba(16,185,129,0.22)",
        boxShadow: "0 0 40px rgba(16,185,129,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 340, damping: 18, delay: 0.12 }}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{
            background: "rgba(16,185,129,0.12)",
            border: "1px solid rgba(16,185,129,0.25)",
          }}
        >
          ✅
        </motion.div>
        <div>
          <p className="text-sm font-bold" style={{ color: "#F5F5F5" }}>Code Generated</p>
          <p className="text-xs mt-0.5" style={{ color: "#A3A3A3" }}>
            {fileCount} files ready to ship
          </p>
        </div>
      </div>

      {/* Deploy error */}
      <AnimatePresence>
        {deployError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border px-3 py-2 mb-4 text-xs"
            style={{
              borderColor: "rgba(239,68,68,0.3)",
              color: "#EF4444",
              background: "rgba(239,68,68,0.06)",
            }}
          >
            {deployError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live links after deploy */}
      {isDeployed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 mb-4"
        >
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                background: "#10B981",
                borderColor: "#10B981",
                color: "#fff",
                boxShadow: "0 0 20px rgba(16,185,129,0.3)",
              }}
            >
              <Globe size={13} />
              <span className="flex-1 truncate text-sm">
                {liveUrl.replace("https://", "")}
              </span>
              <ExternalLink size={11} className="opacity-70" />
            </a>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm"
              style={{ background: "#0D0D0D", borderColor: "#1F1F1F", color: "#A3A3A3" }}
            >
              <GitBranch size={13} />
              <span className="flex-1 text-xs font-mono truncate">
                {githubUrl.replace("https://github.com/", "")}
              </span>
              <ExternalLink size={11} style={{ color: "#525252" }} />
            </a>
          )}
        </motion.div>
      )}

      {/* Action buttons */}
      {!isDeployed && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { window.location.href = `/api/startups/${startupId}/download`; }}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold border cursor-pointer"
            style={{ borderColor: "#1F1F1F", color: "#A3A3A3", background: "#0D0D0D" }}
          >
            <Download size={13} />
            Download ZIP
          </motion.button>

          <motion.button
            whileHover={!isDeploying ? { scale: 1.02 } : {}}
            whileTap={!isDeploying ? { scale: 0.97 } : {}}
            onClick={onDeploy}
            disabled={isDeploying}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold disabled:opacity-60 cursor-pointer"
            style={{
              background: primaryColor,
              color: "#fff",
              boxShadow: isDeploying ? "none" : `0 0 16px ${primaryColor}40`,
            }}
          >
            {isDeploying ? (
              <><Loader2 size={13} className="animate-spin" /> Deploying…</>
            ) : (
              <><Rocket size={13} /> Connect GitHub &amp; Deploy</>
            )}
          </motion.button>
        </div>
      )}

      {/* Generated file list */}
      {filePaths.length > 0 && <FileList paths={filePaths} />}

      <div className="pt-3 mt-3 border-t" style={{ borderColor: "#1A1A1A" }}>
        <Link href={`/app/${startupId}`} className="text-xs" style={{ color: "#525252" }}>
          ← Back to report
        </Link>
      </div>
    </motion.div>
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
        className="flex items-center gap-1.5 text-xs py-1 cursor-pointer"
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
              className="rounded-lg border p-3 mt-1 max-h-36 overflow-y-auto"
              style={{ borderColor: "#1A1A1A", background: "#0D0D0D" }}
            >
              {paths.map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                  <FileCode2 size={10} style={{ color: "#2D2D2D", flexShrink: 0 }} />
                  <span
                    className="text-xs font-mono truncate"
                    style={{ color: "#525252" }}
                  >
                    {p}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── RightPanel ────────────────────────────────────────────────────────────────

function RightPanel({
  colors, fonts, bgUrl, startupName, industry, audience,
  jordanDone, isRunning, primaryColor,
}: {
  colors: string[];
  fonts: string[];
  bgUrl: string | null;
  startupName: string;
  industry: string | null;
  audience: string | null;
  jordanDone: boolean;
  isRunning: boolean;
  primaryColor: string;
}) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden relative">
      {/* Header */}
      <div
        className="px-4 py-3 border-b flex items-center gap-2 shrink-0 relative z-10"
        style={{
          borderColor: "#1F1F1F",
          background: "rgba(10,10,10,0.7)",
          backdropFilter: "blur(8px)",
        }}
      >
        <Sparkles size={11} style={{ color: "#525252" }} />
        <span className="text-xs" style={{ color: "#525252" }}>Brand Preview</span>
        <AnimatePresence>
          {jordanDone && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-auto text-[10px] rounded-full px-2 py-0.5 font-medium"
              style={{
                background: "#10B98114",
                color: "#10B981",
                border: "1px solid #10B98122",
              }}
            >
              Brand ready
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Animated mesh gradient backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        <MeshGradient colors={colors} />
        <div
          className="absolute inset-0"
          style={{ background: "rgba(10,10,10,0.68)" }}
        />
        {/* BG image from Jordan/Fal.ai — layered on top of mesh */}
        <AnimatePresence>
          {jordanDone && bgUrl && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.14 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable content */}
      <div className="relative z-10 flex-1 overflow-y-auto p-5">

        {/* Startup name + tags */}
        <div className="mb-6 text-center">
          <motion.h2
            key={startupName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold mb-3"
            style={{ letterSpacing: "-0.03em", color: "#F5F5F5" }}
          >
            {startupName}
          </motion.h2>

          <div className="flex flex-wrap gap-1.5 justify-center">
            {industry && (
              <span
                className="text-xs rounded-full px-2.5 py-1"
                style={{
                  background: `${primaryColor}12`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}25`,
                }}
              >
                {industry}
              </span>
            )}
            {audience && (
              <span
                className="text-xs rounded-full px-2.5 py-1"
                style={{
                  background: "#1A1A1A",
                  color: "#A3A3A3",
                  border: "1px solid #1F1F1F",
                }}
              >
                {audience.length > 32 ? audience.slice(0, 32) + "…" : audience}
              </span>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mt-4">
            <p className="text-sm" style={{ color: "#525252" }}>
              {isRunning
                ? "Building your startup"
                : jordanDone
                ? "Brand identity ready"
                : "Preparing brand…"}
            </p>
            {isRunning && <AnimatedDots />}
          </div>
        </div>

        {/* Brand colors */}
        <div
          className="rounded-xl border p-4 mb-3"
          style={{
            background: "rgba(13,13,13,0.85)",
            borderColor: "#1A1A1A",
            backdropFilter: "blur(8px)",
          }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: "#525252" }}>
            Brand Colors
          </p>
          <div className="flex flex-col gap-2.5">
            {colors.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <motion.div
                  className="w-8 h-8 rounded-lg shrink-0 border"
                  style={{ background: c, borderColor: "rgba(255,255,255,0.06)" }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.06, type: "spring", stiffness: 380 }}
                />
                <div>
                  <span
                    className="text-xs font-mono block"
                    style={{ color: "#A3A3A3" }}
                  >
                    {c}
                  </span>
                  <span className="text-[10px]" style={{ color: "#525252" }}>
                    {["Background", "Primary", "Secondary", "Accent"][i] ?? "Color"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Typography */}
        <div
          className="rounded-xl border p-4"
          style={{
            background: "rgba(13,13,13,0.85)",
            borderColor: "#1A1A1A",
            backdropFilter: "blur(8px)",
          }}
        >
          <p className="text-xs font-medium mb-3" style={{ color: "#525252" }}>
            Typography
          </p>
          <div className="flex flex-col gap-2.5">
            {fonts.map((f, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span
                  className="text-[10px] rounded-full px-2 py-0.5 shrink-0"
                  style={{ background: "#161616", color: "#525252" }}
                >
                  {i === 0 ? "Display" : "Body"}
                </span>
                <span className="text-sm font-medium" style={{ color: "#F5F5F5" }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MeshGradient ──────────────────────────────────────────────────────────────

function MeshGradient({ colors }: { colors: string[] }) {
  const c1 = colors[1] ?? "#6366F1";
  const c2 = colors[2] ?? "#818CF8";
  const c3 = colors[3] ?? "#C7D2FE";

  return (
    <>
      <motion.div
        className="absolute rounded-full blur-[90px]"
        style={{
          width: "80%",
          height: "80%",
          background: c1,
          opacity: 0.42,
          top: "-25%",
          left: "-15%",
        }}
        animate={{ top: ["-25%", "5%", "-25%"], left: ["-15%", "5%", "-15%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full blur-[80px]"
        style={{
          width: "65%",
          height: "65%",
          background: c2,
          opacity: 0.32,
          top: "35%",
          right: "-18%",
        }}
        animate={{ top: ["35%", "55%", "35%"], right: ["-18%", "-5%", "-18%"] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />
      <motion.div
        className="absolute rounded-full blur-[110px]"
        style={{
          width: "75%",
          height: "75%",
          background: c3,
          opacity: 0.18,
          bottom: "-30%",
          left: "15%",
        }}
        animate={{ bottom: ["-30%", "-10%", "-30%"], left: ["15%", "28%", "15%"] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
    </>
  );
}

// ── AnimatedDots ──────────────────────────────────────────────────────────────

function AnimatedDots() {
  return (
    <div className="flex gap-0.5 items-center">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="inline-block w-1 h-1 rounded-full"
          style={{ background: "#525252" }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
