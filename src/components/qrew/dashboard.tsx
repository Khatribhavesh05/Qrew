"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, CheckCircle, Loader2, AlertCircle, Zap, ShoppingCart, Sparkles, LayoutDashboard, LogOut } from "lucide-react";
import type { Startup } from "@/types";
import { AddCompanyModal } from "./add-company-modal";
import { CreditsModal } from "./CreditsModal";
import { supabase } from "@/lib/supabase";

interface DashboardProps {
  startups: Startup[];
  userEmail: string;
  creditsBalance: number;
  paymentSuccess?: boolean;
  openBuy?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Loader2; pulse: boolean }> = {
  draft:         { label: "Processing",      color: "#6B7280", icon: Loader2,      pulse: false },
  researching:   { label: "Researching",     color: "#3B82F6", icon: Loader2,      pulse: true  },
  ready:         { label: "Ready to Build",  color: "#10B981", icon: CheckCircle,  pulse: false },
  building:      { label: "Building",        color: "#F59E0B", icon: Loader2,      pulse: true  },
  built:         { label: "Built",           color: "#8B5CF6", icon: Zap,          pulse: false },
  deployed:      { label: "Live",            color: "#10B981", icon: CheckCircle,  pulse: false },
  processing:    { label: "Processing",      color: "#6B7280", icon: Loader2,      pulse: false },
  naming:        { label: "Processing",      color: "#6B7280", icon: Loader2,      pulse: false },
  team_assembly: { label: "Processing",      color: "#6B7280", icon: Loader2,      pulse: false },
  report_ready:  { label: "Ready to Build",  color: "#10B981", icon: CheckCircle,  pulse: false },
  live:          { label: "Live",            color: "#10B981", icon: CheckCircle,  pulse: false },
  error:         { label: "Error",           color: "#EF4444", icon: AlertCircle,  pulse: false },
};

