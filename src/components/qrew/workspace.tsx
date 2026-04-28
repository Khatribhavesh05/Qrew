"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, Copy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Company, Employee } from "@/types";

// ─── Local types ────────────────────────────────────────────────────────────

type LocalMessage = {
  id: string;
  employeeId: string;
  role: "user" | "assistant";
  content: string;
};

type EmployeeMeta = {
  emoji: string;
  color: string;
  placeholder: string;
  outputLabel: string;
  emptyOutput: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPLOYEE_META: Record<Employee["role"], EmployeeMeta> = {
  research: {
    emoji: "🔍",
    color: "#6366F1",
    placeholder: "Ask your Research Employee...",
    outputLabel: "Research Report",
    emptyOutput: "Research reports and market analysis will appear here.",
  },
  strategy: {
    emoji: "🎯",
    color: "#10B981",
    placeholder: "Ask your Strategy Employee...",
    outputLabel: "Strategy Roadmap",
    emptyOutput: "Strategic roadmaps and plans will appear here.",
  },
  launch: {
    emoji: "🚀",
    color: "#F59E0B",
    placeholder: "Ask your Launch Employee...",
    outputLabel: "Launch Assets",
    emptyOutput: "Launch copy and channel assets will appear here.",
  },
};

const MOCK_RESPONSES: Record<Employee["role"], string> = {
  research: `Here's what I found based on your query:

**Market Overview**
The market shows strong growth signals with 23% YoY expansion. Three dominant players occupy ~60% share, leaving significant white space in the mid-market.

**Key Insights**
• Customer acquisition costs are rising 15% annually for incumbents
• NPS scores in the category average 34 — well below the 50+ threshold for strong retention
• No competitor has cracked the SMB segment below $2K ARR

**Opportunity**
Target the underserved mid-market. Lead with ease of use, price competitively at $49/mo to outflank enterprise-first players.

**Recommended Next Step**
Run 10 discovery calls with potential users in the mid-market segment to validate the positioning.`,

  strategy: `Based on your context, here's the 90-day roadmap:

**Phase 1 — Validate (Days 1–30)**
→ Sign 10 design partners from your existing network
→ Run weekly 30-min feedback calls
→ Identify the single highest-value use case

**Phase 2 — Build (Days 31–60)**
→ Ship a focused MVP around the winning use case
→ Set up lightweight onboarding (Loom walkthrough + docs)
→ Establish $49/mo pricing with an annual plan option

**Phase 3 — Launch (Days 61–90)**
→ Product Hunt launch with design partners seeding reviews
→ Write 3 SEO posts targeting high-intent keywords
→ Activate 2 partnership channels for distribution

**Success Metrics**
- 10 paying customers by day 60
- 40% week-1 retention by day 90
- $2K MRR at launch`,

  launch: `Here's your launch copy across all channels:

**Product Hunt Tagline**
Your AI founding team — Research, Strategy, and Launch in one OS.

**Product Hunt Description**
Solo founders compete against entire teams. Qrew gives you three AI employees that share company context, collaborate, and produce real output. Not just chat — actual deliverables.

**Tweet Thread**
1/ Just launched Qrew — an OS for solo founders with actual AI employees (not just chatbots).

Research. Strategy. Launch. They share context, collaborate, and ship real work. 🧵

2/ The problem: solo founders need a researcher, a strategist, and a marketer all at once. That's impossible alone.

3/ So we built three AI employees that work together as your founding team. Same company context. Different specialties.

**Cold Email Subject Line**
You're competing against teams. This evens the odds.

**Reddit Post Title**
I built an AI founding team for solo founders — here's what I learned after 6 months`,
};

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: "rgba(255,255,255,0.04)" }}
    />
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface WorkspaceProps {
  company: Company;
  employees: Employee[];
  userId: string;
  userEmail: string;
}

// ─── Workspace ───────────────────────────────────────────────────────────────

