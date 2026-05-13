"use client";

import { useEffect, useRef, useState } from "react";
import { WebContainer } from "@webcontainer/api";
import type { FileSystemTree } from "@webcontainer/api";
import { RefreshCw, ExternalLink, AlertCircle } from "lucide-react";
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

type BootStep = "booting" | "installing" | "starting" | "ready" | "error";

const STEP_LABELS: Record<BootStep, string> = {
  booting: "Booting preview environment...",
  installing: "Installing dependencies...",
  starting: "Starting dev server...",
  ready: "Preview ready!",
  error: "Preview failed to start",
};

const STEP_ORDER: BootStep[] = ["booting", "installing", "starting"];

// ── Component ─────────────────────────────────────────────────────────────────

export function WebContainerPreview({ files }: { files: FileEntry[] }) {
  const [step, setStep] = useState<BootStep>("booting");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        setStep("booting");
        const wc = await getWebContainer();

        setStep("installing");
        await wc.mount(buildFileTree(files));

        const install = await wc.spawn("npm", ["install"]);
        const installExit = await install.exit;
        if (installExit !== 0) throw new Error("npm install failed");

        setStep("starting");
        await wc.spawn("npm", ["run", "dev"]);

        wc.on("server-ready", (_port, url) => {
          setPreviewUrl(url);
          setStep("ready");
        });
      } catch (err) {
        setStep("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    })();
  }, []); // intentionally empty — boot once per page

  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  };

  const currentStepIdx = STEP_ORDER.indexOf(step as (typeof STEP_ORDER)[number]);

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
            style={{ background: step === "ready" ? "#10B981" : "#525252" }}
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
        {/* Loading / error overlay */}
        <AnimatePresence>
          {step !== "ready" && (
            <motion.div
              key="loading"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.5 } }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10"
              style={{ background: "#0A0A0A" }}
            >
              {step === "error" ? (
                <div className="flex flex-col items-center gap-3">
                  <AlertCircle size={28} style={{ color: "#EF4444" }} />
                  <p className="text-sm font-medium" style={{ color: "#EF4444" }}>
                    Preview failed
                  </p>
                  {error && (
                    <p
                      className="text-xs font-mono max-w-xs text-center px-4"
                      style={{ color: "#525252" }}
                    >
                      {error}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Step dots */}
                  <div className="flex gap-2 items-center">
                    {STEP_ORDER.map((s, i) => {
                      const isActive = currentStepIdx === i;
                      const isDone = currentStepIdx > i;
                      return (
                        <motion.div
                          key={s}
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: isDone
                              ? "#10B981"
                              : isActive
                              ? "#6366F1"
                              : "#1F1F1F",
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

                  <p className="text-sm" style={{ color: "#A3A3A3" }}>
                    {STEP_LABELS[step]}
                  </p>
                </>
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
