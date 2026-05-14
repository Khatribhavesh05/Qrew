"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ArrowRight, CheckCircle, Loader2, AlertCircle, Zap, ShoppingCart } from "lucide-react";
import type { Startup } from "@/types";
import { AddCompanyModal } from "./add-company-modal";
import { CreditsModal } from "./CreditsModal";

interface DashboardProps {
  startups: Startup[];
  userEmail: string;
  creditsBalance: number;
  paymentSuccess?: boolean;
  openBuy?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Loader2; pulse: boolean }> = {
  draft:         { label: "Processing",      color: "#525252", icon: Loader2,      pulse: false },
  researching:   { label: "Researching",     color: "#3B82F6", icon: Loader2,      pulse: true  },
  ready:         { label: "Ready to Build",  color: "#10B981", icon: CheckCircle,  pulse: false },
  building:      { label: "Building",        color: "#F59E0B", icon: Loader2,      pulse: true  },
  built:         { label: "Built",           color: "#8B5CF6", icon: Zap,          pulse: false },
  deployed:      { label: "Live",            color: "#10B981", icon: CheckCircle,  pulse: false },
  processing:    { label: "Processing",      color: "#525252", icon: Loader2,      pulse: false },
  naming:        { label: "Processing",      color: "#525252", icon: Loader2,      pulse: false },
  team_assembly: { label: "Processing",      color: "#525252", icon: Loader2,      pulse: false },
  report_ready:  { label: "Ready to Build",  color: "#10B981", icon: CheckCircle,  pulse: false },
  live:          { label: "Live",            color: "#10B981", icon: CheckCircle,  pulse: false },
  error:         { label: "Error",           color: "#EF4444", icon: AlertCircle,  pulse: false },
};

function StartupCard({ startup }: { startup: Startup }) {
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.015 }}
      onClick={handleClick}
      className="group relative rounded-xl border p-5 cursor-pointer transition-colors"
      style={{ background: "#111111", borderColor: "#1F1F1F" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#2A2A2A";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#1F1F1F";
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
          style={{ background: `${config?.color ?? "#6366F1"}18`, color: config?.color ?? "#6366F1" }}
        >
          {startup.name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
          style={{ background: `${config?.color ?? "#6366F1"}15`, color: config?.color ?? "#6366F1" }}
        >
          {isActive && <config.icon size={10} className="animate-spin" />}
          {config.label}
        </span>
      </div>

      <div className="mb-1">
        <h3 className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>
          {startup.name ?? "Unnamed Startup"}
        </h3>
        {startup.industry && (
          <p className="text-xs mt-0.5" style={{ color: "#525252" }}>
            {startup.industry}
          </p>
        )}
      </div>

      <p className="text-xs leading-relaxed mt-2 line-clamp-2" style={{ color: "#A3A3A3" }}>
        {startup.idea}
      </p>

      <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "#1A1A1A" }}>
        <span className="text-xs" style={{ color: "#525252" }}>
          {new Date(startup.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <ArrowRight
          size={14}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "#6366F1" }}
        />
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPendingIdea(stored);
      setShowModal(true);
    }
  }, []);

  useEffect(() => {
    if (paymentSuccess) {
      setSuccessBanner(true);
      // Clear the ?payment=success param without full reload
      const url = new URL(window.location.href);
      url.searchParams.delete("payment");
      router.replace(url.pathname + url.search, { scroll: false });
      const t = setTimeout(() => setSuccessBanner(false), 5000);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentSuccess]);

  useEffect(() => {
    if (openBuy) {
      setShowCredits(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("buy");
      router.replace(url.pathname + url.search, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openBuy]);

  useEffect(() => {
    setCurrentCredits(creditsBalance);
  }, [creditsBalance]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "#0A0A0A", color: "#F5F5F5" }}
    >
      {/* Ambient */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% -5%, rgba(99,102,241,0.07), transparent 60%)",
        }}
      />

      {/* Payment success banner */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 text-sm font-medium"
            style={{ background: "#10B981", color: "#fff" }}
          >
            <CheckCircle size={14} className="mr-2" />
            Credits added to your account!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 py-4 border-b max-w-7xl mx-auto w-full"
        style={{ borderColor: "#1F1F1F" }}
      >
        <span
          className="text-lg font-bold"
          style={{ color: "#6366F1", letterSpacing: "-0.04em" }}
        >
          qrew
        </span>
        <div className="flex items-center gap-3">
          {/* Credits balance */}
          <div
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <Zap size={12} style={{ color: "#6366F1" }} />
            <span className="text-xs font-semibold" style={{ color: "#6366F1" }}>
              {currentCredits.toFixed(1)} credits
            </span>
          </div>

          {/* Buy credits button */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCredits(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{
              background: "#111111",
              border: "1px solid #1F1F1F",
              color: "#A3A3A3",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#333";
              e.currentTarget.style.color = "#F5F5F5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#1F1F1F";
              e.currentTarget.style.color = "#A3A3A3";
            }}
          >
            <ShoppingCart size={12} />
            Buy Credits
          </motion.button>

          <span className="text-xs" style={{ color: "#525252" }}>
            {userEmail}
          </span>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Your Companies
            </h1>
            <p className="text-sm mt-1" style={{ color: "#A3A3A3" }}>
              {startups.length === 0
                ? "No companies yet — start your first"
                : `${startups.length} compan${startups.length === 1 ? "y" : "ies"}`}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              background: "#6366F1",
              boxShadow: "0 0 20px rgba(99,102,241,0.35)",
            }}
          >
            <Plus size={15} />
            Add Company
          </motion.button>
        </div>

        {/* Empty state */}
        {startups.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 text-2xl"
              style={{ background: "#111111", border: "1px solid #1F1F1F" }}
            >
              🚀
            </div>
            <h2 className="text-xl font-semibold mb-2">No companies yet</h2>
            <p className="text-sm max-w-xs leading-relaxed mb-8" style={{ color: "#A3A3A3" }}>
              Describe your startup idea and your AI team will research, build,
              and launch it automatically.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
              style={{
                background: "#6366F1",
                boxShadow: "0 0 24px rgba(99,102,241,0.35)",
              }}
            >
              <Plus size={15} />
              Add Your First Company
            </motion.button>
          </motion.div>
        )}

        {/* Companies grid */}
        {startups.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((startup, i) => (
              <motion.div
                key={startup.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <StartupCard startup={startup} />
              </motion.div>
            ))}

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: startups.length * 0.05 }}
              whileHover={{ scale: 1.015, borderColor: "#6366F1" }}
              onClick={() => setShowModal(true)}
              className="rounded-xl border border-dashed flex flex-col items-center justify-center gap-3 p-8 transition-colors min-h-[180px]"
              style={{ borderColor: "#1F1F1F", color: "#525252" }}
            >
              <Plus size={20} />
              <span className="text-sm">New company</span>
            </motion.button>
          </div>
        )}
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