export function Workspace({
  company,
  employees,
  userEmail,
}: WorkspaceProps) {
  const [activeEmployeeId, setActiveEmployeeId] = useState(
    employees[0]?.id ?? ""
  );
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [outputByEmployee, setOutputByEmployee] = useState<
    Record<string, string>
  >({});
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [copiedOutput, setCopiedOutput] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadedEmployeesRef = useRef<Set<string>>(new Set());

  const activeEmployee = employees.find((e) => e.id === activeEmployeeId);
  const meta = activeEmployee ? EMPLOYEE_META[activeEmployee.role] : null;
  const activeMessages = messages.filter(
    (m) => m.employeeId === activeEmployeeId
  );
  const activeOutput = activeEmployee
    ? outputByEmployee[activeEmployee.id]
    : undefined;
  const userInitials = userEmail.slice(0, 2).toUpperCase();

  // Load messages for the active employee (once per employee per session)
  useEffect(() => {
    if (!activeEmployeeId || loadedEmployeesRef.current.has(activeEmployeeId))
      return;

    setLoadingMessages(true);
    loadedEmployeesRef.current.add(activeEmployeeId);

    supabase
      .from("messages")
      .select("*")
      .eq("employee_id", activeEmployeeId)
      .eq("company_id", company.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const rows = (data ?? []) as Array<{
          id: string;
          employee_id: string;
          role: string;
          content: string;
        }>;
        const loaded: LocalMessage[] = rows.map((r) => ({
          id: r.id,
          employeeId: r.employee_id,
          role: r.role as "user" | "assistant",
          content: r.content,
        }));
        setMessages((prev) => [...prev, ...loaded]);
        setLoadingMessages(false);
      });
  }, [activeEmployeeId, company.id]);

  // Scroll to bottom whenever active messages or streaming text changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages.length]);

  useEffect(() => {
    if (isStreaming) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [streamingText, isStreaming]);

  // Reset loading state when switching employees
  const handleEmployeeSelect = (id: string) => {
    if (id === activeEmployeeId) return;
    setActiveEmployeeId(id);
    if (!loadedEmployeesRef.current.has(id)) {
      setLoadingMessages(true);
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming || !activeEmployee) return;

    const content = input.trim();
    const userMsg: LocalMessage = {
      id: crypto.randomUUID(),
      employeeId: activeEmployeeId,
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    // Persist user message (fire and forget)
    supabase.from("messages").insert({
      employee_id: activeEmployeeId,
      company_id: company.id,
      role: "user" as const,
      content,
    });

    // Start streaming after a brief thinking delay
    setIsStreaming(true);
    setStreamingText("");

    if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);

    setTimeout(() => {
      const full = MOCK_RESPONSES[activeEmployee.role];
      let i = 0;

      streamIntervalRef.current = setInterval(() => {
        i += 3;
        setStreamingText(full.slice(0, i));

        if (i >= full.length) {
          clearInterval(streamIntervalRef.current!);
          streamIntervalRef.current = null;

          const assistantMsg: LocalMessage = {
            id: crypto.randomUUID(),
            employeeId: activeEmployeeId,
            role: "assistant",
            content: full,
          };

          setMessages((prev) => [...prev, assistantMsg]);
          setOutputByEmployee((prev) => ({
            ...prev,
            [activeEmployeeId]: full,
          }));
          setStreamingText("");
          setIsStreaming(false);

          // Persist assistant message
          supabase.from("messages").insert({
            employee_id: activeEmployeeId,
            company_id: company.id,
            role: "assistant" as const,
            content: full,
          });
        }
      }, 18);
    }, 750);

    inputRef.current?.focus();
  }, [input, isStreaming, activeEmployee, activeEmployeeId, company.id]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const handleCopyOutput = async () => {
    if (!activeOutput) return;
    await navigator.clipboard.writeText(activeOutput);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (streamIntervalRef.current) clearInterval(streamIntervalRef.current);
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative flex h-full w-full pb-16 md:pb-0">
      {/* ── LEFT SIDEBAR (desktop) ─────────────────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="hidden md:flex w-60 shrink-0 flex-col border-r"
        style={{ background: "#111111", borderColor: "#1F1F1F" }}
      >
        {/* Logo + company */}
        <div className="px-5 pb-4 pt-6">
          <span
            className="text-xl font-bold"
            style={{ color: "#6366F1", letterSpacing: "-0.04em" }}
          >
            qrew
          </span>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className="truncate text-sm font-medium"
              style={{ color: "#F5F5F5" }}
            >
              {company.name}
            </span>
          </div>
        </div>

        <div className="mx-4 h-px" style={{ background: "#1F1F1F" }} />

        {/* Team list */}
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
          <span
            className="px-2 pb-2 text-xs font-semibold uppercase tracking-widest"
            style={{ color: "#525252" }}
          >
            Your Team
          </span>

          {employees.map((employee, i) => {
            const empMeta = EMPLOYEE_META[employee.role];
            const isActive = employee.id === activeEmployeeId;

            return (
              <motion.button
                key={employee.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                onClick={() => handleEmployeeSelect(employee.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-all duration-150"
                style={{
                  background: isActive ? "rgba(99,102,241,0.1)" : "transparent",
                  borderLeft: `2px solid ${isActive ? empMeta.color : "transparent"}`,
                }}
              >
                <span className="text-lg leading-none">{empMeta.emoji}</span>
                <div className="flex min-w-0 flex-col">
                  <span
                    className="truncate text-sm font-medium"
                    style={{ color: isActive ? "#F5F5F5" : "#A3A3A3" }}
                  >
                    {employee.name}
                  </span>
                  <span
                    className="text-xs capitalize"
                    style={{ color: "#525252" }}
                  >
                    {employee.role}
                  </span>
                </div>
                {/* Status dot */}
                <div
                  className="ml-auto size-2 shrink-0 rounded-full"
                  style={{
                    background:
                      isStreaming && isActive ? "#F59E0B" : "#10B981",
                    boxShadow:
                      isStreaming && isActive
                        ? "0 0 6px rgba(245,158,11,0.6)"
                        : "0 0 6px rgba(16,185,129,0.4)",
                  }}
                />
              </motion.button>
            );
          })}
        </div>

        {/* User section */}
        <div
          className="shrink-0 border-t px-3 py-4"
          style={{ borderColor: "#1F1F1F" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
              style={{ background: "#1F1F1F", color: "#F5F5F5" }}
            >
              {userInitials}
            </div>
            <span
              className="min-w-0 flex-1 truncate text-xs"
              style={{ color: "#A3A3A3" }}
            >
              {userEmail}
            </span>
            <button
              onClick={handleSignOut}
              className="shrink-0 rounded-md p-1.5 transition-colors"
              style={{ color: "#525252" }}
              title="Sign out"
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "#F5F5F5")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "#525252")
              }
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* ── CENTER PANEL ──────────────────────────────────────────────────── */}
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="flex min-w-0 flex-1 flex-col"
        style={{ background: "#0A0A0A" }}
      >
        {/* Top bar */}
        <div
          className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
          style={{ borderColor: "#1F1F1F" }}
        >
          {meta && activeEmployee ? (
            <>
              <span className="text-base">{meta.emoji}</span>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "#F5F5F5" }}
                >
                  {activeEmployee.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <motion.div
                    className="size-1.5 rounded-full"
                    animate={
                      isStreaming
                        ? { opacity: [1, 0.4, 1] }
                        : { opacity: 1 }
                    }
                    transition={
                      isStreaming
                        ? { duration: 1, repeat: Infinity }
                        : {}
                    }
                    style={{ background: isStreaming ? "#F59E0B" : "#10B981" }}
                  />
                  <span className="text-xs" style={{ color: "#525252" }}>
                    {isStreaming ? "thinking…" : "idle"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <SkeletonLine className="h-8 w-32" />
          )}
        </div>

        {/* Messages */}
        <div
          className="flex flex-1 flex-col overflow-y-auto"
          style={{ minHeight: 0 }}
        >
          {loadingMessages ? (
            <div className="flex flex-col gap-3 p-4">
              <SkeletonLine className="h-10 w-2/3 self-end" />
              <SkeletonLine className="h-16 w-3/4" />
              <SkeletonLine className="h-10 w-1/2 self-end" />
            </div>
          ) : activeMessages.length === 0 && !isStreaming ? (
            <motion.div
              key={activeEmployeeId + "-empty-chat"}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-1 flex-col items-center justify-center gap-3 p-8"
            >
              <span className="text-5xl opacity-20">{meta?.emoji}</span>
              <p
                className="max-w-xs text-center text-sm leading-relaxed"
                style={{ color: "#525252" }}
              >
                {`${activeEmployee?.name} is ready. Ask anything about ${activeEmployee?.role}.`}
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3 p-4 mt-auto">
              <AnimatePresence initial={false}>
                {activeMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-end gap-2 ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <span className="shrink-0 text-sm leading-none pb-1">
                        {meta?.emoji}
                      </span>
                    )}
                    <div
                      className="max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                      style={
                        msg.role === "user"
                          ? {
                              background: "#6366F1",
                              color: "#F5F5F5",
                              borderBottomRightRadius: "4px",
                            }
                          : {
                              background: "#161616",
                              border: "1px solid #1F1F1F",
                              color: "#E5E5E5",
                              borderBottomLeftRadius: "4px",
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}

                {/* Streaming bubble */}
                {isStreaming && (
                  <motion.div
                    key="streaming-bubble"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-end gap-2"
                  >
                    <span className="shrink-0 pb-1 text-sm leading-none">
                      {meta?.emoji}
                    </span>
                    <div
                      className="max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                      style={{
                        background: "#161616",
                        border: "1px solid #1F1F1F",
                        color: "#E5E5E5",
                        borderBottomLeftRadius: "4px",
                      }}
                    >
                      {streamingText ? (
                        <>
                          {streamingText}
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="ml-0.5 inline-block h-3.5 w-0.5 align-text-bottom"
                            style={{ background: "#6366F1" }}
                          />
                        </>
                      ) : (
                        <span className="flex items-center gap-1 py-0.5">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="block size-1.5 rounded-full"
                              style={{ background: "#525252" }}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: i * 0.2,
                              }}
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Scroll anchor */}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input bar */}
        <div
          className="shrink-0 border-t p-4"
          style={{ borderColor: "#1F1F1F" }}
        >
          <div
            className="flex items-end gap-3 rounded-xl border px-4 py-3 transition-colors duration-150"
            style={{ background: "#111111", borderColor: "#2A2A2A" }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder={meta?.placeholder ?? "Send a message…"}
              rows={1}
              disabled={isStreaming}
              className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-neutral-600 disabled:opacity-50"
              style={{
                color: "#F5F5F5",
                lineHeight: "1.6",
                maxHeight: "120px",
                overflowY: "auto",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="flex size-8 shrink-0 items-center justify-center rounded-lg transition-all duration-150 disabled:opacity-30"
              style={{
                background: input.trim() && !isStreaming ? "#6366F1" : "#1F1F1F",
                color: "#F5F5F5",
                boxShadow:
                  input.trim() && !isStreaming
                    ? "0 0 16px rgba(99,102,241,0.3)"
                    : "none",
              }}
            >
              <Send size={14} />
            </button>
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: "#3A3A3A" }}>
            Shift + Enter for new line
          </p>
        </div>
      </motion.main>

      {/* ── RIGHT PANEL (desktop lg+) ──────────────────────────────────────── */}
      <motion.aside
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="hidden lg:flex w-[380px] shrink-0 flex-col border-l"
        style={{ background: "#111111", borderColor: "#1F1F1F" }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between border-b px-5 py-3"
          style={{ borderColor: "#1F1F1F" }}
        >
          <span className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>
            Output
          </span>
          {activeOutput && (
            <button
              onClick={handleCopyOutput}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
              style={{ color: copiedOutput ? "#10B981" : "#525252" }}
              onMouseEnter={(e) => {
                if (!copiedOutput) e.currentTarget.style.color = "#A3A3A3";
              }}
              onMouseLeave={(e) => {
                if (!copiedOutput) e.currentTarget.style.color = "#525252";
              }}
            >
              {copiedOutput ? <Check size={12} /> : <Copy size={12} />}
              {copiedOutput ? "Copied!" : "Copy all"}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {!activeOutput ? (
              <motion.div
                key={activeEmployeeId + "-out-empty"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex h-full flex-col items-center justify-center gap-3"
              >
                <span className="text-3xl" style={{ opacity: 0.15 }}>
                  {meta?.emoji}
                </span>
                <p
                  className="max-w-[220px] text-center text-xs leading-relaxed"
                  style={{ color: "#525252" }}
                >
                  {meta?.emptyOutput}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={activeEmployeeId + "-out-content"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{meta?.emoji}</span>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#525252" }}
                  >
                    {meta?.outputLabel}
                  </span>
                </div>
                <div
                  className="rounded-xl border p-4 text-xs leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: "#0D0D0D",
                    borderColor: "#1F1F1F",
                    color: "#A3A3A3",
                  }}
                >
                  {activeOutput}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* ── MOBILE BOTTOM NAV ─────────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex border-t"
        style={{ background: "#111111", borderColor: "#1F1F1F" }}
      >
        {employees.map((employee) => {
          const empMeta = EMPLOYEE_META[employee.role];
          const isActive = employee.id === activeEmployeeId;

          return (
            <button
              key={employee.id}
              onClick={() => handleEmployeeSelect(employee.id)}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors"
              style={{
                color: isActive ? empMeta.color : "#525252",
                borderTop: `2px solid ${isActive ? empMeta.color : "transparent"}`,
                marginTop: "-1px",
              }}
            >
              <span className="text-xl leading-none">{empMeta.emoji}</span>
              <span className="text-xs font-medium">{employee.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
