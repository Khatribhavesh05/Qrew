"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Sparkles } from "lucide-react";

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

interface Particle {
  id: number;
  left: string;
  top: string;
  duration: number;
  delay: number;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles only on client side to avoid hydration mismatch
    const generatedParticles: Particle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 3 + Math.random() * 2,
      delay: Math.random() * 5,
    }));
    setParticles(generatedParticles);
  }, []);

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0A]">
      {/* Animated gradient background - matching landing page aesthetic */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orb - top right */}
        <motion.div
          className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background: "radial-gradient(circle, #6366F1 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Secondary gradient orb - bottom left */}
        <motion.div
          className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl"
          style={{
            background: "radial-gradient(circle, #10B981 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Accent gradient orb - center */}
        <motion.div
          className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{
            background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute h-1 w-1 rounded-full bg-white"
          style={{
            left: particle.left,
            top: particle.top,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Main login card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Glassmorphism card */}
        <div
          className="relative rounded-3xl border border-white/10 p-10 shadow-2xl"
          style={{
            background: "rgba(17, 17, 17, 0.7)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Subtle inner glow */}
          <div
            className="absolute inset-0 rounded-3xl opacity-50"
            style={{
              background:
                "radial-gradient(circle at top, rgba(99, 102, 241, 0.1), transparent 60%)",
            }}
          />

          {/* Content */}
          <div className="relative">
            {/* Logo and branding */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col items-center mb-8"
            >
              {/* Logo with sparkle effect */}
              <div className="relative mb-4">
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -top-2 -right-2"
                >
                  <Sparkles className="h-5 w-5 text-[#6366F1]" />
                </motion.div>
                
                <h1
                  className="text-5xl font-bold text-white tracking-tight"
                  style={{
                    background: "linear-gradient(135deg, #FFFFFF 0%, #A0A0A0 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Qrew
                </h1>
              </div>

              {/* Animated underline */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 48 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                className="h-1 rounded-full bg-gradient-to-r from-[#6366F1] to-[#10B981]"
              />

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="mt-6 text-lg text-gray-400 font-medium"
              >
                Your AI founding team
              </motion.p>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-8"
            />

            {/* Google Sign In Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.button
                onClick={handleGoogleSignIn}
                disabled={loading}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group relative w-full overflow-hidden rounded-xl border border-white/10 bg-white/5 py-4 px-6 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#6366F1]/20 to-[#10B981]/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Button content */}
                <div className="relative flex items-center justify-center gap-3">
                  <GoogleIcon />
                  <span className="text-base font-semibold text-white">
                    {loading ? "Redirecting..." : "Continue with Google"}
                  </span>
                </div>

                {/* Shimmer effect on hover */}
                <motion.div
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  animate={{
                    translateX: ["100%", "100%"],
                  }}
                  transition={{
                    duration: 0,
                  }}
                  whileHover={{
                    translateX: ["-100%", "200%"],
                    transition: {
                      duration: 1,
                      ease: "easeInOut",
                    },
                  }}
                />
              </motion.button>
            </motion.div>

            {/* Terms and Privacy */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-6 text-center text-xs text-gray-500"
            >
              By continuing you agree to our{" "}
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                Terms
              </span>{" "}
              and{" "}
              <span className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                Privacy Policy
              </span>
            </motion.p>
          </div>
        </div>

        {/* Glow effect behind card */}
        <div
          className="absolute inset-0 -z-10 rounded-3xl opacity-30 blur-2xl"
          style={{
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(16, 185, 129, 0.3))",
          }}
        />
      </motion.div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="relative z-10 mt-8 text-xs text-gray-600"
      >
        © 2026 Qrew
      </motion.p>
    </div>
  );
}

// Made with Bob
