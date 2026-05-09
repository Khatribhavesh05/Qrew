"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, AlertCircle, Globe, GitBranch,
  ExternalLink, LayoutDashboard, Rocket, FileCode2,
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
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08), transparent 60%)" }} />
      <div className="relative z-10 text-center max-w-sm">
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl"
          style={{ background: "#111111", border: "1px solid #1F1F1F" }}
        >
          ⚙️
        </motion.div>
        <h2 className="text-lg font-bold mb-2" style={{ letterSpacing: "-0.02em" }}>Setting up your startup…</h2>
        <p className="text-sm mb-8" style={{ color: "#A3A3A3" }}>
          Your team is being assembled. This takes about 30 seconds.
        </p>
        <a
          href={`/app/${startupId}/process`}
          className="text-xs"
          style={{ color: "#6366F1" }}
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
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(243,146,11,0.08), transparent 60%)" }} />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-2">
          <span className="text-lg font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6 mt-6"
          style={{ background: "#111111", borderColor: "#1F1F1F" }}
        >
          {isRunning ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Loader2 size={18} className="animate-spin" style={{ color: "#F59E0B" }} />
                <div>
                  <p className="text-sm font-semibold">Build in progress</p>
                  {stepInfo && (
                    <p className="text-xs mt-0.5" style={{ color: "#A3A3A3" }}>
                      Step {stepInfo.n} of 4 — {stepInfo.label}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs mb-5" style={{ color: "#525252" }}>
                Morgan is generating your codebase. Navigate to the build screen to watch live.
              </p>
              <a
                href={`/app/${startupId}/build?type=standard`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-white"
                style={{ background: "#F59E0B", boxShadow: "0 0 20px rgba(243,146,11,0.3)" }}
              >
                <FileCode2 size={14} />
                Watch Build Live
              </a>
            </>
          ) : isInterrupted ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle size={18} style={{ color: "#EF4444" }} />
                <div>
                  <p className="text-sm font-semibold">Build was interrupted</p>
                  {stepInfo && (
                    <p className="text-xs mt-0.5" style={{ color: "#A3A3A3" }}>
                      Stopped at step {stepInfo.n} — {stepInfo.label}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs mb-5" style={{ color: "#525252" }}>
                The build stopped before completing. Resume to start a new build.
              </p>
              <a
                href={`/app/${startupId}/build?type=standard`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-white mb-2"
                style={{ background: "#6366F1", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
              >
                <Rocket size={14} />
                Resume Build
              </a>
              <button
                onClick={onRefresh}
                className="w-full rounded-xl py-2.5 text-xs"
                style={{ color: "#525252" }}
              >
                Refresh status
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-4">
                <Loader2 size={18} className="animate-spin" style={{ color: "#6366F1" }} />
                <p className="text-sm font-semibold">Preparing build...</p>
              </div>
              <a
                href={`/app/${startupId}/build?type=standard`}
                className="flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold text-white"
                style={{ background: "#6366F1" }}
              >
                <Rocket size={14} />
                Start Build
              </a>
            </>
          )}
        </motion.div>

        <div className="text-center mt-4">
          <a href="/app" className="text-xs" style={{ color: "#525252" }}>← Dashboard</a>
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
      <div className="pointer-events-none fixed inset-0" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(139,92,246,0.1), transparent 60%)" }} />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-lg font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border p-6"
          style={{ background: "#111111", borderColor: "#1F1F1F" }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)" }}
            >
              ✅
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: "#F5F5F5" }}>Code Generated</p>
              <p className="text-xs mt-0.5" style={{ color: "#A3A3A3" }}>
                {fileCount !== null ? `${fileCount} files ready` : "Loading files..."} · {startup.name}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {deployError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border px-3 py-2 mb-4 text-xs"
                style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444", background: "rgba(239,68,68,0.06)" }}
              >
                {deployError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deploy button */}
          <motion.button
            whileHover={!deploying ? { scale: 1.02 } : {}}
            whileTap={!deploying ? { scale: 0.97 } : {}}
            onClick={() => void handleDeploy()}
            disabled={deploying}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold mb-3 disabled:opacity-60"
            style={{ background: "#8B5CF6", color: "#fff", boxShadow: deploying ? "none" : "0 0 24px rgba(139,92,246,0.4)" }}
          >
            {deploying ? <><Loader2 size={14} className="animate-spin" /> Deploying…</> : <><Rocket size={14} /> Push to GitHub &amp; Deploy</>}
          </motion.button>

          {/* View build details */}
          <a
            href={`/app/${startup.id}/build?type=standard`}
            className="flex items-center justify-center gap-1.5 w-full rounded-xl py-2.5 text-xs"
            style={{ color: "#525252", border: "1px solid #1A1A1A" }}
          >
            <FileCode2 size={11} />
            View generated code
          </a>
        </motion.div>

        <div className="text-center mt-4">
          <a href="/app" className="text-xs" style={{ color: "#525252" }}>← Dashboard</a>
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
      <div className="pointer-events-none fixed inset-0" style={{ background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${primaryColor}10, transparent 60%)` }} />

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="text-lg font-bold" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>qrew</span>
        </motion.div>

        {/* Success badge */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 text-3xl"
          style={{ background: `${primaryColor}15`, border: `1px solid ${primaryColor}30`, boxShadow: `0 0 40px ${primaryColor}25` }}
        >
          🚀
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ letterSpacing: "-0.03em" }}>
            {startup.name ?? "Your startup"} is live
          </h1>
          <p className="text-sm" style={{ color: "#A3A3A3" }}>
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
              className="flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm font-semibold group"
              style={{ background: primaryColor, borderColor: primaryColor, color: "#fff", boxShadow: `0 0 24px ${primaryColor}40` }}
            >
              <Globe size={15} />
              <span className="flex-1 text-left truncate">{startup.live_url.replace("https://", "")}</span>
              <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
            </a>
          )}

          {startup.github_url && (
            <a
              href={startup.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border px-5 py-3.5 text-sm font-medium transition-all"
              style={{ background: "#111111", borderColor: "#1F1F1F", color: "#F5F5F5" }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#333"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1F1F1F"; }}
            >
              <GitBranch size={15} style={{ color: "#A3A3A3" }} />
              <span className="flex-1 text-left text-sm truncate" style={{ color: "#A3A3A3" }}>
                {startup.github_url.replace("https://github.com/", "")}
              </span>
              <ExternalLink size={12} style={{ color: "#525252" }} />
            </a>
          )}

          <a
            href="/app"
            className="flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm transition-all"
            style={{ borderColor: "#1F1F1F", color: "#525252" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#333"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "#1F1F1F"; }}
          >
            <LayoutDashboard size={14} />
            Back to Dashboard
          </a>
        </motion.div>
      </div>
    </div>
  );
}

// ── ErrorScreen ────────────────────────────────────────────────────────────────

function ErrorScreen({ startupId, onRetry }: { startupId: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      <AlertCircle size={32} style={{ color: "#EF4444" }} />
      <div className="text-center">
        <h2 className="text-lg font-bold mb-1">Something went wrong</h2>
        <p className="text-sm mb-6" style={{ color: "#A3A3A3" }}>
          This startup hit an error during processing.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={onRetry}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#6366F1" }}
          >
            Retry
          </button>
          <a href="/app" className="rounded-xl border px-4 py-2.5 text-sm" style={{ borderColor: "#1F1F1F", color: "#A3A3A3" }}>
            Dashboard
          </a>
        </div>
      </div>
      <p className="text-xs" style={{ color: "#333" }}>ID: {startupId}</p>
    </div>
  );
}
