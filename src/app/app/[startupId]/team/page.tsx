"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
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

const SEQUENCE_DELAYS = [600, 1400, 2200, 3200, 4200]; // ms each agent joins
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
            }, 600)
          );
        }, SEQUENCE_DELAYS[i])
      );
    });

    // Show CTA after all active agents join
    timers.push(
      setTimeout(() => setShowCTA(true), SEQUENCE_DELAYS[ACTIVE_COUNT - 1] + 900)
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
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "#0A0A0A", color: "#F5F5F5" }}
    >
      {/* Ambient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99,102,241,0.1), transparent 60%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span
            className="text-2xl font-bold"
            style={{ color: "#6366F1", letterSpacing: "-0.04em" }}
          >
            qrew
          </span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-10"
        >
          <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ letterSpacing: "-0.02em" }}>
            Assembling your team
          </h1>
          <p className="text-sm" style={{ color: "#A3A3A3" }}>
            for <span style={{ color: "#F5F5F5" }}>{startupName}</span>
          </p>
        </motion.div>

        {/* Agent list */}
        <div className="flex flex-col gap-3 mb-8">
          {agents.map((agent, i) => (
            <AgentRow key={agent.name} agent={agent} index={i} />
          ))}
        </div>

        {/* CTA */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-sm mb-5" style={{ color: "#A3A3A3" }}>
                Your team is ready. Starting analysis…
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStart}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white"
                style={{
                  background: "#6366F1",
                  boxShadow: "0 0 28px rgba(99,102,241,0.45)",
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
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="flex items-center gap-4 rounded-xl border px-4 py-3.5 transition-all"
      style={{
        background: isDone ? `${agent.color}08` : "#111111",
        borderColor: isDone ? `${agent.color}30` : "#1F1F1F",
      }}
    >
      {/* Avatar */}
      <div
        className="relative w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all"
        style={{
          background: isDone ? `${agent.color}18` : "#161616",
          border: `1px solid ${isDone ? `${agent.color}40` : "#1A1A1A"}`,
        }}
      >
        <span>{agent.emoji}</span>

        {/* Joining pulse ring */}
        {isJoining && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2"
            style={{ borderColor: agent.color }}
            animate={{ scale: [1, 1.3], opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-semibold"
            style={{ color: isStandby ? "#525252" : "#F5F5F5" }}
          >
            {agent.name}
          </span>
          <span
            className="text-xs rounded-full px-2 py-0.5 font-medium capitalize"
            style={{
              background: isStandby ? "#1A1A1A" : `${agent.color}15`,
              color: isStandby ? "#525252" : agent.color,
            }}
          >
            {agent.role}
          </span>
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: isStandby ? "#333333" : "#525252" }}>
          {agent.description}
        </p>
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        <AnimatePresence mode="wait">
          {isDone && (
            <motion.div
              key="done"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: `${agent.color}20` }}
            >
              <Check size={12} style={{ color: agent.color }} />
            </motion.div>
          )}
          {isJoining && (
            <motion.div
              key="joining"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-0.5"
            >
              {[0, 1, 2].map((j) => (
                <motion.div
                  key={j}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: j * 0.15 }}
                  className="w-1 h-1 rounded-full"
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
              className="text-xs"
              style={{ color: "#333333" }}
            >
              Standing by…
            </motion.span>
          )}
          {agent.state === "waiting" && (
            <motion.span
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs"
              style={{ color: "#333333" }}
            >
              Waiting…
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
