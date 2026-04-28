"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, LogOut, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
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


// ─── Markdown components ─────────────────────────────────────────────────────
// Styled for dark bubble backgrounds (#161616). Uses inline styles to keep
// colours consistent with the Qrew design system regardless of global CSS.

const MD: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-3 text-[0.95rem] font-bold first:mt-0 last:mb-0" style={{ color: "#F5F5F5" }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-2.5 text-[0.875rem] font-semibold first:mt-0 last:mb-0" style={{ color: "#F5F5F5" }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2 text-sm font-semibold first:mt-0 last:mb-0" style={{ color: "#EFEFEF" }}>
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong style={{ color: "#F5F5F5", fontWeight: 600 }}>{children}</strong>
  ),
  em: ({ children }) => (
    <em style={{ color: "#C0C0C0" }}>{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-0.5 pl-4 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-0.5 pl-4 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote
      className="my-2 border-l-2 pl-3 first:mt-0 last:mb-0"
      style={{ borderColor: "#6366F1", color: "#A3A3A3" }}
    >
      {children}
    </blockquote>
  ),
  hr: () => (
    <hr className="my-3 last:mb-0" style={{ border: "none", borderTop: "1px solid #1F1F1F" }} />
  ),
  pre: ({ children }) => (
    <pre
      className="my-2 overflow-x-auto rounded-lg p-3 text-[0.78rem] first:mt-0 last:mb-0"
      style={{ background: "#0D0D0D", border: "1px solid #1F1F1F" }}
    >
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className);
    return isBlock ? (
      <code
        className={className}
        style={{ fontFamily: "var(--font-geist-mono), monospace", color: "#A3A3A3" }}
      >
        {children}
      </code>
    ) : (
      <code
        style={{
          background: "#1A1A1A",
          border: "1px solid #2A2A2A",
          borderRadius: "4px",
          padding: "1px 4px",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: "0.85em",
          color: "#C0C0C0",
        }}
      >
        {children}
      </code>
    );
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#6366F1", textDecoration: "underline" }}
    >
      {children}
    </a>
  ),
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
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
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

  // Reset loading state when switching employees; cancel any in-flight request
  const handleEmployeeSelect = (id: string) => {
    if (id === activeEmployeeId) return;
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingText("");
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

    // Abort any prior request and start streaming
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsStreaming(true);
    setStreamingText("");
    inputRef.current?.focus();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          message: content,
          employeeRole: activeEmployee.role,
          companyName: company.name,
          companyDescription: company.description,
          // Send last 20 messages as context
          conversationHistory: activeMessages.slice(-20).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed (${response.status})`);
      }
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setStreamingText(fullText);
      }

      const assistantMsg: LocalMessage = {
        id: crypto.randomUUID(),
        employeeId: activeEmployeeId,
        role: "assistant",
        content: fullText,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setOutputByEmployee((prev) => ({
        ...prev,
        [activeEmployeeId]: fullText,
      }));
      setStreamingText("");
      setIsStreaming(false);

      // Persist assistant message (fire and forget)
      supabase.from("messages").insert({
        employee_id: activeEmployeeId,
        company_id: company.id,
        role: "assistant" as const,
        content: fullText,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Navigation away — clean up silently
      } else {
        const errMsg = err instanceof Error ? err.message : "Something went wrong";
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            employeeId: activeEmployeeId,
            role: "assistant",
            content: `Sorry, I ran into an error: ${errMsg}`,
          },
        ]);
      }
      setStreamingText("");
      setIsStreaming(false);
    }
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

  const handleCopyMessage = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
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
            style={{
              color: "var(--qrew-indigo)",
              letterSpacing: "-0.04em",
              textShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
            }}
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
                      className={`flex max-w-[70%] flex-col gap-1 ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "whitespace-pre-wrap"
                            : "min-w-0"
                        }`}
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
                        {msg.role === "user" ? (
                          msg.content
                        ) : (
                          <ReactMarkdown components={MD}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>

                      {/* Copy button — assistant messages only */}
                      {msg.role === "assistant" && (
                        <button
                          onClick={() =>
                            handleCopyMessage(msg.id, msg.content)
                          }
                          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors duration-150"
                          style={{
                            color:
                              copiedMsgId === msg.id ? "#10B981" : "#525252",
                          }}
                          onMouseEnter={(e) => {
                            if (copiedMsgId !== msg.id)
                              e.currentTarget.style.color = "#A3A3A3";
                          }}
                          onMouseLeave={(e) => {
                            if (copiedMsgId !== msg.id)
                              e.currentTarget.style.color = "#525252";
                          }}
                        >
                          {copiedMsgId === msg.id ? (
                            <Check size={11} />
                          ) : (
                            <Copy size={11} />
                          )}
                          <span>
                            {copiedMsgId === msg.id ? "Copied!" : "Copy"}
                          </span>
                        </button>
                      )}
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
                  className="rounded-xl border p-4 text-xs leading-relaxed"
                  style={{
                    background: "#0D0D0D",
                    borderColor: "#1F1F1F",
                    color: "#A3A3A3",
                  }}
                >
                  <ReactMarkdown components={MD}>{activeOutput}</ReactMarkdown>
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
