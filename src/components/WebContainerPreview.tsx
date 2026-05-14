"use client";

import { useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import type { FileSystemTree } from "@webcontainer/api";
import { RefreshCw, ExternalLink, AlertCircle, Download, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Singleton ─────────────────────────────────────────────────────────────────

let wcInstance: WebContainer | null = null;
let wcBootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (wcInstance) return wcInstance;
  if (wcBootPromise) return wcBootPromise;
  wcBootPromise = WebContainer.boot().then(wc => {
    wcInstance = wc;
    return wc;
  });
  return wcBootPromise;
}

// ── File tree builder ─────────────────────────────────────────────────────────

export type FileEntry = { path: string; content: string };

function buildFileTree(files: FileEntry[]): FileSystemTree {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tree: Record<string, any> = {};

  for (const { path, content } of files) {
    const parts = path.replace(/^\//, "").split("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: Record<string, any> = tree;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!node[part]) node[part] = { directory: {} };
      node = node[part].directory;
    }

    node[parts[parts.length - 1]] = { file: { contents: content } };
  }

  return tree as FileSystemTree;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type BootStep = "booting" | "installing" | "starting" | "ready" | "error" | "timeout";

const STEP_LABELS: Record<BootStep, string> = {
  booting:    "Booting preview environment...",
  installing: "Installing dependencies... (this takes ~60 seconds)",
  starting:   "Starting dev server...",
  ready:      "Preview ready!",
  error:      "Preview unavailable",
  timeout:    "Preview timed out",
};

const STEP_ORDER: BootStep[] = ["booting", "installing", "starting"];

const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

// ── Component ─────────────────────────────────────────────────────────────────

interface WebContainerPreviewProps {
  files: FileEntry[];
  /** Optional URL for the Download ZIP fallback button shown on error/timeout */
  downloadUrl?: string;
}

export function WebContainerPreview({ files, downloadUrl }: WebContainerPreviewProps) {
  const [step, setStep] = useState<BootStep>("booting");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const iframeRef    = useRef<HTMLIFrameElement>(null);
  const startedRef   = useRef(false);
  const timedOutRef  = useRef(false);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    // Start 3-minute hard timeout
    timeoutIdRef.current = setTimeout(() => {
      timedOutRef.current = true;
      setStep("timeout");
    }, TIMEOUT_MS);

    void (async () => {
      try {
        setStep("booting");
        const wc = await getWebContainer();

        if (timedOutRef.current) return;

        setStep("installing");
        await wc.mount(buildFileTree(files));

        const install = await wc.spawn("npm", ["install"]);
        const installExit = await install.exit;
        if (timedOutRef.current) return;
        if (installExit !== 0) throw new Error("npm install failed");

        setStep("starting");
        if (timedOutRef.current) return;
        await wc.spawn("npm", ["run", "dev"]);

        wc.on("server-ready", (_port, url) => {
          if (timedOutRef.current) return;
          clearTimeout(timeoutIdRef.current!);
          setPreviewUrl(url);
          setStep("ready");
        });
      } catch (err) {
        clearTimeout(timeoutIdRef.current!);
        // Don't overwrite a timeout that already fired
        if (timedOutRef.current) return;
        setStep("error");
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      }
    })();

    return () => {
      clearTimeout(timeoutIdRef.current!);
    };
  }, []); // intentionally empty — boot once per mount

  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  };

  const currentStepIdx = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);
  const isFailed = step === "error" || step === "timeout";

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div
        className="shrink-0 flex items-center gap-2 px-3 py-2 border-b"
        style={{ background: "#0D0D0D", borderColor: "#1F1F1F" }}
      >
        {/* URL bar */}
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-mono"
          style={{
            background: "#161616",
            color: "#525252",
            border: "1px solid #1F1F1F",
            flex: "0 0 auto",
            minWidth: 0,
          }}
        >
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{
              background: step === "ready" ? "#10B981" : isFailed ? "#EF4444" : "#525252",
            }}
          />
          localhost:3000
        </div>

        {/* Badge */}
        <span
          className="flex-1 text-[10px] rounded-full px-2 py-0.5 text-center whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ background: "#1A1A1A", color: "#525252", border: "1px solid #222" }}
        >
          Preview — auth &amp; payments require deployment
        </span>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={step !== "ready"}
          className="p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          style={{ color: "#525252", background: "#161616" }}
          title="Refresh"
        >
          <RefreshCw size={12} />
        </button>

        {/* Open in new tab */}
        <button
          onClick={() => previewUrl && window.open(previewUrl, "_blank")}
          disabled={!previewUrl}
          className="p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-40 shrink-0"
          style={{ color: "#525252", background: "#161616" }}
          title="Open in new tab"
        >
          <ExternalLink size={12} />
        </button>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 relative overflow-hidden" style={{ background: "#0A0A0A" }}>
        {/* Loading / error / timeout overlay */}
        <AnimatePresence>
          {step !== "ready" && (
            <motion.div
              key="loading"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10 px-6"
              style={{ background: "#0A0A0A" }}
            >
              {step === "timeout" ? (
                <TimeoutState downloadUrl={downloadUrl} />
              ) : step === "error" ? (
                <ErrorState errorMsg={errorMsg} downloadUrl={downloadUrl} />
              ) : (
                <LoadingState step={step} currentStepIdx={currentStepIdx} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* iframe */}
        {previewUrl && (
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="absolute inset-0 w-full h-full border-0"
            allow="cross-origin-isolated"
            title="Live Preview"
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-states ────────────────────────────────────────────────────────────────

function LoadingState({
  step,
  currentStepIdx,
}: {
  step: BootStep;
  currentStepIdx: number;
}) {
  return (
    <>
      {/* Step dots */}
      <div className="flex gap-2 items-center">
        {STEP_ORDER.map((s, i) => {
          const isActive = currentStepIdx === i;
          const isDone   = currentStepIdx > i;
          return (
            <motion.div
              key={s}
              className="w-2 h-2 rounded-full"
              style={{
                background: isDone ? "#10B981" : isActive ? "#6366F1" : "#1F1F1F",
              }}
              animate={
                isActive
                  ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }
                  : {}
              }
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            />
          );
        })}
      </div>

      <p className="text-sm text-center" style={{ color: "#A3A3A3" }}>
        {STEP_LABELS[step]}
      </p>
    </>
  );
}

function ErrorState({
  errorMsg,
  downloadUrl,
}: {
  errorMsg: string | null;
  downloadUrl?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 max-w-xs text-center">
      <AlertCircle size={28} style={{ color: "#EF4444" }} />

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium" style={{ color: "#EF4444" }}>
          Preview unavailable
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#525252" }}>
          Download ZIP to run locally with{" "}
          <code
            className="rounded px-1 py-0.5"
            style={{ background: "#161616", color: "#A3A3A3", fontSize: "10px" }}
          >
            npm install &amp;&amp; npm run dev
          </code>
        </p>
        {errorMsg && (
          <p
            className="text-[10px] font-mono mt-1 rounded-lg px-3 py-1.5"
            style={{ background: "#161616", color: "#525252", border: "1px solid #1A1A1A" }}
          >
            {errorMsg}
          </p>
        )}
      </div>

      <DownloadButton downloadUrl={downloadUrl} />
    </div>
  );
}

function TimeoutState({ downloadUrl }: { downloadUrl?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 max-w-xs text-center">
      <Clock size={28} style={{ color: "#F59E0B" }} />

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium" style={{ color: "#F59E0B" }}>
          Preview timed out
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#525252" }}>
          Your code is ready — download ZIP to run locally
        </p>
      </div>

      <DownloadButton downloadUrl={downloadUrl} />
    </div>
  );
}

function DownloadButton({ downloadUrl }: { downloadUrl?: string }) {
  if (!downloadUrl) return null;

  return (
    <motion.a
      href={downloadUrl}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold"
      style={{
        background: "#111111",
        color: "#A3A3A3",
        border: "1px solid #1F1F1F",
        boxShadow: "0 0 16px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#2A2A2A";
        e.currentTarget.style.color = "#F5F5F5";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "#1F1F1F";
        e.currentTarget.style.color = "#A3A3A3";
      }}
    >
      <Download size={13} />
      Download ZIP
    </motion.a>
  );
}
