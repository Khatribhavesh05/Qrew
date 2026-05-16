"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { AGENTS } from "@/types";

type AgentState = "waiting" | "joining" | "done" | "standby";

interface AgentStatus {
  name: string;
  state: AgentState;
  emoji: string;
  role: string;
  color: string;
  description: string;
}

const SEQUENCE_DELAYS = [800, 1600, 2400, 3400, 4400]; // ms each agent joins
const ACTIVE_COUNT = 3; // Alex, Sam, Jordan join; Morgan and Riley are standby

export default function TeamAssemblyPage() {
  const router = useRouter();
  const params = useParams();
  const startupId = params.startupId as string;

  const [agents, setAgents] = useState<AgentStatus[]>(
    AGENTS.map((a, i) => ({
      name: a.name,
      emoji: a.emoji,
      role: a.role,
      color: a.color,
      description: a.description,
      state: i < 3 ? "waiting" : "standby",
    }))
  );
  const [showCTA, setShowCTA] = useState(false);
  const [startupName, setStartupName] = useState("Your startup");
  const [showFinale, setShowFinale] = useState(false);

  // Fetch startup name
  useEffect(() => {
    fetch(`/api/startups/${startupId}`)
      .then((r) => r.json())
      .then((d: { name?: string }) => {
        if (d.name) setStartupName(d.name);
      })
      .catch(() => null);
  }, [startupId]);

  // Sequence agents joining one by one
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    AGENTS.forEach((_, i) => {
      if (i >= ACTIVE_COUNT) return; // Morgan + Riley are standby, not animated

      timers.push(
        setTimeout(() => {
          setAgents((prev) =>
            prev.map((a, idx) =>
              idx === i ? { ...a, state: "joining" } : a
            )
          );

          timers.push(
            setTimeout(() => {
              setAgents((prev) =>
                prev.map((a, idx) =>
                  idx === i ? { ...a, state: "done" } : a
                )
              );
            }, 700)
          );
        }, SEQUENCE_DELAYS[i])
      );
    });

    // Show finale animation
    timers.push(
      setTimeout(() => setShowFinale(true), SEQUENCE_DELAYS[ACTIVE_COUNT - 1] + 1000)
    );

    // Show CTA after finale
    timers.push(
      setTimeout(() => setShowCTA(true), SEQUENCE_DELAYS[ACTIVE_COUNT - 1] + 2000)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const handleStart = async () => {
    await fetch("/api/startups/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startupId, status: "researching" }),
    });
    router.push(`/app/${startupId}`);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#0A0A0A", color: "#F5F5F5" }}
    >
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.12), transparent 60%)",
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(139,92,246,0.10), transparent 60%)",
              "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(99,102,241,0.12), transparent 60%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
        {/* Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: "#6366F1",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 0 30px rgba(99,102,241,0.4)" }}
            >
              <Sparkles size={20} color="#fff" />
            </motion.div>
          </div>
          <span
            className="text-2xl font-bold"
            style={{ color: "#F5F5F5", letterSpacing: "-0.04em" }}
          >
            qrew
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-3" style={{ letterSpacing: "-0.03em" }}>
            Assembling your team
          </h1>
          <p className="text-base" style={{ color: "#9CA3AF" }}>
            for <span className="font-semibold" style={{ color: "#6366F1" }}>{startupName}</span>
          </p>
        </motion.div>

        {/* Agent list */}
        <div className="flex flex-col gap-4 mb-10">
          {agents.map((agent, i) => (
            <AgentRow key={agent.name} agent={agent} index={i} />
          ))}
        </div>

        {/* Finale animation */}
        <AnimatePresence>
          {showFinale && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="text-center mb-8"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, ease: "easeInOut" }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-4xl"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  boxShadow: "0 0 40px rgba(16,185,129,0.5)",
                }}
              >
                ✨
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2"
                style={{ color: "#10B981" }}
              >
                Your team is ready!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-sm"
                style={{ color: "#9CA3AF" }}
              >
                Alex, Sam, and Jordan are standing by to analyze your startup
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-4 text-base font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  boxShadow: "0 0 40px rgba(99,102,241,0.5)",
                }}
              >
                Start Analysis →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentRow({ agent, index }: { agent: AgentStatus; index: number }) {
  const isStandby = agent.state === "standby";
  const isDone = agent.state === "done";
  const isJoining = agent.state === "joining";

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.5, type: "spring", stiffness: 200 }}
      className="relative flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all backdrop-blur-sm overflow-hidden"
      style={{
        background: isDone ? `${agent.color}08` : "rgba(17,17,17,0.6)",
        borderColor: isDone ? `${agent.color}40` : "rgba(255,255,255,0.05)",
        boxShadow: isDone ? `0 8px 32px ${agent.color}15` : "none",
      }}
    >
      {/* Glow effect */}
      {isDone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 20% 50%, ${agent.color}10, transparent 70%)` }}
        />
      )}

      {/* Avatar */}
      <div className="relative z-10">
        <motion.div
          animate={isJoining ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5 }}
          className="relative w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{
            background: isDone ? `${agent.color}20` : "rgba(255,255,255,0.03)",
            border: `2px solid ${isDone ? `${agent.color}50` : "rgba(255,255,255,0.05)"}`,
          }}
        >
          <span>{agent.emoji}</span>

          {/* Joining pulse rings */}
          {isJoining && (
            <>
              <motion.div
                className="absolute inset-0 rounded-xl border-2"
                style={{ borderColor: agent.color }}
                animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-xl border-2"
                style={{ borderColor: agent.color }}
                animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
              />
            </>
          )}
        </motion.div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-base font-bold"
            style={{ color: isStandby ? "#6B7280" : "#F5F5F5" }}
          >
            {agent.name}
          </span>
          <span
            className="text-xs rounded-full px-2.5 py-1 font-semibold capitalize"
            style={{
              background: isStandby ? "rgba(255,255,255,0.03)" : `${agent.color}15`,
              color: isStandby ? "#6B7280" : agent.color,
              border: `1px solid ${isStandby ? "rgba(255,255,255,0.05)" : `${agent.color}30`}`,
            }}
          >
            {agent.role}
          </span>
        </div>
        <p className="text-sm truncate" style={{ color: isStandby ? "#4B5563" : "#9CA3AF" }}>
          {agent.description}
        </p>
      </div>

      {/* Status badge */}
      <div className="shrink-0 relative z-10">
        <AnimatePresence mode="wait">
          {isDone && (
            <motion.div
              key="done"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: `${agent.color}20`, border: `2px solid ${agent.color}` }}
            >
              <Check size={16} style={{ color: agent.color }} strokeWidth={3} />
            </motion.div>
          )}
          {isJoining && (
            <motion.div
              key="joining"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-1"
            >
              {[0, 1, 2].map((j) => (
                <motion.div
                  key={j}
                  animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, delay: j * 0.2 }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: agent.color }}
                />
              ))}
            </motion.div>
          )}
          {isStandby && (
            <motion.span
              key="standby"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-medium"
              style={{ color: "#4B5563" }}
            >
              Standing by
            </motion.span>
          )}
          {agent.state === "waiting" && (
            <motion.span
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-medium"
              style={{ color: "#4B5563" }}
            >
              Waiting…
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Made with Bob
