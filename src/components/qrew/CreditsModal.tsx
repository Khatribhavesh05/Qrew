"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Loader2, Check } from "lucide-react";
import { CREDIT_PACKAGES } from "@/lib/credits";
import type { CreditPackage } from "@/lib/credits";

interface CreditsModalProps {
  creditsBalance: number;
  onClose: () => void;
}

export function CreditsModal({ creditsBalance, onClose }: CreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (pkg: CreditPackage) => {
    setLoading(pkg.id);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        alert(data.error ?? "Failed to create payment");
        setLoading(null);
        return;
      }
      window.location.href = data.url;
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl border p-6"
          style={{ background: "#111111", borderColor: "#1F1F1F" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold" style={{ color: "#F5F5F5", letterSpacing: "-0.02em" }}>
                Buy Credits
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "#525252" }}>
                Current balance:{" "}
                <span style={{ color: "#6366F1" }}>{creditsBalance.toFixed(1)} credits</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors"
              style={{ color: "#525252" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#525252")}
            >
              <X size={16} />
            </button>
          </div>

          {/* Packages */}
          <div className="flex flex-col gap-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                loading={loading === pkg.id}
                disabled={loading !== null}
                onPurchase={() => void handlePurchase(pkg)}
              />
            ))}
          </div>

          <p className="text-xs text-center mt-5" style={{ color: "#333" }}>
            Secured by Dodo Payments · No subscription
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function PackageCard({
  pkg,
  loading,
  disabled,
  onPurchase,
}: {
  pkg: CreditPackage;
  loading: boolean;
  disabled: boolean;
  onPurchase: () => void;
}) {
  return (
    <motion.div
      whileHover={!disabled ? { scale: 1.01 } : {}}
      className="flex items-center gap-4 rounded-xl border p-4 cursor-pointer transition-all relative"
      style={{
        background: pkg.popular ? "rgba(99,102,241,0.06)" : "#0D0D0D",
        borderColor: pkg.popular ? "rgba(99,102,241,0.35)" : "#1F1F1F",
      }}
      onClick={disabled ? undefined : onPurchase}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLDivElement).style.borderColor = pkg.popular ? "rgba(99,102,241,0.6)" : "#2A2A2A";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = pkg.popular ? "rgba(99,102,241,0.35)" : "#1F1F1F";
      }}
    >
      {pkg.popular && (
        <span
          className="absolute -top-2.5 left-4 text-xs rounded-full px-2.5 py-0.5 font-semibold"
          style={{ background: "#6366F1", color: "#fff" }}
        >
          Popular
        </span>
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(99,102,241,0.12)" }}
      >
        <Zap size={16} style={{ color: "#6366F1" }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>
            {pkg.credits} credits
          </span>
          {pkg.savings && (
            <span
              className="text-xs rounded-full px-2 py-0.5 font-medium"
              style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}
            >
              {pkg.savings}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5" style={{ color: "#525252" }}>
          ${pkg.price} · ~{pkg.credits} standard builds
        </p>
      </div>

      {/* CTA */}
      <motion.button
        whileHover={!disabled ? { scale: 1.04 } : {}}
        whileTap={!disabled ? { scale: 0.96 } : {}}
        disabled={disabled}
        onClick={(e) => { e.stopPropagation(); if (!disabled) onPurchase(); }}
        className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        style={{ background: "#6366F1", boxShadow: disabled ? "none" : "0 0 12px rgba(99,102,241,0.35)" }}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Check size={12} />
        )}
        ${pkg.price}
      </motion.button>
    </motion.div>
  );
}
