"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, Pencil } from "lucide-react";

type Phase = "reading" | "naming" | "confirming";

interface ExtractedData {
  name: string;
  industry: string;
  audience: string;
  customer_type: string;
  revenue_model: string;
  brand_vibe: string;
}

const READING_STEPS = [
  "Reading your idea…",
  "Analyzing the market…",
  "Identifying your audience…",
  "Extracting brand signals…",
  "Naming your startup…",
];

export default function ProcessPage() {
  const router = useRouter();
  const params = useParams();
  const startupId = params.startupId as string;

  const [phase, setPhase] = useState<Phase>("reading");
  const [stepIndex, setStepIndex] = useState(0);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [customName, setCustomName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const runExtraction = useCallback(async () => {
    // Cycle through reading steps while waiting
    const interval = setInterval(() => {
      setStepIndex((i) => (i + 1) % READING_STEPS.length);
    }, 900);

    try {
      const res = await fetch("/api/process-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId }),
      });

      clearInterval(interval);

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "Processing failed");
        return;
      }

      const json = (await res.json()) as { extracted: ExtractedData };
      setExtracted(json.extracted);
      setCustomName(json.extracted.name);
      setPhase("naming");
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [startupId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void runExtraction();
  }, [runExtraction]);

  const handleKeepName = async () => {
    setConfirming(true);
    await updateStatus("team_assembly");
    router.push(`/app/${startupId}/team`);
  };

  const handleChangeName = () => setEditingName(true);

  const handleSaveName = async () => {
    if (!customName.trim()) return;
    setConfirming(true);

    await fetch("/api/process-idea/rename", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId, name: customName.trim() }),
    });

    // Update the extracted name locally, go back to confirmation screen
    setExtracted((prev) => prev ? { ...prev, name: customName.trim() } : prev);
    setEditingName(false);
    setConfirming(false);
  };

  const updateStatus = async (status: string) => {
    await fetch("/api/startups/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId, status }),
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#0A0A0A", color: "#F5F5F5" }}
    >
      {/* Ambient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.1), transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span
            className="text-2xl font-bold"
            style={{ color: "#6366F1", letterSpacing: "-0.04em" }}
          >
            qrew
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ── Phase: Reading ── */}
          {phase === "reading" && (
            <motion.div
              key="reading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "#111111", border: "1px solid #1F1F1F" }}
              >
                <Loader2 size={24} className="animate-spin" style={{ color: "#6366F1" }} />
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-lg font-medium"
                  style={{ color: "#F5F5F5" }}
                >
                  {READING_STEPS[stepIndex]}
                </motion.p>
              </AnimatePresence>

              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "#6366F1" }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Phase: Naming — keep or rename ── */}
          {phase === "naming" && extracted && (
            <motion.div
              key="naming"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl border p-8"
              style={{ background: "#111111", borderColor: "#1F1F1F" }}
            >
              {!editingName ? (
                <>
                  <div className="flex flex-col items-center gap-4 text-center mb-8">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold"
                      style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1" }}
                    >
                      {extracted.name[0]}
                    </div>
                    <div>
                      <p className="text-sm mb-2" style={{ color: "#A3A3A3" }}>
                        We&apos;ll call it
                      </p>
                      <h2
                        className="text-3xl font-bold tracking-tight"
                        style={{ color: "#F5F5F5", letterSpacing: "-0.03em" }}
                      >
                        {extracted.name}
                      </h2>
                      <p className="text-sm mt-2" style={{ color: "#525252" }}>
                        {extracted.industry} · {extracted.customer_type}
                      </p>
                    </div>
                  </div>

                  {/* Extracted signals */}
                  <div className="flex flex-col gap-2 mb-8">
                    {[
                      { label: "Audience", value: extracted.audience },
                      { label: "Revenue", value: extracted.revenue_model },
                      { label: "Vibe",    value: extracted.brand_vibe },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ background: "#161616", border: "1px solid #1A1A1A" }}
                      >
                        <span className="text-xs" style={{ color: "#525252" }}>{label}</span>
                        <span className="text-xs font-medium" style={{ color: "#A3A3A3" }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleKeepName}
                      disabled={confirming}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-50"
                      style={{ background: "#6366F1", boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}
                    >
                      {confirming ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      Keep Name
                    </motion.button>
                    <button
                      onClick={handleChangeName}
                      className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm transition-all"
                      style={{ borderColor: "#2A2A2A", color: "#A3A3A3" }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
                    >
                      <Pencil size={13} />
                      Change
                    </button>
                  </div>
                </>
              ) : (
                /* Edit name */
                <div className="flex flex-col gap-5">
                  <div>
                    <h2 className="text-lg font-semibold mb-1" style={{ color: "#F5F5F5" }}>
                      What should we call it?
                    </h2>
                    <p className="text-sm" style={{ color: "#A3A3A3" }}>
                      Pick something catchy and domain-friendly
                    </p>
                  </div>
                  <input
                    autoFocus
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") void handleSaveName(); }}
                    placeholder="e.g. FitMom, LaunchPad, Pocketo…"
                    className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition-colors"
                    style={{ borderColor: "#2A2A2A", color: "#F5F5F5" }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
                  />
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveName}
                      disabled={!customName.trim() || confirming}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
                      style={{ background: "#6366F1", boxShadow: "0 0 20px rgba(99,102,241,0.35)" }}
                    >
                      {confirming ? <Loader2 size={14} className="animate-spin" /> : null}
                      Save Name
                    </motion.button>
                    <button
                      onClick={() => setEditingName(false)}
                      className="rounded-xl border px-4 py-3 text-sm transition-all"
                      style={{ borderColor: "#2A2A2A", color: "#A3A3A3" }}
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 rounded-xl border px-4 py-3 text-sm text-center"
            style={{ borderColor: "#EF4444", color: "#EF4444", background: "rgba(239,68,68,0.06)" }}
          >
            {error}
            <button
              onClick={() => { setError(null); setPhase("reading"); void runExtraction(); }}
              className="ml-3 underline"
            >
              Retry
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
