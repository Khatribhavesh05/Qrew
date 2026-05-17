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

      // Built / deployed → go to Company HQ
      if (s.status === "built" || isDeployed(s.status)) {
        router.replace(`/app/${startupId}/hq`);
        return;
      }

      // Poll every 5s for statuses that change automatically on the server
      const shouldPoll = isDraft(s.status) || s.status === "building";
      if (!shouldPoll) return;

      pollRef.current = setInterval(async () => {
        const fresh = await fetchData();
        if (!fresh) return;
        // Redirect when build finishes
        if (fresh.status === "built" || isDeployed(fresh.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          router.replace(`/app/${startupId}/hq`);
          return;
        }
        // Stop polling once status leaves the auto-changing group
        if (!isDraft(fresh.status) && fresh.status !== "building") {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 5000);
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchData, startupId, router]);

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

  // Built / deployed — redirect to HQ (handled in useEffect; show spinner while redirecting)
  if (startup.status === "built" || isDeployed(startup.status)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#6366F1" }} />
      </div>
    );
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
