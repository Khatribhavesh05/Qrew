"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AddCompanyModalProps {
  onClose: () => void;
  prefillIdea?: string;
}

const EXAMPLES = [
  "A fitness app for busy moms who want 10-minute home workouts",
  "SaaS tool that auto-generates legal contracts for freelancers",
  "Marketplace connecting college students with local tutors",
];

export function AddCompanyModal({ onClose, prefillIdea }: AddCompanyModalProps) {
  const router = useRouter();
  const [idea, setIdea] = useState(prefillIdea ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleGo = async () => {
    const trimmed = idea.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      // Create a startup row with just the idea first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: startup, error: insertErr } = await supabase
        .from("startups")
        .insert({ user_id: user.id, idea: trimmed, status: "processing" })
        .select("id")
        .single();

      if (insertErr || !startup) {
        setError(insertErr?.message ?? "Failed to create startup");
        setLoading(false);
        return;
      }

      router.push(`/app/${(startup as { id: string }).id}/process`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-7"
        style={{ background: "#111111", borderColor: "#1F1F1F" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight" style={{ color: "#F5F5F5", letterSpacing: "-0.02em" }}>
              What&apos;s your startup idea?
            </h2>
            <p className="text-sm mt-1" style={{ color: "#A3A3A3" }}>
              Your AI team will research, build and launch it.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors"
            style={{ color: "#525252" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#525252")}
          >
            <X size={16} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleGo();
            }
          }}
          placeholder="Describe your startup idea in one sentence or more…"
          rows={4}
          className="w-full resize-none rounded-xl border bg-transparent px-4 py-3 text-sm leading-relaxed outline-none transition-colors"
          style={{ borderColor: "#2A2A2A", color: "#F5F5F5" }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#6366F1";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#2A2A2A";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        {/* Example chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setIdea(ex)}
              className="rounded-full border px-3 py-1 text-xs transition-all"
              style={{ borderColor: "#1F1F1F", color: "#525252", background: "#0D0D0D" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6366F1";
                e.currentTarget.style.color = "#A3A3A3";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#1F1F1F";
                e.currentTarget.style.color = "#525252";
              }}
            >
              {ex.length > 35 ? ex.slice(0, 35) + "…" : ex}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-xs mt-3" style={{ color: "#EF4444" }}>
            {error}
          </p>
        )}

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGo}
          disabled={!idea.trim() || loading}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{
            background: "#6366F1",
            boxShadow: idea.trim() && !loading ? "0 0 24px rgba(99,102,241,0.4)" : "none",
          }}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Starting…
            </>
          ) : (
            <>
              Let&apos;s Go
              <ArrowRight size={14} />
            </>
          )}
        </motion.button>
      </motion.div>
    </>
  );
}
