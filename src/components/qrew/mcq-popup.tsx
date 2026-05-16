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
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-3xl border backdrop-blur-xl relative overflow-hidden"
        style={{
          background: "rgba(17,17,17,0.95)",
          borderColor: `${color}40`,
          boxShadow: `0 20px 60px ${color}20, 0 0 0 1px ${color}10`
        }}
      >
        {/* Gradient glow effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 50% 0%, ${color}12, transparent 60%)` }}
        />

        {/* Animated sparkles background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%"],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
              backgroundSize: "50px 50px"
            }}
          />
        </div>

        <div className="relative z-10 p-8">
          {/* Agent header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl relative"
                style={{
                  background: `linear-gradient(135deg, ${color}30, ${color}15)`,
                  border: `2px solid ${color}40`,
                  boxShadow: `0 8px 24px ${color}25`
                }}
              >
                {AGENT_EMOJIS[mcq.agent]}
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ border: `2px solid ${color}` }}
                />
              </motion.div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-bold" style={{ color: "#F5F5F5" }}>
                    {AGENT_LABELS[mcq.agent]}
                  </span>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: color }}
                  />
                </div>
                <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Needs your input</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSkipped}
              className="flex items-center gap-2 text-xs font-medium transition-all rounded-xl px-4 py-2"
              style={{
                color: "#9CA3AF",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)"
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLButtonElement).style.color = "#F5F5F5";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)";
                (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
              }}
            >
              <SkipForward size={14} />
              Skip
            </motion.button>
          </div>

          {/* Question */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <p className="text-xl font-bold leading-relaxed" style={{ color: "#F5F5F5" }}>
              {mcq.question}
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!showFreeText ? (
              <motion.div
                key="choices"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {/* Choice grid with stagger animation */}
                <div className="grid grid-cols-1 gap-3 mb-6">
                  {mcq.choices.map((choice, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300, damping: 25 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChoice(choice)}
                      className="rounded-2xl border px-5 py-4 text-left transition-all leading-relaxed flex items-center gap-4 group"
                      style={{
                        borderColor: selected === choice ? color : "rgba(255,255,255,0.08)",
                        color: selected === choice ? "#F5F5F5" : "#D1D5DB",
                        background: selected === choice ? `${color}18` : "rgba(255,255,255,0.03)",
                        boxShadow: selected === choice ? `0 8px 24px ${color}25, inset 0 0 0 1px ${color}30` : "none",
                      }}
                      onMouseEnter={(e) => {
                        if (selected !== choice) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selected !== choice) {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                          (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                        }
                      }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all"
                        style={{
                          border: `2px solid ${selected === choice ? color : "rgba(255,255,255,0.2)"}`,
                          background: selected === choice ? color : "transparent"
                        }}
                      >
                        {selected === choice && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          >
                            <Check size={14} color="#fff" strokeWidth={3} />
                          </motion.div>
                        )}
                      </div>
                      <span className="flex-1 text-sm font-medium">{choice}</span>
                      <ArrowRight
                        size={16}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: selected === choice ? color : "#6B7280" }}
                      />
                    </motion.button>
                  ))}
                </div>

                {/* Free text toggle */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + mcq.choices.length * 0.08 }}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setShowFreeText(true)}
                  className="flex items-center justify-center gap-2 text-sm font-medium transition-all w-full py-3 rounded-xl"
                  style={{
                    color: "#9CA3AF",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)"
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#F5F5F5";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                  }}
                >
                  <Pencil size={14} />
                  Type your own answer
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="freetext"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                <input
                  autoFocus
                  type="text"
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleFreeTextSubmit(); }}
                  placeholder="Type your answer…"
                  className="w-full rounded-xl border bg-transparent px-5 py-4 text-base outline-none transition-all"
                  style={{
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#F5F5F5",
                    background: "rgba(255,255,255,0.04)"
                  }}
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
                    className="flex-1 rounded-xl border py-3 text-sm font-medium transition-all"
                    style={{
                      borderColor: "rgba(255,255,255,0.1)",
                      color: "#9CA3AF",
                      background: "rgba(255,255,255,0.03)"
                    }}
                  >
                    Back
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFreeTextSubmit}
                    disabled={!freeText.trim()}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: color,
                      boxShadow: freeText.trim() ? `0 0 24px ${color}40` : "none"
                    }}
                  >
                    Submit
                    <ArrowRight size={14} />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Made with Bob
