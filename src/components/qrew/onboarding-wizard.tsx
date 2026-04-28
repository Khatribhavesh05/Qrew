"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPLOYEE_OPTIONS: Array<{
  role: Employee["role"];
  emoji: string;
  name: string;
  title: string;
  description: string;
}> = [
  {
    role: "research",
    emoji: "🔍",
    name: "Alex",
    title: "Research Employee",
    description: "Market research, competitor analysis, trend reports",
  },
  {
    role: "strategy",
    emoji: "🧠",
    name: "Sam",
    title: "Strategy Employee",
    description: "Roadmaps, execution plans, decision frameworks",
  },
  {
    role: "launch",
    emoji: "🚀",
    name: "Jordan",
    title: "Launch Employee",
    description: "Product Hunt copy, X posts, landing page copy",
  },
];

// ─── Slide variants ───────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -36 : 36, opacity: 0 }),
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  userId: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function OnboardingWizard({ userId }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedRole, setSelectedRole] =
    useState<Employee["role"]>("research");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus the active step's input
  useEffect(() => {
    if (step === 1) nameInputRef.current?.focus();
    if (step === 2) descInputRef.current?.focus();
  }, [step]);

  const advance = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const retreat = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    // Create company
    const { data: company, error: companyErr } = await supabase
      .from("companies")
      .insert({ name: companyName.trim(), description: description.trim(), user_id: userId })
      .select("id")
      .single();

    if (companyErr || !company) {
      setSubmitError(companyErr?.message ?? "Failed to create company.");
      setSubmitting(false);
      return;
    }

    // Create all 3 employees
    const { error: employeesErr } = await supabase.from("employees").insert([
      { name: "Alex",   role: "research", status: "idle", company_id: (company as { id: string }).id },
      { name: "Sam",    role: "strategy", status: "idle", company_id: (company as { id: string }).id },
      { name: "Jordan", role: "launch",   status: "idle", company_id: (company as { id: string }).id },
    ]);

    if (employeesErr) {
      setSubmitError(employeesErr.message);
      setSubmitting(false);
      return;
    }

    router.replace("/app");
  };

  const progress = (step / 3) * 100;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 py-12"
      style={{ background: "#0A0A0A" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.1), transparent)",
        }}
      />

      <div className="relative w-full max-w-[480px]">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex justify-center"
        >
          <span
            className="text-2xl font-bold"
            style={{ color: "#6366F1", letterSpacing: "-0.04em" }}
          >
            qrew
          </span>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="rounded-xl p-8"
          style={{
            background: "#111111",
            outline: "1px solid #1F1F1F",
          }}
        >
          {/* Progress bar + step label */}
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: "#525252" }}>
                Step {step} of 3
              </span>
              <span className="text-xs" style={{ color: "#525252" }}>
                {step === 1 ? "Company" : step === 2 ? "About" : "Your team"}
              </span>
            </div>
            <div
              className="h-1 w-full overflow-hidden rounded-full"
              style={{ background: "#1F1F1F" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "#6366F1" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Animated step content */}
          <div className="overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {/* ── Step 1 ── */}
                {step === 1 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h1
                        className="text-2xl font-semibold tracking-tight"
                        style={{ color: "#F5F5F5", letterSpacing: "-0.02em" }}
                      >
                        What&apos;s your company called?
                      </h1>
                      <p className="text-sm leading-relaxed" style={{ color: "#A3A3A3" }}>
                        This is how your AI team will refer to your work.
                      </p>
                    </div>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && companyName.trim()) advance();
                      }}
                      placeholder="Acme Inc."
                      className="w-full rounded-lg border bg-transparent px-4 py-3 text-sm outline-none transition-colors"
                      style={{
                        borderColor: "#2A2A2A",
                        color: "#F5F5F5",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
                    />
                  </div>
                )}

                {/* ── Step 2 ── */}
                {step === 2 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h1
                        className="text-2xl font-semibold tracking-tight"
                        style={{ color: "#F5F5F5", letterSpacing: "-0.02em" }}
                      >
                        What does your company do?
                      </h1>
                      <p className="text-sm leading-relaxed" style={{ color: "#A3A3A3" }}>
                        Give your team context so they can work smarter.
                      </p>
                    </div>
                    <textarea
                      ref={descInputRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="We're building an AI tool that helps founders..."
                      rows={3}
                      className="w-full resize-none rounded-lg border bg-transparent px-4 py-3 text-sm leading-relaxed outline-none transition-colors"
                      style={{
                        borderColor: "#2A2A2A",
                        color: "#F5F5F5",
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = "#6366F1")}
                      onBlur={(e) => (e.currentTarget.style.borderColor = "#2A2A2A")}
                    />
                  </div>
                )}

                {/* ── Step 3 ── */}
                {step === 3 && (
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <h1
                        className="text-2xl font-semibold tracking-tight"
                        style={{ color: "#F5F5F5", letterSpacing: "-0.02em" }}
                      >
                        Meet your first AI employee
                      </h1>
                      <p className="text-sm leading-relaxed" style={{ color: "#A3A3A3" }}>
                        You can add more later.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      {EMPLOYEE_OPTIONS.map((emp) => {
                        const active = selectedRole === emp.role;
                        return (
                          <motion.button
                            key={emp.role}
                            onClick={() => setSelectedRole(emp.role)}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            className="relative flex items-start gap-4 rounded-xl border p-4 text-left transition-colors duration-150"
                            style={{
                              background: active
                                ? "rgba(99,102,241,0.08)"
                                : "#161616",
                              borderColor: active ? "#6366F1" : "#1F1F1F",
                              boxShadow: active
                                ? "0 0 20px rgba(99,102,241,0.12)"
                                : "none",
                            }}
                          >
                            <span className="mt-0.5 text-2xl leading-none">
                              {emp.emoji}
                            </span>
                            <div className="flex min-w-0 flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className="text-sm font-semibold"
                                  style={{ color: "#F5F5F5" }}
                                >
                                  {emp.name}
                                </span>
                                <span
                                  className="text-xs"
                                  style={{ color: "#525252" }}
                                >
                                  {emp.title}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: "#A3A3A3" }}>
                                {emp.description}
                              </p>
                            </div>

                            {/* Check badge */}
                            <AnimatePresence>
                              {active && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute right-4 top-4 flex size-5 items-center justify-center rounded-full"
                                  style={{ background: "#6366F1" }}
                                >
                                  <Check size={11} color="#fff" strokeWidth={3} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </div>

                    {submitError && (
                      <p className="text-xs" style={{ color: "#EF4444" }}>
                        {submitError}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className={`mt-8 flex items-center ${step > 1 ? "justify-between" : "justify-end"}`}>
            {step > 1 && (
              <button
                onClick={retreat}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-40"
                style={{ color: "#525252" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#A3A3A3")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#525252")
                }
              >
                <ArrowLeft size={14} />
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={advance}
                disabled={step === 1 && !companyName.trim()}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-30"
                style={{
                  background: "#6366F1",
                  color: "#fff",
                  boxShadow:
                    step === 1 && !companyName.trim()
                      ? "none"
                      : "0 0 20px rgba(99,102,241,0.3)",
                }}
              >
                Continue
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-150 disabled:opacity-60"
                style={{
                  background: "#6366F1",
                  color: "#fff",
                  boxShadow: "0 0 20px rgba(99,102,241,0.3)",
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Building…
                  </>
                ) : (
                  <>
                    Build my team
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Step dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex justify-center gap-2"
        >
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="rounded-full transition-all duration-300"
              style={{
                width: s === step ? "20px" : "6px",
                height: "6px",
                background: s === step ? "#6366F1" : s < step ? "#3730A3" : "#1F1F1F",
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
