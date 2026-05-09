"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AgentChatPanelProps {
  open: boolean;
  agent: "alex" | "sam";
  startupId: string;
  onClose: () => void;
}

const AGENT_META = {
  alex: {
    emoji: "🔍",
    name: "Alex",
    role: "Research Agent",
    color: "#6366F1",
    placeholder: "Ask about market data, competitors, audience…",
    greeting: "Hey! I'm Alex, your research analyst. I've gone through the market data for your startup — what do you want to dig into?",
  },
  sam: {
    emoji: "📊",
    name: "Sam",
    role: "Strategy Agent",
    color: "#10B981",
    placeholder: "Ask about GTM, pricing, positioning…",
    greeting: "Hi, I'm Sam. I've mapped out your go-to-market and growth strategy. What strategic questions can I help you think through?",
  },
} as const;

export function AgentChatPanel({ open, agent, startupId, onClose }: AgentChatPanelProps) {
  const meta = AGENT_META[agent];
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: meta.greeting },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Reset on agent switch
  useEffect(() => {
    setMessages([{ role: "assistant", content: AGENT_META[agent].greeting }]);
    setInput("");
    setLoading(false);
  }, [agent]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId,
          agent,
          message: trimmed,
          // Pass full history so context accumulates; skip the initial greeting
          history: messages.slice(1),
        }),
      });

      const data = await res.json() as { reply?: string; error?: string };
      const reply = data.reply ?? "Sorry, I couldn't get a response right now.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Connection error — please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 35 }}
          className="fixed left-0 top-0 h-full z-40 flex flex-col"
          style={{
            width: 380,
            background: "#0E0E0E",
            borderRight: "1px solid #1F1F1F",
            boxShadow: "6px 0 40px rgba(0,0,0,0.6)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-4 border-b shrink-0"
            style={{ borderColor: "#1F1F1F" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
              >
                {meta.emoji}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>{meta.name}</p>
                <p className="text-xs" style={{ color: "#525252" }}>{meta.role}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 transition-colors"
              style={{ color: "#525252" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#A3A3A3")}
              onMouseLeave={e => (e.currentTarget.style.color = "#525252")}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
            style={{ overscrollBehavior: "contain" }}
          >
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mb-0.5"
                    style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}25` }}
                  >
                    {meta.emoji}
                  </div>
                )}
                <div
                  className="max-w-[260px] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                  style={
                    msg.role === "user"
                      ? { background: meta.color, color: "#fff", borderBottomRightRadius: 4 }
                      : { background: "#161616", color: "#E5E5E5", border: "1px solid #1F1F1F", borderBottomLeftRadius: 4 }
                  }
                >
                  {msg.role === "user" ? (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold" style={{ color: "#F5F5F5" }}>{children}</strong>,
                        em: ({ children }) => <em className="italic opacity-80">{children}</em>,
                        ul: ({ children }) => <ul className="mt-1 mb-1.5 space-y-0.5 list-none pl-0">{children}</ul>,
                        li: ({ children }) => (
                          <li className="flex items-start gap-1.5">
                            <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: meta.color }} />
                            <span>{children}</span>
                          </li>
                        ),
                        code: ({ children }) => (
                          <code className="rounded px-1 py-0.5 text-xs font-mono" style={{ background: "rgba(255,255,255,0.08)" }}>
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mb-0.5"
                  style={{ background: `${meta.color}18`, border: `1px solid ${meta.color}25` }}
                >
                  {meta.emoji}
                </div>
                <div
                  className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                  style={{ background: "#161616", border: "1px solid #1F1F1F", borderBottomLeftRadius: 4 }}
                >
                  {[0, 1, 2].map(j => (
                    <motion.div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: meta.color }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: j * 0.18 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div className="shrink-0 border-t px-4 pt-3 pb-4" style={{ borderColor: "#1F1F1F" }}>
            <div
              className="flex items-end gap-2 rounded-xl border px-3 py-2 transition-colors"
              style={{ borderColor: "#1F1F1F", background: "#111111" }}
              onFocus={() => {}}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder={meta.placeholder}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-[#333]"
                style={{ color: "#F5F5F5", caretColor: meta.color, maxHeight: 120, overflowY: "auto" }}
              />
              <motion.button
                whileHover={!loading && !!input.trim() ? { scale: 1.06 } : {}}
                whileTap={!loading && !!input.trim() ? { scale: 0.94 } : {}}
                onClick={() => void sendMessage()}
                disabled={loading || !input.trim()}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-30"
                style={{ background: meta.color }}
              >
                {loading
                  ? <Loader2 size={14} className="animate-spin" style={{ color: "#fff" }} />
                  : <Send size={14} style={{ color: "#fff" }} />
                }
              </motion.button>
            </div>
            <p className="text-xs text-center mt-2" style={{ color: "#2A2A2A" }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
