"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
    >
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
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    setLoading(false);
  };

  return (
    <div
      className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden"
      style={{ background: "#0A0A0A" }}
    >
      {/* Subtle radial glow behind the card */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(99,102,241,0.12), transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-[420px] px-4"
      >
        <Card
          className="border-0 text-center shadow-none"
          style={{
            background: "#111111",
            borderRadius: "12px",
            outline: "1px solid #1F1F1F",
          }}
        >
          <CardContent className="flex flex-col items-center gap-8 px-8 py-12">
            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="flex flex-col items-center gap-3"
            >
              <span
                className="text-4xl font-bold tracking-tighter"
                style={{ color: "#F5F5F5", letterSpacing: "-0.04em" }}
              >
                qrew
              </span>
              <div
                className="h-px w-10 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, #6366F1, transparent)",
                }}
              />
            </motion.div>

            {/* Headline + subtext */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col gap-2.5"
            >
              <h1
                className="text-2xl font-semibold leading-tight tracking-tight"
                style={{ color: "#F5F5F5", letterSpacing: "-0.02em" }}
              >
                Your AI founding team awaits
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#A3A3A3" }}>
                Research. Strategy. Launch.{" "}
                <span style={{ color: "#F5F5F5" }}>All in one place.</span>
              </p>
            </motion.div>

            {/* Google sign-in */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full"
            >
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-lg px-6 py-3.5 text-sm font-medium transition-all duration-200 disabled:opacity-50"
                style={{
                  background: "#161616",
                  border: "1px solid #2A2A2A",
                  color: "#F5F5F5",
                  borderRadius: "8px",
                }}
                onMouseEnter={(e) => {
                  if (loading) return;
                  e.currentTarget.style.borderColor = "#6366F1";
                  e.currentTarget.style.boxShadow =
                    "0 0 24px rgba(99,102,241,0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#2A2A2A";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <GoogleIcon />
                {loading ? "Redirecting…" : "Continue with Google"}
              </button>
            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="text-xs leading-relaxed"
              style={{ color: "#525252" }}
            >
              By continuing you agree to our{" "}
              <a
                href="#"
                className="underline underline-offset-2 transition-colors"
                style={{ color: "#525252" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#A3A3A3")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#525252")
                }
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="underline underline-offset-2 transition-colors"
                style={{ color: "#525252" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "#A3A3A3")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "#525252")
                }
              >
                Privacy Policy
              </a>
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
