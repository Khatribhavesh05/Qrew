"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Zap, BarChart3, Palette, Code2, Rocket } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const EXAMPLES = [
  "A fitness app for busy moms who want 10-minute home workouts",
  "SaaS tool that auto-generates legal contracts for freelancers",
  "Marketplace connecting college students with local tutors",
  "AI-powered meal planner that syncs with your grocery delivery",
];

const AGENTS = [
  { icon: Zap,      name: "Alex",   role: "Research",  color: "#6366F1", desc: "Market research + competitors" },
  { icon: BarChart3, name: "Sam",   role: "Strategy",  color: "#10B981", desc: "Business plan + positioning" },
  { icon: Palette,  name: "Jordan", role: "Design",    color: "#F59E0B", desc: "Brand identity (silent)" },
  { icon: Code2,    name: "Morgan", role: "Dev",       color: "#3B82F6", desc: "Full code generation" },
  { icon: Rocket,   name: "Riley",  role: "Launch",    color: "#EF4444", desc: "GitHub + Vercel deploy" },
];

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [placeholder, setPlaceholder] = useState(0);

  const handleBuild = () => {
    const trimmed = idea.trim();
    if (!trimmed) return;
    // Store idea in sessionStorage so login/dashboard can pick it up
    sessionStorage.setItem("qrew_pending_idea", trimmed);
    router.push("/login");
  };

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ background: "#0A0A0A", color: "#F5F5F5" }}
    >
      {/* Ambient gradient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.12), transparent 60%)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <span
          className="text-xl font-bold tracking-tight"
          style={{ color: "#6366F1", letterSpacing: "-0.04em" }}
        >
          qrew
        </span>
        <button
          onClick={() => router.push("/login")}
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{ color: "#A3A3A3" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#F5F5F5")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center pt-16 pb-24">
        <motion.div
          variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center gap-6 max-w-3xl"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} transition={{ duration: 0.5 }}>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
              style={{ borderColor: "#1F1F1F", background: "#111111", color: "#6366F1" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
              5 AI agents. One idea. Live startup.
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            Your AI
            <br />
            <span style={{ color: "#6366F1" }}>Startup Team</span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-lg max-w-xl leading-relaxed"
            style={{ color: "#A3A3A3" }}
          >
            Describe your idea. We research, design, build and launch your
            startup automatically.
          </motion.p>

          {/* Input */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="w-full max-w-2xl"
          >
            <div
              className="flex items-center gap-3 rounded-2xl border p-2 transition-all"
              style={{ background: "#111111", borderColor: "#1F1F1F" }}
              onFocusCapture={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "#6366F1";
                el.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)";
              }}
              onBlurCapture={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "#1F1F1F";
                el.style.boxShadow = "none";
              }}
            >
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleBuild();
                  }
                }}
                placeholder={EXAMPLES[placeholder % EXAMPLES.length]}
                rows={2}
                className="flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-relaxed outline-none"
                style={{ color: "#F5F5F5" }}
                onFocus={() => setPlaceholder((p) => p + 1)}
              />
              <button
                onClick={handleBuild}
                disabled={!idea.trim()}
                className="flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all disabled:opacity-30"
                style={{
                  background: idea.trim() ? "#6366F1" : "#1F1F1F",
                  boxShadow: idea.trim() ? "0 0 20px rgba(99,102,241,0.4)" : "none",
                }}
              >
                Build My Startup
                <ArrowRight size={15} />
              </button>
            </div>
            <p className="mt-2 text-xs text-center" style={{ color: "#525252" }}>
              Press Enter to start — no credit card required
            </p>
          </motion.div>

          {/* Example chips */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center gap-2 mt-2"
          >
            {EXAMPLES.slice(0, 3).map((ex) => (
              <button
                key={ex}
                onClick={() => setIdea(ex)}
                className="rounded-full border px-3 py-1.5 text-xs transition-all"
                style={{ borderColor: "#1F1F1F", color: "#525252", background: "#111111" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6366F1";
                  e.currentTarget.style.color = "#A3A3A3";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1F1F1F";
                  e.currentTarget.style.color = "#525252";
                }}
              >
                {ex.length > 40 ? ex.slice(0, 40) + "…" : ex}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Agent cards */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-24 w-full max-w-4xl"
        >
          <p className="text-xs uppercase tracking-widest mb-6" style={{ color: "#525252" }}>
            Your AI team
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="rounded-xl border p-4 flex flex-col gap-3 transition-all"
                style={{ background: "#111111", borderColor: "#1F1F1F" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = agent.color;
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#1F1F1F";
                  (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${agent.color}18` }}
                >
                  <agent.icon size={16} color={agent.color} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>
                    {agent.name}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: agent.color }}>
                    {agent.role}
                  </div>
                  <div className="text-xs mt-1.5 leading-relaxed" style={{ color: "#525252" }}>
                    {agent.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Build types */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-16 w-full max-w-2xl"
        >
          <p className="text-xs uppercase tracking-widest mb-6" style={{ color: "#525252" }}>
            Choose your build
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "Standard",
                price: "$6",
                credits: "1.5 credits",
                items: ["Research + Strategy reports", "Full codebase generated", "GitHub push + Vercel deploy"],
                accent: "#6366F1",
              },
              {
                label: "Premium",
                price: "$10",
                credits: "2.5 credits",
                items: ["Everything in Standard", "AI-generated brand visuals", "Scroll-scrubbing video hero"],
                accent: "#10B981",
              },
            ].map((plan) => (
              <div
                key={plan.label}
                className="rounded-xl border p-5 text-left"
                style={{ background: "#111111", borderColor: "#1F1F1F" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>
                    {plan.label}
                  </span>
                  <span className="text-xs rounded-full px-2 py-1" style={{ background: `${plan.accent}18`, color: plan.accent }}>
                    {plan.credits}
                  </span>
                </div>
                <div className="text-3xl font-bold mb-4" style={{ color: "#F5F5F5" }}>
                  {plan.price}
                </div>
                <ul className="flex flex-col gap-2">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs" style={{ color: "#A3A3A3" }}>
                      <span style={{ color: plan.accent }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-center mt-4" style={{ color: "#525252" }}>
            Free on signup: 1 credit — get your full research + strategy report at no cost.
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 border-t" style={{ borderColor: "#1F1F1F" }}>
        <p className="text-xs" style={{ color: "#333333" }}>
          © 2026 Qrew · Built by Bhavesh Khatri
        </p>
      </footer>
    </div>
  );
}