function StartupCard({ startup, index }: { startup: Startup; index: number }) {
  const router = useRouter();
  const config = STATUS_CONFIG[startup.status] ?? STATUS_CONFIG["draft"];
  const isActive = config.pulse;

  const handleClick = () => {
    if (startup.status === "processing" || startup.status === "naming" || startup.status === "draft") {
      router.push(`/app/${startup.id}/process`);
    } else if (startup.status === "team_assembly") {
      router.push(`/app/${startup.id}/team`);
    } else {
      router.push(`/app/${startup.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={handleClick}
      className="group relative rounded-2xl border p-6 cursor-pointer transition-all backdrop-blur-sm"
      style={{ background: "rgba(17,17,17,0.6)", borderColor: "rgba(255,255,255,0.05)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${config?.color ?? "#6366F1"}40`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${config?.color ?? "#6366F1"}15`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Glow effect on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${config?.color ?? "#6366F1"}10, transparent 70%)` }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold transition-transform group-hover:scale-110"
            style={{ background: `${config?.color ?? "#6366F1"}15`, color: config?.color ?? "#6366F1", border: `1px solid ${config?.color ?? "#6366F1"}30` }}
          >
            {startup.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <motion.span
            animate={isActive ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
            style={{ background: `${config?.color ?? "#6366F1"}15`, color: config?.color ?? "#6366F1", border: `1px solid ${config?.color ?? "#6366F1"}30` }}
          >
            {isActive && <config.icon size={11} className="animate-spin" />}
            {config.label}
          </motion.span>
        </div>

        <div className="mb-3">
          <h3 className="text-base font-bold mb-1" style={{ color: "#F5F5F5" }}>
            {startup.name ?? "Unnamed Startup"}
          </h3>
          {startup.industry && (
            <p className="text-xs font-medium" style={{ color: "#6B7280" }}>
              {startup.industry}
            </p>
          )}
        </div>

        <p className="text-sm leading-relaxed mb-5 line-clamp-2" style={{ color: "#9CA3AF" }}>
          {startup.idea}
        </p>

        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <span className="text-xs font-medium" style={{ color: "#6B7280" }}>
            {new Date(startup.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <ArrowRight
            size={16}
            className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1"
            style={{ color: config?.color ?? "#6366F1" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export function Dashboard({ startups, userEmail, creditsBalance, paymentSuccess, openBuy }: DashboardProps) {
  const [showModal, setShowModal] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [currentCredits, setCurrentCredits] = useState(creditsBalance);
  const [pendingIdea, setPendingIdea] = useState<string | undefined>();
  const [successBanner, setSuccessBanner] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("qrew_pending_idea");
    if (stored) {
      sessionStorage.removeItem("qrew_pending_idea");
      setPendingIdea(stored);
      setShowModal(true);
    }
  }, []);

  useEffect(() => {
    if (paymentSuccess) {
      setSuccessBanner(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      router.replace(url.pathname + url.search, { scroll: false });
      const t = setTimeout(() => setSuccessBanner(false), 5000);
      return () => clearTimeout(t);
    }
  }, [paymentSuccess, router]);

  useEffect(() => {
    if (openBuy) {
      setShowCredits(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("buy");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  }, [openBuy, router]);

  useEffect(() => {
    setCurrentCredits(creditsBalance);
  }, [creditsBalance]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen flex" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      {/* Animated background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 60% 40% at 20% 30%, rgba(99,102,241,0.08), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 80% 30%, rgba(139,92,246,0.06), transparent 60%)",
              "radial-gradient(ellipse 60% 40% at 20% 30%, rgba(99,102,241,0.08), transparent 60%)",
            ],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
      </div>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="hidden lg:flex flex-col w-72 border-r relative z-10"
        style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(20px)" }}
      >
        <div className="p-6 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
            >
              <Sparkles size={18} color="#fff" />
            </motion.div>
            <span className="text-xl font-bold" style={{ letterSpacing: "-0.04em" }}>qrew</span>
          </div>

          {/* Credits display */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="rounded-xl p-4 cursor-pointer"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
            onClick={() => setShowCredits(true)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: "#9CA3AF" }}>Credits Balance</span>
              <Zap size={14} style={{ color: "#6366F1" }} />
            </div>
            <div className="text-2xl font-bold" style={{ color: "#6366F1" }}>
              {currentCredits.toFixed(1)}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setShowCredits(true); }}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all"
              style={{ background: "#6366F1", color: "#fff" }}
            >
              <ShoppingCart size={12} />
              Buy More
            </button>
          </motion.div>
        </div>

        <nav className="flex-1 p-4">
          <motion.button
            whileHover={{ x: 4 }}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all"
            style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </motion.button>
        </nav>

        <div className="p-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#6366F1", color: "#fff" }}>
              {userEmail[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "#F5F5F5" }}>{userEmail}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-all"
            style={{ background: "rgba(255,255,255,0.05)", color: "#9CA3AF", border: "1px solid rgba(255,255,255,0.05)" }}
          >
            <LogOut size={12} />
            Sign Out
          </motion.button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Payment success banner */}
        <AnimatePresence>
          {successBanner && (
            <motion.div
              initial={{ opacity: 0, y: -40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="flex items-center justify-center py-3 text-sm font-semibold"
              style={{ background: "linear-gradient(135deg, #10B981, #059669)", color: "#fff", boxShadow: "0 4px 20px rgba(16,185,129,0.3)" }}
            >
              <CheckCircle size={16} className="mr-2" />
              Credits added to your account!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile nav */}
        <nav className="lg:hidden flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.05)", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
            >
              <Sparkles size={14} color="#fff" />
            </motion.div>
            <span className="text-lg font-bold" style={{ letterSpacing: "-0.04em" }}>qrew</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer"
              style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
              onClick={() => setShowCredits(true)}
            >
              <Zap size={12} style={{ color: "#6366F1" }} />
              <span className="text-xs font-semibold" style={{ color: "#6366F1" }}>
                {currentCredits.toFixed(1)}
              </span>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-6 py-12">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between mb-12"
            >
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ letterSpacing: "-0.03em" }}>
                  Your Companies
                </h1>
                <p className="text-sm" style={{ color: "#9CA3AF" }}>
                  {startups.length === 0
                    ? "No companies yet — start your first"
                    : `${startups.length} compan${startups.length === 1 ? "y" : "ies"} · Building the future`}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                  boxShadow: "0 0 30px rgba(99,102,241,0.4)",
                }}
              >
                <Plus size={16} />
                Add Company
              </motion.button>
            </motion.div>

            {/* Empty state */}
            {startups.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center justify-center py-32 text-center"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-3xl"
                  style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", boxShadow: "0 8px 32px rgba(99,102,241,0.2)" }}
                >
                  🚀
                </motion.div>
                <h2 className="text-2xl font-bold mb-3">No companies yet</h2>
                <p className="text-base max-w-md leading-relaxed mb-8" style={{ color: "#9CA3AF" }}>
                  Describe your startup idea and your AI team will research, build, and launch it automatically.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 rounded-xl px-8 py-4 text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    boxShadow: "0 0 30px rgba(99,102,241,0.4)",
                  }}
                >
                  <Plus size={18} />
                  Add Your First Company
                </motion.button>
              </motion.div>
            )}

            {/* Companies grid */}
            {startups.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {startups.map((startup, i) => (
                  <StartupCard key={startup.id} startup={startup} index={i} />
                ))}

                {/* Add new card */}
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: startups.length * 0.05, duration: 0.4 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => setShowModal(true)}
                  className="rounded-2xl border border-dashed flex flex-col items-center justify-center gap-4 p-8 transition-all min-h-[280px]"
                  style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.03)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "#6366F1";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(99,102,241,0.3)";
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.03)";
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(99,102,241,0.1)" }}>
                    <Plus size={24} style={{ color: "#6366F1" }} />
                  </div>
                  <span className="text-sm font-semibold" style={{ color: "#6366F1" }}>New company</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Company Modal */}
      <AnimatePresence>
        {showModal && (
          <AddCompanyModal
            onClose={() => { setShowModal(false); setPendingIdea(undefined); }}
            prefillIdea={pendingIdea}
          />
        )}
      </AnimatePresence>

      {/* Credits Modal */}
      {showCredits && (
        <CreditsModal
          creditsBalance={currentCredits}
          onClose={() => setShowCredits(false)}
        />
      )}
    </div>
  );
}

// Made with Bob
