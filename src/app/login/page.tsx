"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    setLoading(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A]">
      {/* Radial glow top-right */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 0%, rgba(99,102,241,0.10), transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-[#111111] border border-[#1F1F1F] rounded-2xl p-10 max-w-md w-full mx-4"
      >
        {/* Logo */}
        <div className="flex flex-col items-center">
          <span
            className="text-3xl font-bold text-white"
            style={{ letterSpacing: "-0.04em" }}
          >
            qrew
          </span>
          <div className="mt-2 h-0.5 w-8 rounded-full bg-[#6366F1]" />
          <p className="text-lg mt-4" style={{ color: "#888888" }}>
            Your AI founding team.
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-[#1F1F1F] my-8" />

        {/* Google button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="bg-[#1A1A1A] border border-[#2A2A2A] text-white rounded-xl py-3.5 px-6 w-full flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50"
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.borderColor = "#6366F1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#2A2A2A";
          }}
        >
          <GoogleIcon />
          <span className="text-sm font-medium">
            {loading ? "Redirecting…" : "Continue with Google"}
          </span>
        </button>

        <p className="text-xs text-center mt-4" style={{ color: "#444444" }}>
          By continuing you agree to our Terms and Privacy Policy
        </p>
      </motion.div>

      <p className="text-xs text-center mt-8" style={{ color: "#333333" }}>
        © 2026 Qrew
      </p>
    </div>
  );
}
