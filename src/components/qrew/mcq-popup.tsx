"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, SkipForward, Pencil, Check } from "lucide-react";
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

export function MCQPopup({ mcq, onAnswered, onSkipped }: MCQPopupProps) {
  const color = AGENT_COLORS[mcq.agent] ?? "#6366F1";
  const [freeText, setFreeText] = useState("");
  const [showFreeText, setShowFreeText] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handleChoice = (choice: string) => {
    setSelected(choice);
    setTimeout(() => onAnswered(mcq.field, choice), 300);
  };

  const handleFreeTextSubmit = () => {
    const trimmed = freeText.trim();
    if (!trimmed) return;
    onAnswered(mcq.field, trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full rounded-2xl border p-5"
      style={{ background: "#111111", borderColor: `${color}35` }}
    >
      {/* Agent label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color }} />
          <span className="text-xs font-medium" style={{ color }}>
            {AGENT_LABELS[mcq.agent]}
          </span>
        </div>
        <button
          onClick={onSkipped}
          className="flex items-center gap-1 text-xs transition-colors"
          style={{ color: "#525252" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#525252")}
        >
          <SkipForward size={11} />
          Skip
        </button>
      </div>

      {/* Question */}
      <p className="text-sm font-semibold mb-4 leading-relaxed" style={{ color: "#F5F5F5" }}>
        {mcq.question}
      </p>

      <AnimatePresence mode="wait">
        {!showFreeText ? (
          <motion.div key="choices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Choice grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {mcq.choices.map((choice, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleChoice(choice)}
                  className="rounded-xl border px-3 py-2.5 text-xs text-left transition-all leading-snug flex items-start gap-2"
                  style={{
                    borderColor: selected === choice ? color : "#2A2A2A",
                    color: selected === choice ? "#F5F5F5" : "#A3A3A3",
                    background: selected === choice ? `${color}12` : "#0D0D0D",
                  }}
                >
                  {selected === choice && <Check size={10} className="mt-0.5 shrink-0" style={{ color }} />}
                  {choice}
                </motion.button>
              ))}
            </div>

            {/* Free text toggle */}
            <button
              onClick={() => setShowFreeText(true)}
              className="flex items-center gap-1.5 text-xs transition-colors w-full justify-center py-1.5"
              style={{ color: "#525252" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#525252")}
            >
              <Pencil size={11} />
              Type your own answer…
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="freetext"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            <input
              autoFocus
              type="text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFreeTextSubmit(); }}
              placeholder="Type your answer…"
              className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition-colors"
              style={{ borderColor: "#2A2A2A", color: "#F5F5F5" }}
              onFocus={(e) => (e.currentTarget.style.borderColor = color)}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowFreeText(false)}
                className="flex-1 rounded-xl border py-2.5 text-xs transition-all"
                style={{ borderColor: "#2A2A2A", color: "#525252" }}
              >
                Back
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleFreeTextSubmit}
                disabled={!freeText.trim()}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: color }}
              >
                Submit
                <ArrowRight size={11} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
