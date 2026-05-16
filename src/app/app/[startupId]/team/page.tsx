"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { AGENTS } from "@/types";

type AgentState = "waiting" | "joining" | "active" | "standby";

interface AgentStatus {
  name: string;
  state: AgentState;
  emoji: string;
  role: string;
  color: string;
  description: string;
}

const SEQUENCE_DELAYS = [1000, 2200, 3400, 4800, 6200]; // Dramatic timing
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
      state: i < ACTIVE_COUNT ? "waiting" : "standby",
    }))
  );
  const [showCTA, setShowCTA] = useState(false);
  const [startupName, setStartupName] = useState("Your startup");
  const [showFinale, setShowFinale] = useState(false);
  const [allActive, setAllActive] = useState(false);

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
      if (i >= ACTIVE_COUNT) return;

      // Start joining
      timers.push(
        setTimeout(() => {
          setAgents((prev) =>
            prev.map((a, idx) =>
              idx === i ? { ...a, state: "joining" } : a
            )
          );

          // Complete joining
          timers.push(
            setTimeout(() => {
              setAgents((prev) =>
                prev.map((a, idx) =>
                  idx === i ? { ...a, state: "active" } : a
                )
              );
            }, 1000)
          );
        }, SEQUENCE_DELAYS[i])
      );
    });

    // Show finale animation
    timers.push(
      setTimeout(() => {
        setShowFinale(true);
        setAllActive(true);
      }, SEQUENCE_DELAYS[ACTIVE_COUNT - 1] + 1500)
    );

    // Show CTA after finale
    timers.push(
      setTimeout(() => setShowCTA(true), SEQUENCE_DELAYS[ACTIVE_COUNT - 1] + 2500)
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
      style={{ background: "#000000" }}
    >
      {/* Cinematic background */}
      <div className="pointer-events-none fixed inset-0">
        {/* Aurora effect */}
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.3), transparent 70%)",
              "radial-gradient(ellipse 80% 60% at 60% -10%, rgba(139,92,246,0.25), transparent 70%)",
              "radial-gradient(ellipse 80% 60% at 40% -10%, rgba(99,102,241,0.3), transparent 70%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />

        {/* Animated grid */}
        <motion.div
          animate={{ 
            backgroundPosition: ["0% 0%", "100% 100%"],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ 
            backgroundPosition: { duration: 30, repeat: Infinity, ease: "linear" },
            opacity: { duration: 5, repeat: Infinity }
          }}
          className="absolute inset-0"
          style={{ 
            backgroundImage: `linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)`,
            backgroundSize: "60px 60px"
          }}
        />

        {/* Star field particles */}
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -150, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
            }}
            transition={{
              duration: 5 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 8,
              ease: "easeInOut"
            }}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              background: i % 3 === 0 ? "#6366F1" : i % 3 === 1 ? "#8B5CF6" : "#10B981",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: `0 0 ${Math.random() * 20 + 10}px currentColor`,
            }}
          />
        ))}

        {/* Large floating orbs */}
        <motion.div
          animate={{ 
            x: [0, 200, 0], 
            y: [0, -150, 0],
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #6366F1, transparent)" }}
        />
        <motion.div
          animate={{ 
            x: [0, -180, 0], 
            y: [0, 120, 0],
            scale: [1, 1.4, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-3xl">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              <Sparkles size={28} color="#fff" />
              <motion.div
                className="absolute inset-0 rounded-2xl"
                animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ border: "3px solid #6366F1" }}
              />
            </motion.div>
          </div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold"
            style={{ letterSpacing: "-0.05em" }}
          >
            qrew
          </motion.span>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.h1 
            className="text-5xl sm:text-6xl font-bold tracking-tight mb-6"
            style={{ letterSpacing: "-0.04em" }}
          >
            Assembling your team
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-xl"
            style={{ color: "#9CA3AF" }}
          >
            for{" "}
            <motion.span 
              className="font-bold bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
              }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              {startupName}
            </motion.span>
          </motion.p>
        </motion.div>

        {/* Agent cards */}
        <div className="flex flex-col gap-6 mb-16">
          {agents.map((agent, i) => (
            <AgentCard key={agent.name} agent={agent} index={i} allActive={allActive} />
          ))}
        </div>

        {/* Finale animation */}
        <AnimatePresence>
          {showFinale && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="text-center mb-12"
            >
              {/* Burst effect */}
              <div className="relative">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ 
                      scale: [0, 2, 3],
                      opacity: [1, 0.5, 0],
                      rotate: i * 30
                    }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute top-1/2 left-1/2 w-32 h-1 origin-left"
                    style={{ 
                      background: `linear-gradient(90deg, ${i % 2 === 0 ? "#6366F1" : "#10B981"}, transparent)`,
                      transform: `rotate(${i * 30}deg)`
                    }}
                  />
                ))}
                
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 3, ease: "easeInOut" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                  className="relative w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-8 text-5xl"
                  style={{
                    background: "linear-gradient(135deg, #10B981, #059669)",
                    boxShadow: "0 0 80px rgba(16,185,129,0.6), inset 0 0 40px rgba(255,255,255,0.2)",
                  }}
                >
                  ✨
                  <motion.div
                    className="absolute inset-0 rounded-3xl"
                    animate={{ scale: [1, 1.3], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ border: "3px solid #10B981" }}
                  />
                </motion.div>
              </div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-bold mb-4"
                style={{ color: "#10B981", letterSpacing: "-0.03em" }}
              >
                Your founding team is ready
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-lg"
                style={{ color: "#9CA3AF" }}
              >
                Alex, Sam, and Jordan are standing by to build your startup
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CTA */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStart}
                className="relative w-full flex items-center justify-center gap-3 rounded-2xl py-6 text-lg font-bold text-white overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  boxShadow: "0 0 60px rgba(99,102,241,0.6), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0"
                  animate={{ 
                    background: [
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)"
                    ],
                    x: ["-100%", "200%"]
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                />
                
                <span className="relative z-10">Let's Build</span>
                <ArrowRight size={22} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AgentCard({ agent, index, allActive }: { agent: AgentStatus; index: number; allActive: boolean }) {
  const isStandby = agent.state === "standby";
  const isActive = agent.state === "active";
  const isJoining = agent.state === "joining";
  const isWaiting = agent.state === "waiting";

  return (
    <motion.div
      initial={{ opacity: 0, x: -60, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        scale: 1,
      }}
      transition={{ 
        delay: index * 0.15, 
        duration: 0.8, 
        type: "spring", 
        stiffness: 200,
        damping: 20
      }}
      className="relative rounded-3xl border-2 p-8 backdrop-blur-xl overflow-hidden group"
      style={{
        background: isActive 
          ? `linear-gradient(135deg, ${agent.color}15, ${agent.color}08)` 
          : "rgba(10,10,10,0.8)",
        borderColor: isActive ? `${agent.color}60` : "rgba(255,255,255,0.08)",
        boxShadow: isActive ? `0 20px 60px ${agent.color}30` : "none",
      }}
    >
      {/* Glow effect */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(circle at 30% 50%, ${agent.color}20, transparent 70%)` }}
        />
      )}

      {/* Animated border for joining state */}
      {isJoining && (
        <motion.div
          className="absolute inset-0 rounded-3xl"
          animate={{ 
            boxShadow: [
              `0 0 0 0 ${agent.color}80`,
              `0 0 0 8px ${agent.color}00`,
            ]
          }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      <div className="relative z-10 flex items-center gap-6">
        {/* Avatar with status ring */}
        <div className="relative shrink-0">
          <motion.div
            animate={isJoining ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.8, repeat: isJoining ? Infinity : 0 }}
            className="relative w-24 h-24 rounded-3xl flex items-center justify-center text-4xl"
            style={{
              background: isActive 
                ? `linear-gradient(135deg, ${agent.color}40, ${agent.color}20)` 
                : "rgba(255,255,255,0.04)",
              border: `3px solid ${isActive ? `${agent.color}70` : "rgba(255,255,255,0.08)"}`,
              boxShadow: isActive ? `0 8px 32px ${agent.color}40` : "none"
            }}
          >
            <span>{agent.emoji}</span>

            {/* Joining pulse rings */}
            {isJoining && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-3xl border-3"
                  style={{ borderColor: agent.color, borderWidth: 3 }}
                  animate={{ scale: [1, 1.6], opacity: [1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-3xl border-3"
                  style={{ borderColor: agent.color, borderWidth: 3 }}
                  animate={{ scale: [1, 1.6], opacity: [1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.6 }}
                />
              </>
            )}

            {/* Active glow ring */}
            {isActive && (
              <motion.div
                className="absolute inset-0 rounded-3xl"
                animate={{ 
                  boxShadow: [
                    `0 0 20px ${agent.color}60`,
                    `0 0 40px ${agent.color}80`,
                    `0 0 20px ${agent.color}60`,
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <motion.h3
              animate={{ color: isActive ? "#F5F5F5" : isStandby ? "#6B7280" : "#9CA3AF" }}
              className="text-2xl font-bold"
            >
              {agent.name}
            </motion.h3>
            <motion.span
              animate={{
                background: isStandby ? "rgba(255,255,255,0.04)" : `${agent.color}20`,
                borderColor: isStandby ? "rgba(255,255,255,0.08)" : `${agent.color}50`,
                color: isStandby ? "#6B7280" : agent.color,
              }}
              className="text-sm rounded-full px-4 py-1.5 font-bold capitalize border-2"
            >
              {agent.role}
            </motion.span>
          </div>
          <motion.p 
            animate={{ color: isStandby ? "#4B5563" : "#9CA3AF" }}
            className="text-base mb-3"
          >
            {agent.description}
          </motion.p>

          {/* Status text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            {isActive && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm font-bold flex items-center gap-2"
                style={{ color: agent.color }}
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ background: agent.color, boxShadow: `0 0 10px ${agent.color}` }}
                />
                Active
              </motion.span>
            )}
            {isJoining && (
              <motion.div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((j) => (
                    <motion.div
                      key={j}
                      animate={{ 
                        opacity: [0.3, 1, 0.3], 
                        scale: [1, 1.3, 1] 
                      }}
                      transition={{ 
                        duration: 1.2, 
                        repeat: Infinity, 
                        delay: j * 0.3 
                      }}
                      className="w-2 h-2 rounded-full"
                      style={{ background: agent.color }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium" style={{ color: agent.color }}>
                  Joining...
                </span>
              </motion.div>
            )}
            {isStandby && (
              <span className="text-sm font-medium" style={{ color: "#6B7280" }}>
                Standing by
              </span>
            )}
            {isWaiting && (
              <span className="text-sm font-medium" style={{ color: "#6B7280" }}>
                Waiting...
              </span>
            )}
          </motion.div>
        </div>

        {/* Status icon */}
        <div className="shrink-0">
          <AnimatePresence mode="wait">
            {isActive && (
              <motion.div
                key="active"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ 
                  background: `${agent.color}30`, 
                  border: `3px solid ${agent.color}`,
                  boxShadow: `0 0 20px ${agent.color}50`
                }}
              >
                <Check size={24} style={{ color: agent.color }} strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Made with Bob
