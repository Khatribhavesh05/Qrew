"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, AlertCircle, Globe, GitBranch,
  ExternalLink, LayoutDashboard, Rocket, FileCode2, Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ReportView } from "@/components/qrew/report-view";
import type { Startup, Build } from "@/types";

// ── helpers ────────────────────────────────────────────────────────────────────

/** All statuses that mean "reports done, ready to build" */
function isReady(s: Startup["status"]) {
  return s === "ready" || s === "report_ready";
}

/** All statuses that are still in early setup */
function isDraft(s: Startup["status"]) {
  return s === "draft" || s === "processing" || s === "naming" || s === "team_assembly";
}

/** All statuses that mean live / deployed */
function isDeployed(s: Startup["status"]) {
  return s === "deployed" || s === "live";
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StartupPage() {
  const params = useParams();
  const router = useRouter();
  const startupId = params.startupId as string;

  const [startup, setStartup] = useState<Startup | null>(null);
  const [latestBuild, setLatestBuild] = useState<Build | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return null; }

    const { data: s } = await supabase
      .from("startups")
      .select("*")
      .eq("id", startupId)
      .eq("user_id", user.id)
      .single();

    if (!s) { router.push("/app"); return null; }

    const startup = s as Startup;
    setStartup(startup);

    // Fetch latest build record for resume/progress info
    const { data: b } = await supabase
      .from("builds")
      .select("*")
      .eq("startup_id", startupId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (b) setLatestBuild(b as Build);
    setLoading(false);

    return startup;
  }, [startupId, router]);

  useEffect(() => {
    void fetchData().then((s) => {
      if (!s) return;

      // Poll every 5s for statuses that change automatically on the server
      const shouldPoll = isDraft(s.status) || s.status === "building";
      if (!shouldPoll) return;

      pollRef.current = setInterval(async () => {
        const fresh = await fetchData();
        // Stop polling once status leaves the auto-changing group
        if (fresh && !isDraft(fresh.status) && fresh.status !== "building") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 5000);
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#6366F1" }} />
      </div>
    );
  }

  if (!startup) return null;

  // ── Status-based rendering — NO redirects, same URL ─────────────────────────

  // draft / early setup
  if (isDraft(startup.status)) {
    return <DraftScreen startupId={startupId} />;
  }

  // Alex + Sam running (or we just landed here while generate is running)
  if (startup.status === "researching" || isReady(startup.status)) {
    return <ReportView startup={startup} />;
  }

  // Build SSE in progress
  if (startup.status === "building") {
    return (
      <BuildingScreen
        startupId={startupId}
        latestBuild={latestBuild}
        onRefresh={() => void fetchData()}
      />
    );
  }

  // Code generated, waiting for manual deploy
  if (startup.status === "built") {
    return (
      <BuiltScreen
        startup={startup}
        onDeployed={(githubUrl, liveUrl) => {
          setStartup(prev => prev ? { ...prev, status: "deployed", github_url: githubUrl, live_url: liveUrl } : prev);
        }}
      />
    );
  }

  // Deployed / live
  if (isDeployed(startup.status)) {
    return <DeployedScreen startup={startup} />;
  }

  // Error fallback
  return <ErrorScreen startupId={startupId} onRetry={() => void fetchData()} />;
}

// ── DraftScreen ────────────────────────────────────────────────────────────────

function DraftScreen({ startupId }: { startupId: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.1), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.08), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.1), transparent 60%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
      </div>
      <div className="relative z-10 text-center max-w-md">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 0 40px rgba(99,102,241,0.4)" }}
        >
          <Sparkles size={32} color="#fff" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-3" style={{ letterSpacing: "-0.02em" }}>Setting up your startup…</h2>
        <p className="text-base mb-8" style={{ color: "#9CA3AF" }}>
          Your team is being assembled. This takes about 30 seconds.
        </p>
        <a
          href={`/app/${startupId}/process`}
          className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-6 py-3"
          style={{ color: "#6366F1", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
        >
          Continue setup →
        </a>
      </div>
    </div>
  );
}

// ── BuildingScreen ─────────────────────────────────────────────────────────────

const STEP_LABELS: Record<string, { label: string; n: number }> = {
  jordan:          { label: "Brand identity",  n: 1 },
  morgan_frontend: { label: "Frontend code",   n: 2 },
  morgan_backend:  { label: "Backend code",    n: 3 },
  morgan_review:   { label: "Code review",     n: 4 },
};

function BuildingScreen({
  startupId, latestBuild, onRefresh,
}: {
  startupId: string;
  latestBuild: Build | null;
  onRefresh: () => void;
}) {
  const isRunning = latestBuild?.status === "running";
  const isInterrupted = latestBuild && (latestBuild.status === "error" || latestBuild.status === "cancelled");
  const stepInfo = latestBuild?.current_step ? STEP_LABELS[latestBuild.current_step] : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(243,146,11,0.1), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(251,191,36,0.08), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(243,146,11,0.1), transparent 60%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-xl font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6 backdrop-blur-sm"
          style={{ background: "rgba(17,17,17,0.8)", borderColor: "rgba(255,255,255,0.05)" }}
        >
          {isRunning ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Loader2 size={20} className="animate-spin" style={{ color: "#F59E0B" }} />
                <div>
                  <p className="text-base font-bold">Build in progress</p>
                  {stepInfo && (
                    <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
                      Step {stepInfo.n} of 4 — {stepInfo.label}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                Morgan is generating your codebase. Navigate to the build screen to watch live.
              </p>
              <a
                href={`/app/${startupId}/build?type=standard`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white"
                style={{ background: "#F59E0B", boxShadow: "0 0 24px rgba(243,146,11,0.4)" }}
              >
                <FileCode2 size={16} />
                Watch Build Live
              </a>
            </>
          ) : isInterrupted ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={20} style={{ color: "#EF4444" }} />
                <div>
                  <p className="text-base font-bold">Build was interrupted</p>
                  {stepInfo && (
                    <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
                      Stopped at step {stepInfo.n} — {stepInfo.label}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm mb-6" style={{ color: "#6B7280" }}>
                The build stopped before completing. Resume to start a new build.
              </p>
              <a
                href={`/app/${startupId}/build?type=standard`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white mb-3"
                style={{ background: "#6366F1", boxShadow: "0 0 24px rgba(99,102,241,0.4)" }}
              >
                <Rocket size={16} />
                Resume Build
              </a>
              <button
                onClick={onRefresh}
                className="w-full rounded-xl py-2.5 text-sm font-medium"
                style={{ color: "#6B7280", background: "rgba(255,255,255,0.03)" }}
              >
                Refresh status
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Loader2 size={20} className="animate-spin" style={{ color: "#6366F1" }} />
                <p className="text-base font-bold">Preparing build...</p>
              </div>
              <a
                href={`/app/${startupId}/build?type=standard`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-bold text-white"
                style={{ background: "#6366F1", boxShadow: "0 0 24px rgba(99,102,241,0.4)" }}
              >
                <Rocket size={16} />
                Start Build
              </a>
            </>
          )}
        </motion.div>

        <div className="text-center mt-6">
          <Link href="/app" className="text-sm font-medium" style={{ color: "#6B7280" }}>← Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

// ── BuiltScreen ────────────────────────────────────────────────────────────────

function BuiltScreen({
  startup, onDeployed,
}: {
  startup: Startup;
  onDeployed: (githubUrl: string, liveUrl: string) => void;
}) {
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [fileCount, setFileCount] = useState<number | null>(null);

  // Get file count from code_maps
  useEffect(() => {
    void supabase
      .from("code_maps")
      .select("file_map")
      .eq("startup_id", startup.id)
      .single()
      .then(({ data }) => {
        if (data?.file_map) {
          setFileCount(Object.keys(data.file_map as Record<string, unknown>).length);
        }
      });
  }, [startup.id]);

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployError(null);
    try {
      const res = await fetch(`/api/startups/${startup.id}/deploy`, { method: "POST" });
      const data = (await res.json()) as { githubUrl?: string; liveUrl?: string; error?: string };
      if (!res.ok) {
        setDeployError(data.error ?? "Deploy failed");
        setDeploying(false);
        return;
      }
      onDeployed(data.githubUrl ?? "", data.liveUrl ?? "");
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : "Deploy failed");
      setDeploying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.12), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(168,85,247,0.10), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.12), transparent 60%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-xl font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6 backdrop-blur-sm"
          style={{ background: "rgba(17,17,17,0.8)", borderColor: "rgba(139,92,246,0.3)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
            >
              ✅
            </div>
            <div>
              <p className="text-base font-bold" style={{ color: "#F5F5F5" }}>Code Generated</p>
              <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
                {fileCount !== null ? `${fileCount} files ready` : "Loading files..."} · {startup.name}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {deployError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border px-3 py-2 mb-4 text-sm"
                style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444", background: "rgba(239,68,68,0.06)" }}
              >
                {deployError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deploy button */}
          <motion.button
            whileHover={!deploying ? { scale: 1.02 } : {}}
            whileTap={!deploying ? { scale: 0.98 } : {}}
            onClick={() => void handleDeploy()}
            disabled={deploying}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-bold mb-3 disabled:opacity-60"
            style={{ background: "#8B5CF6", color: "#fff", boxShadow: deploying ? "none" : "0 0 30px rgba(139,92,246,0.5)" }}
          >
            {deploying ? <><Loader2 size={16} className="animate-spin" /> Deploying…</> : <><Rocket size={16} /> Push to GitHub & Deploy</>}
          </motion.button>

          {/* View build details */}
          <a
            href={`/app/${startup.id}/build?type=standard`}
            className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-medium"
            style={{ color: "#9CA3AF", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}
          >
            <FileCode2 size={14} />
            View generated code
          </a>
        </motion.div>

        <div className="text-center mt-6">
          <Link href="/app" className="text-sm font-medium" style={{ color: "#6B7280" }}>← Dashboard</Link>
        </div>
      </div>
    </div>
  );
}

// ── DeployedScreen (Company HQ) ────────────────────────────────────────────────

function DeployedScreen({ startup }: { startup: Startup }) {
  const primaryColor = "#10B981";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          animate={{
            background: [
              `radial-gradient(ellipse 70% 50% at 50% 30%, ${primaryColor}12, transparent 60%)`,
              `radial-gradient(ellipse 70% 50% at 50% 30%, ${primaryColor}10, transparent 60%)`,
              `radial-gradient(ellipse 70% 50% at 50% 30%, ${primaryColor}12, transparent 60%)`,
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="text-xl font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        </motion.div>

        {/* Success badge */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl"
          style={{ background: `${primaryColor}15`, border: `2px solid ${primaryColor}40`, boxShadow: `0 0 50px ${primaryColor}30` }}
        >
          🚀
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ letterSpacing: "-0.03em" }}>
            {startup.name ?? "Your startup"} is live
          </h1>
          <p className="text-base" style={{ color: "#9CA3AF" }}>
            {startup.industry ?? "Your company"} · Deployed on Vercel
          </p>
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex flex-col gap-3"
        >
          {startup.live_url && (
            <a
              href={startup.live_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border px-5 py-4 text-sm font-bold group"
              style={{ background: primaryColor, borderColor: primaryColor, color: "#fff", boxShadow: `0 0 30px ${primaryColor}50` }}
            >
              <Globe size={18} />
              <span className="flex-1 text-left truncate">{startup.live_url.replace("https://", "")}</span>
              <ExternalLink size={14} className="opacity-80 group-hover:opacity-100" />
            </a>
          )}

          {startup.github_url && (
            <a
              href={startup.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border px-5 py-4 text-sm font-medium transition-all backdrop-blur-sm"
              style={{ background: "rgba(17,17,17,0.6)", borderColor: "rgba(255,255,255,0.05)", color: "#F5F5F5" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
            >
              <GitBranch size={18} style={{ color: "#9CA3AF" }} />
              <span className="flex-1 text-left text-sm truncate" style={{ color: "#9CA3AF" }}>
                {startup.github_url.replace("https://github.com/", "")}
              </span>
              <ExternalLink size={14} style={{ color: "#6B7280" }} />
            </a>
          )}

          <Link
            href="/app"
            className="flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition-all"
            style={{ borderColor: "rgba(255,255,255,0.05)", color: "#9CA3AF", background: "rgba(255,255,255,0.02)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,0.05)"; }}
          >
            <LayoutDashboard size={16} />
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

// ── ErrorScreen ────────────────────────────────────────────────────────────────

function ErrorScreen({ startupId, onRetry }: { startupId: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      <AlertCircle size={40} style={{ color: "#EF4444" }} />
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
        <p className="text-base mb-8" style={{ color: "#9CA3AF" }}>
          This startup hit an error during processing.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={onRetry}
            className="w-full sm:w-auto rounded-xl px-6 py-3 text-sm font-bold text-white"
            style={{ background: "#6366F1", boxShadow: "0 0 24px rgba(99,102,241,0.4)" }}
          >
            Retry
          </button>
          <Link href="/app" className="w-full sm:w-auto rounded-xl border px-6 py-3 text-sm font-medium text-center" style={{ borderColor: "rgba(255,255,255,0.05)", color: "#9CA3AF" }}>
            Dashboard
          </Link>
        </div>
      </div>
      <p className="text-xs" style={{ color: "#4B5563" }}>ID: {startupId}</p>
    </div>
  );
}

// Made with Bob
