"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Check, ChevronDown } from "lucide-react";

const EXAMPLES = [
  "A fitness app for busy moms who want 10-minute home workouts",
  "SaaS tool that auto-generates legal contracts for freelancers",
  "Marketplace connecting college students with local tutors",
  "AI-powered meal planner that syncs with your grocery delivery",
];

const AGENTS = [
  { name: "Alex", role: "Research", color: "#6366F1", emoji: "🔍", desc: "Market analysis" },
  { name: "Sam", role: "Strategy", color: "#10B981", emoji: "📊", desc: "Business plan" },
  { name: "Jordan", role: "Design", color: "#F59E0B", emoji: "🎨", desc: "Brand identity" },
  { name: "Morgan", role: "Dev", color: "#3B82F6", emoji: "💻", desc: "Full codebase" },
  { name: "Riley", role: "Launch", color: "#EF4444", emoji: "🚀", desc: "Deploy live" },
];

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [placeholder, setPlaceholder] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.9]);

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

  const scrollToAgents = () => {
    document.getElementById("agents")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "#000000" }}>
      {/* Animated grid background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Aurora gradient */}
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 100% 60% at 50% -20%, rgba(99,102,241,0.25), transparent 70%)",
              "radial-gradient(ellipse 100% 60% at 60% -20%, rgba(139,92,246,0.20), transparent 70%)",
              "radial-gradient(ellipse 100% 60% at 40% -20%, rgba(99,102,241,0.25), transparent 70%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
        
        {/* Animated grid */}
        <motion.div
          animate={{ 
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-20"
          style={{ 
            backgroundImage: `linear-gradient(rgba(99,102,241,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px"
          }}
        />

        {/* Floating particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: i % 3 === 0 ? "#6366F1" : i % 3 === 1 ? "#8B5CF6" : "#10B981",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: `0 0 10px currentColor`,
            }}
          />
        ))}

        {/* Large orbs */}
        <motion.div
          animate={{ 
            x: [0, 150, 0], 
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6366F1, transparent)" }}
        />
        <motion.div
          animate={{ 
            x: [0, -120, 0], 
            y: [0, 80, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }}
        />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 rounded-xl flex items-center justify-center relative"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
          >
            <Sparkles size={18} color="#fff" />
            <motion.div
              className="absolute inset-0 rounded-xl"
              animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ border: "2px solid #6366F1" }}
            />
          </motion.div>
          <span className="text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.05em" }}>
            qrew
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/login")}
          className="text-sm px-6 py-2.5 rounded-xl font-semibold transition-all"
          style={{ 
            background: "rgba(255,255,255,0.06)", 
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)"
          }}
        >
          Sign in
        </motion.button>
      </motion.nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center pt-12 pb-32">
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="flex flex-col items-center gap-10 max-w-5xl w-full"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              animate={{ 
                boxShadow: [
                  "0 0 30px rgba(99,102,241,0.3)", 
                  "0 0 50px rgba(99,102,241,0.5)", 
                  "0 0 30px rgba(99,102,241,0.3)"
                ] 
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center gap-3 rounded-full border px-6 py-3 backdrop-blur-xl"
              style={{ 
                borderColor: "rgba(99,102,241,0.4)", 
                background: "rgba(99,102,241,0.1)",
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: "#10B981", boxShadow: "0 0 10px #10B981" }}
              />
              <span className="text-sm font-bold" style={{ color: "#F5F5F5" }}>
                5 AI agents · One idea · Live in minutes
              </span>
            </motion.div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="space-y-6"
          >
            <h1
              className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight leading-[0.95]"
              style={{ letterSpacing: "-0.05em" }}
            >
              Build Your
              <br />
              <span
                className="bg-clip-text text-transparent relative inline-block"
                style={{ 
                  backgroundImage: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)",
                }}
              >
                Startup
                <motion.div
                  className="absolute -inset-2 blur-2xl opacity-50"
                  animate={{ 
                    background: [
                      "linear-gradient(135deg, #6366F1, #8B5CF6)",
                      "linear-gradient(135deg, #8B5CF6, #EC4899)",
                      "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    ]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
              </span>
              <br />
              <span style={{ color: "#F5F5F5" }}>With AI</span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xl sm:text-2xl max-w-3xl mx-auto leading-relaxed"
              style={{ color: "#9CA3AF" }}
            >
              Your AI team researches, designs, codes, and deploys your startup.
              <br />
              <span className="font-semibold" style={{ color: "#6366F1" }}>
                From idea to live product in one session.
              </span>
            </motion.p>
          </motion.div>

          {/* Input - The Centerpiece */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="w-full max-w-4xl relative"
          >
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-4 rounded-3xl blur-2xl"
              animate={{
                opacity: isFocused ? [0.3, 0.6, 0.3] : 0.2,
                scale: isFocused ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ 
                background: "linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)",
              }}
            />
            
            <motion.div
              animate={{
                borderColor: isFocused 
                  ? ["rgba(99,102,241,0.5)", "rgba(139,92,246,0.5)", "rgba(99,102,241,0.5)"]
                  : "rgba(99,102,241,0.3)",
                boxShadow: isFocused
                  ? ["0 0 40px rgba(99,102,241,0.3)", "0 0 60px rgba(139,92,246,0.4)", "0 0 40px rgba(99,102,241,0.3)"]
                  : "0 20px 60px rgba(0,0,0,0.5)",
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="relative flex items-center gap-4 rounded-3xl border-2 p-3 backdrop-blur-xl"
              style={{ 
                background: "rgba(10,10,10,0.8)",
              }}
            >
              <textarea
                ref={inputRef}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleBuild();
                  }
                }}
                placeholder={EXAMPLES[placeholder]}
                rows={3}
                className="flex-1 resize-none bg-transparent px-6 py-5 text-lg leading-relaxed outline-none"
                style={{ color: "#F5F5F5" }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBuild}
                disabled={!idea.trim()}
                className="flex shrink-0 items-center gap-2 rounded-2xl px-8 py-5 text-base font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  background: idea.trim() 
                    ? "linear-gradient(135deg, #6366F1, #8B5CF6)" 
                    : "rgba(255,255,255,0.05)",
                }}
              >
                {idea.trim() && (
                  <motion.div
                    className="absolute inset-0"
                    animate={{ 
                      background: [
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
                      ],
                      x: ["-100%", "200%"]
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <span className="relative z-10">Build Now</span>
                <ArrowRight size={18} className="relative z-10" />
              </motion.button>
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-4 text-sm text-center flex items-center justify-center gap-2"
              style={{ color: "#6B7280" }}
            >
              <kbd className="px-3 py-1 rounded-lg text-xs font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Enter ↵
              </kbd>
              <span>to start building</span>
              <span className="mx-2">·</span>
              <span className="font-semibold" style={{ color: "#10B981" }}>Free 1 credit on signup</span>
            </motion.p>
          </motion.div>

          {/* Agent avatars below input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center gap-3">
              {AGENTS.map((agent, i) => (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.3 + i * 0.1, type: "spring", stiffness: 300 }}
                  whileHover={{ scale: 1.2, y: -5 }}
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl cursor-pointer"
                  style={{ 
                    background: `${agent.color}20`,
                    border: `2px solid ${agent.color}40`,
                    boxShadow: `0 4px 20px ${agent.color}30`
                  }}
                  title={`${agent.name} - ${agent.role}`}
                >
                  {agent.emoji}
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    style={{ border: `2px solid ${agent.color}` }}
                  />
                </motion.div>
              ))}
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="text-sm font-medium"
              style={{ color: "#9CA3AF" }}
            >
              <span style={{ color: "#6366F1" }}>Your team is waiting</span> · Ready to build
            </motion.p>
          </motion.div>

          {/* Scroll indicator */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ opacity: { delay: 2 }, y: { duration: 2, repeat: Infinity } }}
            onClick={scrollToAgents}
            className="mt-12 flex flex-col items-center gap-2 text-xs font-medium"
            style={{ color: "#6B7280" }}
          >
            <span>Meet your team</span>
            <ChevronDown size={20} />
          </motion.button>
        </motion.div>
      </main>

      {/* Social proof line */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 text-center py-12 border-t"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <p className="text-sm font-medium" style={{ color: "#6B7280" }}>
          Join <span className="font-bold" style={{ color: "#6366F1" }}>founders building with AI</span> · Ship faster than ever
        </p>
      </motion.div>

      {/* Agents section */}
      <section id="agents" className="relative z-10 py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl sm:text-6xl font-bold mb-6" style={{ letterSpacing: "-0.03em" }}>
              Your AI Founding Team
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: "#9CA3AF" }}>
              Five specialized agents work together to build your startup from scratch
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group rounded-3xl border p-8 backdrop-blur-xl relative overflow-hidden"
                style={{ 
                  background: "rgba(17,17,17,0.6)", 
                  borderColor: "rgba(255,255,255,0.05)" 
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${agent.color}40`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 60px ${agent.color}20`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${agent.color}10, transparent 70%)` }} />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 transition-transform group-hover:scale-110" style={{ background: `${agent.color}20`, border: `2px solid ${agent.color}40` }}>
                    {agent.emoji}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{agent.name}</h3>
                  <p className="text-sm font-semibold mb-4" style={{ color: agent.color }}>{agent.role}</p>
                  <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>{agent.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-12 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <p className="text-sm" style={{ color: "#6B7280" }}>
          © 2026 Qrew · Built by Bhavesh Khatri
        </p>
      </footer>
    </div>
  );
}

// Made with Bob
