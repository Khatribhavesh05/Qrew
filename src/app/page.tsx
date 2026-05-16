"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Zap, BarChart3, Palette, Code2, Rocket, Sparkles, Check } from "lucide-react";

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
  { icon: Zap,      name: "Alex",   role: "Research",  color: "#6366F1", emoji: "🔍", desc: "Market research + competitors" },
  { icon: BarChart3, name: "Sam",   role: "Strategy",  color: "#10B981", emoji: "📊", desc: "Business plan + positioning" },
  { icon: Palette,  name: "Jordan", role: "Design",    color: "#F59E0B", emoji: "🎨", desc: "Brand identity (silent)" },
  { icon: Code2,    name: "Morgan", role: "Dev",       color: "#3B82F6", emoji: "💻", desc: "Full code generation" },
  { icon: Rocket,   name: "Riley",  role: "Launch",    color: "#EF4444", emoji: "🚀", desc: "GitHub + Vercel deploy" },
];

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [placeholder, setPlaceholder] = useState(0);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder((p) => (p + 1) % EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleBuild = () => {
    const trimmed = idea.trim();
    if (!trimmed) return;
    sessionStorage.setItem("qrew_pending_idea", trimmed);
    router.push("/login");
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      {/* Animated mesh gradient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15), transparent 60%)",
              "radial-gradient(ellipse 80% 50% at 60% -10%, rgba(139,92,246,0.12), transparent 60%)",
              "radial-gradient(ellipse 80% 50% at 40% -10%, rgba(99,102,241,0.15), transparent 60%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
        {/* Floating orbs */}
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6366F1, transparent)" }}
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }}
        />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
          >
            <Sparkles size={16} color="#fff" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight" style={{ color: "#F5F5F5", letterSpacing: "-0.04em" }}>
            qrew
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/login")}
          className="text-sm px-5 py-2 rounded-lg font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F5" }}
        >
          Sign in
        </motion.button>
      </motion.nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center pt-8 pb-24">
        <motion.div
          style={{ opacity, scale }}
          variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center gap-8 max-w-4xl"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <motion.span
              animate={{ boxShadow: ["0 0 20px rgba(99,102,241,0.2)", "0 0 30px rgba(99,102,241,0.4)", "0 0 20px rgba(99,102,241,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold backdrop-blur-sm"
              style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "#6366F1" }}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-[#10B981]"
              />
              5 AI agents · One idea · Live startup in minutes
            </motion.span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[1.1]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Your AI
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)" }}
            >
              Startup Team
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-xl max-w-2xl leading-relaxed"
            style={{ color: "#A3A3A3" }}
          >
            Describe your idea. We research, design, build and launch your startup automatically.
            <br />
            <span style={{ color: "#6366F1", fontWeight: 600 }}>No code. No design. No deployment hassle.</span>
          </motion.p>

          {/* Input */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl"
          >
            <div
              className="flex items-center gap-3 rounded-2xl border p-2 transition-all backdrop-blur-md"
              style={{ background: "rgba(17,17,17,0.8)", borderColor: "rgba(99,102,241,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
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
                placeholder={EXAMPLES[placeholder]}
                rows={3}
                className="flex-1 resize-none bg-transparent px-4 py-3 text-base leading-relaxed outline-none placeholder:text-[#525252]"
                style={{ color: "#F5F5F5" }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBuild}
                disabled={!idea.trim()}
                className="flex shrink-0 items-center gap-2 rounded-xl px-6 py-4 text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: idea.trim() ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "#1F1F1F",
                  boxShadow: idea.trim() ? "0 0 30px rgba(99,102,241,0.5)" : "none",
                }}
              >
                Build My Startup
                <ArrowRight size={16} />
              </motion.button>
            </div>
            <p className="mt-3 text-xs text-center" style={{ color: "#525252" }}>
              Press <kbd className="px-2 py-0.5 rounded bg-[#1F1F1F] border border-[#2A2A2A]">Enter</kbd> to start · Free 1 credit on signup
            </p>
          </motion.div>
        </motion.div>

        {/* Agent cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-32 w-full max-w-6xl"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#2A2A2A]" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#6366F1" }}>
              Meet Your AI Team
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#2A2A2A]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group rounded-2xl border p-5 flex flex-col gap-4 transition-all backdrop-blur-sm"
                style={{ background: "rgba(17,17,17,0.6)", borderColor: "rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${agent.color}40`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${agent.color}20`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                    style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
                  >
                    {agent.emoji}
                  </div>
                  <agent.icon size={18} style={{ color: agent.color, opacity: 0.6 }} />
                </div>
                <div>
                  <div className="text-base font-bold mb-1" style={{ color: "#F5F5F5" }}>
                    {agent.name}
                  </div>
                  <div className="text-xs font-semibold mb-2" style={{ color: agent.color }}>
                    {agent.role}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                    {agent.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-24 w-full max-w-4xl"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#2A2A2A]" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#10B981" }}>
              Simple Pricing
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#2A2A2A]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                label: "Standard",
                price: "$6",
                credits: "1.5 credits",
                items: ["Research + Strategy reports", "Full codebase generated", "GitHub push + Vercel deploy", "Database + Auth + Payments"],
                accent: "#6366F1",
                popular: false,
              },
              {
                label: "Premium",
                price: "$10",
                credits: "2.5 credits",
                items: ["Everything in Standard", "AI-generated brand visuals", "Cinematic scroll video", "Apple.com level experience"],
                accent: "#10B981",
                popular: true,
              },
            ].map((plan) => (
              <motion.div
                key={plan.label}
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative rounded-2xl border p-6 text-left backdrop-blur-sm"
                style={{
                  background: plan.popular ? `${plan.accent}08` : "rgba(17,17,17,0.6)",
                  borderColor: plan.popular ? `${plan.accent}40` : "rgba(255,255,255,0.05)",
                  boxShadow: plan.popular ? `0 8px 32px ${plan.accent}20` : "none",
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: plan.accent, color: "#fff" }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold" style={{ color: "#F5F5F5" }}>
                    {plan.label}
                  </span>
                  <span className="text-xs rounded-full px-3 py-1 font-semibold" style={{ background: `${plan.accent}18`, color: plan.accent }}>
                    {plan.credits}
                  </span>
                </div>
                <div className="text-4xl font-bold mb-6" style={{ color: "#F5F5F5" }}>
                  {plan.price}
                </div>
                <ul className="flex flex-col gap-3 mb-6">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "#A3A3A3" }}>
                      <Check size={16} style={{ color: plan.accent, flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-center mt-6" style={{ color: "#6B7280" }}>
            🎁 Free on signup: <span style={{ color: "#10B981", fontWeight: 600 }}>1 credit</span> — get your full research + strategy report at no cost
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <p className="text-xs" style={{ color: "#525252" }}>
          © 2026 Qrew · Built by Bhavesh Khatri
        </p>
      </footer>
    </div>
  );
}

// Made with Bob
