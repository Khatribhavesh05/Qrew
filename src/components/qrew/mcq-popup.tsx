"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, SkipForward, Pencil, Check, Sparkles } from "lucide-react";
import type { MCQ } from "@/app/api/startups/[startupId]/mcqs/route";

interface MCQPopupProps {
  mcq: MCQ;
  onAnswered: (field: string, value: string) => void;
  onSkipped: () => void;
}

const AGENT_COLORS: Record<string, string> = {
  alex:   "#6366F1",
  sam:    "#10B981",
  jordan: "#F59E0B",
};

const AGENT_LABELS: Record<string, string> = {
  alex:   "Alex · Research",
  sam:    "Sam · Strategy",
  jordan: "Jordan · Design",
};

const AGENT_EMOJIS: Record<string, string> = {
  alex:   "🔍",
  sam:    "📊",
  jordan: "🎨",
};

export function MCQPopup({ mcq, onAnswered, onSkipped }: MCQPopupProps) {
  const color = AGENT_COLORS[mcq.agent] ?? "#6366F1";
  const [freeText, setFreeText] = useState("");
  const [showFreeText, setShowFreeText] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleChoice = (choice: string) => {
    setSelected(choice);
    setTimeout(() => onAnswered(mcq.field, choice), 400);
  };

  const handleFreeTextSubmit = () => {
    const trimmed = freeText.trim();
    if (!trimmed) return;
    onAnswered(mcq.field, trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full rounded-2xl border p-6 backdrop-blur-sm relative overflow-hidden"
      style={{ background: "rgba(17,17,17,0.8)", borderColor: `${color}40`, boxShadow: `0 8px 32px ${color}15` }}
    >
      {/* Glow effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${color}08, transparent 70%)` }}
      />

      {/* Agent label */}
      <div className="relative z-10 flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ background: `${color}15`, border: `1px solid ${color}30` }}
          >
            {AGENT_EMOJIS[mcq.agent]}
          </motion.div>
          <div>
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full"
                style={{ background: color }}
              />
              <span className="text-sm font-bold" style={{ color }}>
                {AGENT_LABELS[mcq.agent]}
              </span>
            </div>
            <span className="text-xs" style={{ color: "#9CA3AF" }}>Asking a question</span>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSkipped}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors rounded-lg px-3 py-1.5"
          style={{ color: "#6B7280", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#9CA3AF")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7280")}
        >
          <SkipForward size={12} />
          Skip
        </motion.button>
      </div>

      {/* Question */}
      <p className="relative z-10 text-base font-bold mb-6 leading-relaxed" style={{ color: "#F5F5F5" }}>
        {mcq.question}
      </p>

      <AnimatePresence mode="wait">
        {!showFreeText ? (
          <motion.div key="choices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10">
            {/* Choice grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {mcq.choices.map((choice, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleChoice(choice)}
                  className="rounded-xl border px-4 py-3 text-sm text-left transition-all leading-snug flex items-start gap-2 backdrop-blur-sm"
                  style={{
                    borderColor: selected === choice ? color : "rgba(255,255,255,0.1)",
                    color: selected === choice ? "#F5F5F5" : "#9CA3AF",
                    background: selected === choice ? `${color}15` : "rgba(255,255,255,0.02)",
                    boxShadow: selected === choice ? `0 4px 16px ${color}20` : "none",
                  }}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ border: `2px solid ${selected === choice ? color : "rgba(255,255,255,0.2)"}`, background: selected === choice ? color : "transparent" }}>
                    {selected === choice && <Check size={12} color="#fff" strokeWidth={3} />}
                  </div>
                  <span className="flex-1">{choice}</span>
                </motion.button>
              ))}
            </div>

            {/* Free text toggle */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setShowFreeText(true)}
              className="flex items-center justify-center gap-2 text-xs font-medium transition-all w-full py-2.5 rounded-lg"
              style={{ color: "#6B7280", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#6B7280";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.05)";
              }}
            >
              <Pencil size={12} />
              Type your own answer…
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="freetext"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3 relative z-10"
          >
            <input
              autoFocus
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFreeTextSubmit(); }}
              placeholder="Type your answer…"
              className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition-all backdrop-blur-sm"
              style={{ borderColor: "rgba(255,255,255,0.1)", color: "#F5F5F5", background: "rgba(255,255,255,0.02)" }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = color;
                (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px ${color}15`;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.1)";
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowFreeText(false)}
                className="flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all"
                style={{ borderColor: "rgba(255,255,255,0.1)", color: "#9CA3AF", background: "rgba(255,255,255,0.02)" }}
              >
                Back
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFreeTextSubmit}
                disabled={!freeText.trim()}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: color, boxShadow: freeText.trim() ? `0 0 20px ${color}40` : "none" }}
              >
                Submit
                <ArrowRight size={12} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Made with Bob
