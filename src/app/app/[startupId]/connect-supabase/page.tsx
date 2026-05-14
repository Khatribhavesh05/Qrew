"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Globe, ArrowRight, Loader2, AlertCircle } from "lucide-react";

interface Project {
  id: string;
  name: string;
  region: string;
}

export default function ConnectSupabasePage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const startupId    = params.startupId as string;

  const projectsRaw = searchParams.get("projects") ?? "[]";
  const projects: Project[] = (() => {
    try { return JSON.parse(decodeURIComponent(projectsRaw)) as Project[]; }
    catch { return []; }
  })();

  const [selected, setSelected] = useState<string | null>(
    projects.length === 1 ? projects[0].id : null
  );
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/startups/${startupId}/supabase-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectRef: selected }),
      });
      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok) throw new Error(data.error ?? "Failed to fetch API keys");
      router.push(`/app/${startupId}/build?supabase=connected`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "#0A0A0A", color: "#F5F5F5" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <p className="text-center text-sm font-bold mb-8" style={{ color: "#6366F1", letterSpacing: "-0.04em" }}>
          qrew
        </p>

        {/* Header */}
        <h1 className="text-2xl font-bold text-center mb-2" style={{ letterSpacing: "-0.03em" }}>
          Choose your Supabase project
        </h1>
        <p className="text-sm text-center mb-8" style={{ color: "#525252" }}>
          Qrew will pull the API keys automatically — no copy-paste needed
        </p>

        {projects.length === 0 ? (
          /* No projects */
          <div
            className="rounded-xl border p-6 text-center"
            style={{ borderColor: "#1F1F1F", background: "#111111" }}
          >
            <Globe size={28} className="mx-auto mb-3" style={{ color: "#2A2A2A" }} />
            <p className="text-sm font-medium mb-1" style={{ color: "#A3A3A3" }}>
              No projects found
            </p>
            <p className="text-xs mb-4" style={{ color: "#525252" }}>
              Create a project in your Supabase dashboard first.
            </p>
            <a
              href="https://supabase.com/dashboard/new/new-project"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
              style={{ background: "#6366F1", color: "#fff" }}
            >
              Create project <ArrowRight size={12} />
            </a>
          </div>
        ) : (
          <>
            {/* Project list */}
            <div className="flex flex-col gap-2 mb-5">
              {projects.map((p, i) => {
                const isSelected = selected === p.id;
                return (
                  <motion.button
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelected(p.id)}
                    className="flex items-center gap-4 rounded-xl border p-4 text-left cursor-pointer transition-all"
                    style={{
                      borderColor: isSelected ? "rgba(99,102,241,0.5)" : "#1F1F1F",
                      background:  isSelected ? "rgba(99,102,241,0.08)" : "#111111",
                      boxShadow:   isSelected ? "0 0 0 1px rgba(99,102,241,0.4)" : "none",
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: isSelected ? "rgba(99,102,241,0.15)" : "#1A1A1A",
                        border: `1px solid ${isSelected ? "rgba(99,102,241,0.3)" : "#222"}`,
                      }}
                    >
                      <Globe size={18} style={{ color: isSelected ? "#818CF8" : "#525252" }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: isSelected ? "#F5F5F5" : "#A3A3A3" }}
                      >
                        {p.name}
                      </p>
                      <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: "#525252" }}>
                        {p.id} · {p.region}
                      </p>
                    </div>

                    {/* Checkmark */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 14 }}
                        >
                          <CheckCircle2 size={18} style={{ color: "#6366F1", flexShrink: 0 }} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 rounded-lg border px-3 py-2.5 mb-4 text-xs"
                  style={{ borderColor: "rgba(239,68,68,0.3)", color: "#EF4444", background: "rgba(239,68,68,0.06)" }}
                >
                  <AlertCircle size={13} className="shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirm button */}
            <motion.button
              whileHover={selected && !loading ? { scale: 1.02 } : {}}
              whileTap={selected && !loading ? { scale: 0.98 } : {}}
              onClick={() => void handleConfirm()}
              disabled={!selected || loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:  "#6366F1",
                color:       "#fff",
                boxShadow:   selected && !loading ? "0 0 24px rgba(99,102,241,0.3)" : "none",
              }}
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> Fetching keys…</>
              ) : (
                <>Use this project <ArrowRight size={15} /></>
              )}
            </motion.button>

            <p className="text-center text-[10px] mt-4" style={{ color: "#2A2A2A" }}>
              We only read your project&apos;s API keys. We never modify your Supabase data.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
