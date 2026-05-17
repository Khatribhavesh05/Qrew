"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft, Download, Send, Loader2,
  Database, CreditCard, GitBranch, Code2, FileText, BarChart3,
  X, ExternalLink, Rocket, Folder, File, ChevronRight, ChevronDown,
  CheckCircle2, Circle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Startup, AgentName, CodeMap } from "@/types";
import { AGENTS } from "@/types";

// ── Types ───────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type ReportTab = "research" | "strategy" | "code" | "hosting";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  children?: FileNode[];
}

interface StartupCredentials {
  supabase_project_url: string | null;
  supabase_anon_key: string | null;
  supabase_service_role_key: string | null;
  stripe_publishable_key: string | null;
  stripe_secret_key: string | null;
  razorpay_key_id: string | null;
  razorpay_key_secret: string | null;
}

// ── Constants ───────────────────────────────────────────────────────────────────

const AGENT_PLACEHOLDERS: Record<AgentName, string> = {
  Alex: "Ask about market data, competitors, audience…",
  Sam: "Ask about GTM, pricing, positioning…",
  Jordan: "Ask about brand identity, colors, design…",
  Morgan: "Ask about the codebase, tech stack, architecture…",
  Riley: "Ask about deployment, launch strategy…",
};

const AGENT_GREETINGS: Record<AgentName, string> = {
  Alex: "Hey! I'm Alex, your research analyst. I've gone through the market data — what do you want to dig into?",
  Sam: "Hi, I'm Sam. I've mapped out your go-to-market and growth strategy. What strategic questions can I help you with?",
  Jordan: "Hey! I'm Jordan, your brand designer. I handled your visual identity — ask me about design decisions.",
  Morgan: "I'm Morgan, your dev. I built the codebase — ask me anything about the architecture or code.",
  Riley: "Hey, I'm Riley. I'm here to help you launch. Ask about GitHub, deployment, or going live.",
};

const INITIAL_MESSAGES: Record<AgentName, ChatMessage[]> = {
  Alex:   [{ role: "assistant", content: AGENT_GREETINGS.Alex }],
  Sam:    [{ role: "assistant", content: AGENT_GREETINGS.Sam }],
  Jordan: [{ role: "assistant", content: AGENT_GREETINGS.Jordan }],
  Morgan: [{ role: "assistant", content: AGENT_GREETINGS.Morgan }],
  Riley:  [{ role: "assistant", content: AGENT_GREETINGS.Riley }],
};

// ── Page ────────────────────────────────────────────────────────────────────────

export default function HQPage() {
  const params = useParams();
  const router = useRouter();
  const startupId = params.startupId as string;

  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportTab, setReportTab] = useState<ReportTab>("research");
  const [activeAgent, setActiveAgent] = useState<AgentName>("Alex");
  const [allMessages, setAllMessages] = useState<Record<AgentName, ChatMessage[]>>({ ...INITIAL_MESSAGES });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payTab, setPayTab] = useState<"stripe" | "razorpay">("stripe");
  const [stripeForm, setStripeForm] = useState({ pk: "", sk: "" });
  const [rzpForm, setRzpForm] = useState({ keyId: "", keySecret: "" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Credentials state
  const [credentials, setCredentials] = useState<StartupCredentials | null>(null);

  // Deploy state
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);

  // Code tab state
  const [codeMap, setCodeMap] = useState<CodeMap | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Hosting tab state
  const [githubConnected, setGithubConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<{ github_access_token?: string } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Auth + data fetch ────────────────────────────────────────────────────────

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: s }, { data: credData }, { data: profileData }] = await Promise.all([
        supabase
          .from("startups")
          .select("*")
          .eq("id", startupId)
          .eq("user_id", user.id)
          .single(),
        supabase
          .from("startup_credentials")
          .select("*")
          .eq("startup_id", startupId)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("github_access_token")
          .eq("id", user.id)
          .single(),
      ]);

      if (!s) { router.push("/app"); return; }
      setStartup(s as Startup);
      setCredentials(credData as StartupCredentials | null);
      setUserProfile(profileData as { github_access_token?: string } | null);
      setGithubConnected(!!(s as Startup).github_url);

      // Fetch complete file structure from API (includes all config files, lib files, etc.)
      try {
        const filesRes = await fetch(`/api/startups/${startupId}/files`);
        if (filesRes.ok) {
          const { files } = await filesRes.json() as { files: Record<string, string> };
          setCodeMap({ file_map: files } as CodeMap);
          const tree = buildFileTree(files);
          setFileTree(tree);
          // Expand src folder by default
          setExpandedFolders(new Set(['src']));
        }
      } catch (err) {
        console.error('Failed to fetch files:', err);
      }

      setLoading(false);
    })();
  }, [startupId, router]);

  // ── Build file tree from file_map ───────────────────────────────────────────

  const buildFileTree = (fileMap: Record<string, string>): FileNode[] => {
    const root: Record<string, any> = {};

    // Build nested structure
    Object.entries(fileMap).forEach(([path, content]) => {
      const parts = path.split("/");
      let current = root;

      parts.forEach((part, idx) => {
        if (idx === parts.length - 1) {
          // It's a file
          current[part] = {
            name: part,
            path,
            type: "file",
            content,
          };
        } else {
          // It's a folder
          if (!current[part]) {
            current[part] = {
              name: part,
              path: parts.slice(0, idx + 1).join("/"),
              type: "folder",
              children: {},
            };
          }
          // Navigate to this folder's children
          current = current[part].children;
        }
      });
    });

    // Convert nested object structure to array structure
    const convertToArray = (obj: Record<string, any>): FileNode[] => {
      return Object.values(obj).map((node: any) => {
        if (node.type === "folder" && node.children) {
          node.children = convertToArray(node.children);
        }
        return node as FileNode;
      }).sort((a, b) => {
        if (a.type === b.type) return a.name.localeCompare(b.name);
        return a.type === "folder" ? -1 : 1;
      });
    };

    return convertToArray(root);
  };

  // ── Toggle folder expansion ──────────────────────────────────────────────────

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // ── Get file extension color ─────────────────────────────────────────────────

  const getFileColor = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    const colorMap: Record<string, string> = {
      ts: "#3178C6",
      tsx: "#3178C6",
      js: "#F7DF1E",
      jsx: "#61DAFB",
      json: "#F59E0B",
      css: "#2563EB",
      html: "#E34F26",
      md: "#6B7280",
      svg: "#F59E0B",
      png: "#8B5CF6",
      jpg: "#8B5CF6",
    };
    return colorMap[ext || ""] || "#6B7280";
  };

  // ── Download ZIP handler ─────────────────────────────────────────────────────

  const handleDownloadZip = async () => {
    try {
      const res = await fetch(`/api/startups/${startupId}/download`);
      if (!res.ok) throw new Error("Download failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${startup?.name || "startup"}-code.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download ZIP");
    }
  };

  // ── Scroll to bottom on new messages ────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, sending, activeAgent]);

  // ── Agent switch ─────────────────────────────────────────────────────────────

  const switchAgent = useCallback((name: AgentName) => {
    setActiveAgent(name);
    setInput("");
  }, []);

  // ── Render file tree ─────────────────────────────────────────────────────────

  const renderFileTree = (nodes: FileNode[], depth = 0) => {
    return (
      <>
        {nodes.map((node) => {
          const isExpanded = expandedFolders.has(node.path);
          const isSelected = selectedFile?.path === node.path;

          if (node.type === "folder") {
            return (
              <div key={node.path}>
                <button
                  onClick={() => toggleFolder(node.path)}
                  className="flex items-center gap-1.5 w-full text-left px-2 py-1 rounded text-xs transition-colors hover:bg-white/5"
                  style={{ paddingLeft: `${depth * 12 + 8}px` }}
                >
                  {isExpanded ? (
                    <ChevronDown size={12} style={{ color: "#6B7280" }} />
                  ) : (
                    <ChevronRight size={12} style={{ color: "#6B7280" }} />
                  )}
                  <Folder size={12} style={{ color: "#F59E0B" }} />
                  <span style={{ color: "#A3A3A3" }}>{node.name}</span>
                </button>
                {isExpanded && node.children && (
                  <div>{renderFileTree(node.children, depth + 1)}</div>
                )}
              </div>
            );
          }

          return (
            <button
              key={node.path}
              onClick={() => setSelectedFile(node)}
              className="flex items-center gap-1.5 w-full text-left px-2 py-1 rounded text-xs transition-colors"
              style={{
                paddingLeft: `${depth * 12 + 8}px`,
                background: isSelected ? "rgba(99,102,241,0.1)" : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                if (!isSelected) e.currentTarget.style.background = "transparent";
              }}
            >
              <File size={12} style={{ color: getFileColor(node.name) }} />
              <span style={{ color: isSelected ? "#6366F1" : "#A3A3A3" }}>{node.name}</span>
            </button>
          );
        })}
      </>
    );
  };

  // ── Send message ─────────────────────────────────────────────────────────────

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const agentMessages = allMessages[activeAgent];
    const updated: ChatMessage[] = [...agentMessages, { role: "user", content: trimmed }];
    setAllMessages(prev => ({ ...prev, [activeAgent]: updated }));
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startupId,
          agent: activeAgent.toLowerCase(),
          message: trimmed,
          history: agentMessages.slice(1),
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      const reply = data.reply ?? "Sorry, I couldn't get a response right now.";
      setAllMessages(prev => ({
        ...prev,
        [activeAgent]: [...updated, { role: "assistant", content: reply }],
      }));
    } catch {
      setAllMessages(prev => ({
        ...prev,
        [activeAgent]: [...updated, { role: "assistant", content: "Connection error — please try again." }],
      }));
    } finally {
      setSending(false);
    }
  };

  // ── Payment modal handlers ────────────────────────────────────────────────────

  const handleSavePayment = async () => {
    setSaving(true);
    setSaveError(null);

    const body: Record<string, string> = {};
    if (payTab === "stripe") {
      if (stripeForm.pk.trim()) body.stripe_publishable_key = stripeForm.pk.trim();
      if (stripeForm.sk.trim()) body.stripe_secret_key = stripeForm.sk.trim();
    } else {
      if (rzpForm.keyId.trim()) body.razorpay_key_id = rzpForm.keyId.trim();
      if (rzpForm.keySecret.trim()) body.razorpay_key_secret = rzpForm.keySecret.trim();
    }

    if (Object.keys(body).length === 0) {
      setSaveError("Please enter at least one key.");
      setSaving(false);
      return;
    }

    const res = await fetch(`/api/startups/${startupId}/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setSaveError(data.error ?? "Failed to save");
      setSaving(false);
      return;
    }

    // Update local credentials state
    setCredentials(prev =>
      prev
        ? { ...prev, ...body }
        : {
            supabase_project_url: null, supabase_anon_key: null, supabase_service_role_key: null,
            stripe_publishable_key: null, stripe_secret_key: null,
            razorpay_key_id: null, razorpay_key_secret: null,
            ...body,
          }
    );
    setShowPaymentModal(false);
    setSaving(false);
    if (payTab === "stripe") setStripeForm({ pk: "", sk: "" });
    else setRzpForm({ keyId: "", keySecret: "" });
  };

  const openModal = (tab: "stripe" | "razorpay") => {
    setPayTab(tab);
    setSaveError(null);
    setShowPaymentModal(true);
  };

  // ── GitHub deploy handler ─────────────────────────────────────────────────────

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployError(null);

    try {
      const res = await fetch(`/api/startups/${startupId}/deploy`, { method: "POST" });
      const data = (await res.json()) as {
        githubUrl?: string;
        vercelDeployUrl?: string;
        error?: string;
      };

      if (!res.ok) {
        setDeployError(data.error ?? "Deploy failed");
        setDeploying(false);
        return;
      }

      // Success - redirect to build page to see deployment status
      router.push(`/app/${startupId}/build?type=standard`);
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : "Deploy failed");
      setDeploying(false);
    }
  };

  // ── Report content ────────────────────────────────────────────────────────────

  const reports = startup?.report_data as { research?: string; strategy?: string } | null;
  const reportContent = reportTab === "research"
    ? (reports?.research ?? "")
    : (reports?.strategy ?? "");

  const activeAgentMeta = AGENTS.find(a => a.name === activeAgent)!;
  const currentMessages = allMessages[activeAgent];

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (loading || !startup) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0A" }}>
        <Loader2 size={24} className="animate-spin" style={{ color: "#6366F1" }} />
      </div>
    );
  }

  const isDeployed = startup.status === "deployed" || startup.status === "live";

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>

      {/* ── Navbar ─────────────────────────────────────────────────────────────── */}
      <nav
        className="shrink-0 flex items-center justify-between px-5 py-3 border-b"
        style={{ background: "#111111", borderColor: "#1F1F1F", height: 56 }}
      >
        {/* Left */}
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#A3A3A3")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
          >
            <ArrowLeft size={14} />
            Dashboard
          </Link>
          <div className="w-px h-4" style={{ background: "#1F1F1F" }} />
          <span className="text-sm font-bold" style={{ color: "#F5F5F5" }}>
            {startup.name ?? "Untitled"}
          </span>
          <span
            className="inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 font-semibold"
            style={{
              background: isDeployed ? "rgba(16,185,129,0.12)" : "rgba(139,92,246,0.12)",
              color: isDeployed ? "#10B981" : "#8B5CF6",
              border: `1px solid ${isDeployed ? "rgba(16,185,129,0.25)" : "rgba(139,92,246,0.25)"}`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: isDeployed ? "#10B981" : "#8B5CF6" }} />
            {isDeployed ? "Deployed" : "Built ✓"}
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Link
            href={`/app/${startupId}`}
            className="text-xs font-medium transition-colors"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#A3A3A3")}
            onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
          >
            Back to Report
          </Link>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-2 transition-all"
            style={{ background: "rgba(99,102,241,0.12)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.2)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.18)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.12)"; }}
            onClick={() => void handleDownloadZip()}
          >
            <Download size={13} />
            Download ZIP
          </button>
        </div>
      </nav>

      {/* ── Main two-column layout ──────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left column: Reports (55%) ─────────────────────────────────────────── */}
        <div
          className="flex flex-col border-r"
          style={{ width: "55%", borderColor: "#1F1F1F" }}
        >
          {/* Tab switcher */}
          <div
            className="shrink-0 flex items-center gap-2 px-5 py-3 border-b"
            style={{ borderColor: "#1F1F1F", background: "#0E0E0E" }}
          >
            {(["research", "strategy", "code", "hosting"] as const).map(tab => {
              const active = reportTab === tab;
              const tabConfig = {
                research: { emoji: "📊", label: "Research", color: "#6366F1" },
                strategy: { emoji: "🎯", label: "Strategy", color: "#10B981" },
                code: { emoji: "💻", label: "Code", color: "#3B82F6" },
                hosting: { emoji: "🚀", label: "Hosting", color: "#8B5CF6" },
              }[tab];
              return (
                <button
                  key={tab}
                  onClick={() => setReportTab(tab)}
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: active ? tabConfig.color : "transparent",
                    color: active ? "#fff" : "#6B7280",
                    border: `1px solid ${active ? tabConfig.color : "transparent"}`,
                  }}
                >
                  <span>{tabConfig.emoji}</span>
                  {tabConfig.label}
                </button>
              );
            })}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
            {/* Research & Strategy Reports */}
            {(reportTab === "research" || reportTab === "strategy") && (
              <div className="px-6 py-6">
            {reportContent ? (
              <motion.div
                key={reportTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0" style={{ color: "#F5F5F5", letterSpacing: "-0.02em" }}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-bold mb-3 mt-6 first:mt-0" style={{ color: "#E5E5E5", letterSpacing: "-0.01em" }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold mb-2 mt-4" style={{ color: "#D4D4D4" }}>
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed mb-3" style={{ color: "#A3A3A3" }}>
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 space-y-1.5 pl-0 list-none">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 space-y-1.5 pl-4 list-decimal" style={{ color: "#A3A3A3" }}>{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-2 text-sm" style={{ color: "#A3A3A3" }}>
                        <span
                          className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full"
                          style={{ background: reportTab === "research" ? "#6366F1" : "#10B981" }}
                        />
                        <span>{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold" style={{ color: "#F5F5F5" }}>{children}</strong>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote
                        className="border-l-2 pl-4 my-4 italic"
                        style={{
                          borderColor: reportTab === "research" ? "#6366F1" : "#10B981",
                          color: "#9CA3AF",
                        }}
                      >
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto mb-4">
                        <table
                          className="w-full text-xs border-collapse rounded-xl overflow-hidden"
                          style={{ borderColor: "#1F1F1F" }}
                        >
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th
                        className="text-left px-4 py-2.5 text-xs font-bold border-b"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          borderColor: "#1F1F1F",
                          color: "#F5F5F5",
                        }}
                      >
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td
                        className="px-4 py-2.5 text-xs border-b"
                        style={{ borderColor: "#1F1F1F", color: "#A3A3A3" }}
                      >
                        {children}
                      </td>
                    ),
                    code: ({ children }) => (
                      <code
                        className="rounded px-1.5 py-0.5 text-xs font-mono"
                        style={{ background: "rgba(255,255,255,0.06)", color: "#E2E8F0" }}
                      >
                        {children}
                      </code>
                    ),
                    hr: () => (
                      <hr className="my-6" style={{ borderColor: "#1F1F1F" }} />
                    ),
                  }}
                >
                    {reportContent}
                  </ReactMarkdown>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1F1F1F" }}
                  >
                    <FileText size={20} style={{ color: "#525252" }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: "#525252" }}>No report yet</p>
                  <Link
                    href={`/app/${startupId}`}
                    className="text-xs font-semibold"
                    style={{ color: "#6366F1" }}
                  >
                    Generate reports →
                  </Link>
                </div>
              )}
              </div>
            )}

            {/* Code Tab */}
            {reportTab === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full flex"
              >
                {fileTree.length > 0 ? (
                  <>
                    {/* File tree - left side */}
                    <div
                      className="w-64 border-r overflow-y-auto"
                      style={{ borderColor: "#1F1F1F", background: "#0A0A0A" }}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold" style={{ color: "#A3A3A3" }}>Files</p>
                          <button
                            onClick={() => void handleDownloadZip()}
                            className="flex items-center gap-1 text-xs font-medium rounded px-2 py-1 transition-colors"
                            style={{ background: "rgba(99,102,241,0.1)", color: "#6366F1" }}
                          >
                            <Download size={11} />
                            ZIP
                          </button>
                        </div>
                        {renderFileTree(fileTree)}
                      </div>
                    </div>

                    {/* Code viewer - right side */}
                    <div className="flex-1 overflow-y-auto">
                      {selectedFile ? (
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <File size={14} style={{ color: getFileColor(selectedFile.name) }} />
                            <p className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>
                              {selectedFile.path}
                            </p>
                          </div>
                          <pre
                            className="rounded-xl p-4 text-xs font-mono overflow-x-auto"
                            style={{ background: "#0D0D0D", border: "1px solid #1F1F1F", color: "#E5E5E5" }}
                          >
                            <code>{selectedFile.content}</code>
                          </pre>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-sm" style={{ color: "#525252" }}>Select a file to view</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1F1F1F" }}
                    >
                      <Code2 size={20} style={{ color: "#525252" }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: "#525252" }}>No code generated yet</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Hosting Tab */}
            {reportTab === "hosting" && (
              <motion.div
                key="hosting"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="p-6"
              >
                <div className="max-w-2xl mx-auto space-y-6">
                  {/* Deployment Status */}
                  <div
                    className="rounded-xl p-5 border"
                    style={{ background: "#0D0D0D", borderColor: "#1F1F1F" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Rocket size={16} style={{ color: "#8B5CF6" }} />
                      <h3 className="text-sm font-bold" style={{ color: "#F5F5F5" }}>Deployment Status</h3>
                    </div>
                    
                    {githubConnected ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                          <span className="text-sm" style={{ color: "#A3A3A3" }}>
                            Connected to GitHub
                          </span>
                        </div>
                        {startup?.github_url && (
                          <a
                            href={startup.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-medium transition-colors"
                            style={{ color: "#6366F1" }}
                          >
                            <ExternalLink size={12} />
                            View Repository
                          </a>
                        )}
                        {startup?.live_url && (
                          <a
                            href={startup.live_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm font-medium transition-colors"
                            style={{ color: "#10B981" }}
                          >
                            <ExternalLink size={12} />
                            View Live Site
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Circle size={14} style={{ color: "#525252" }} />
                        <span className="text-sm" style={{ color: "#525252" }}>
                          Not deployed yet
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Environment Variables */}
                  <div
                    className="rounded-xl p-5 border"
                    style={{ background: "#0D0D0D", borderColor: "#1F1F1F" }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Database size={16} style={{ color: "#10B981" }} />
                      <h3 className="text-sm font-bold" style={{ color: "#F5F5F5" }}>Environment Variables</h3>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {[
                        { key: "NEXT_PUBLIC_SUPABASE_URL", value: credentials?.supabase_project_url },
                        { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: credentials?.supabase_anon_key },
                        { key: "SUPABASE_SERVICE_ROLE_KEY", value: credentials?.supabase_service_role_key },
                        { key: "STRIPE_PUBLISHABLE_KEY", value: credentials?.stripe_publishable_key },
                        { key: "STRIPE_SECRET_KEY", value: credentials?.stripe_secret_key },
                        { key: "RAZORPAY_KEY_ID", value: credentials?.razorpay_key_id },
                        { key: "RAZORPAY_KEY_SECRET", value: credentials?.razorpay_key_secret },
                      ].map(({ key, value }) => (
                        <div key={key} className="flex items-center gap-2">
                          {value ? (
                            <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                          ) : (
                            <Circle size={14} style={{ color: "#525252" }} />
                          )}
                          <span
                            className="text-xs font-mono"
                            style={{ color: value ? "#A3A3A3" : "#525252" }}
                          >
                            {key}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-xs" style={{ color: "#6B7280" }}>
                      After deploying to Vercel, add these environment variables in your dashboard.
                    </p>
                  </div>

                  {/* Deploy Actions */}
                  <div className="space-y-3">
                    {userProfile?.github_access_token && !githubConnected && (
                      <button
                        onClick={() => void handleDeploy()}
                        disabled={deploying}
                        className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-60"
                        style={{ background: "#6366F1", color: "#fff" }}
                      >
                        {deploying ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Pushing to GitHub...
                          </>
                        ) : (
                          <>
                            <GitBranch size={14} />
                            Push to GitHub
                          </>
                        )}
                      </button>
                    )}

                    {!userProfile?.github_access_token && (
                      <button
                        onClick={() => void handleDeploy()}
                        disabled={deploying}
                        className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all disabled:opacity-60"
                        style={{ background: "#8B5CF6", color: "#fff" }}
                      >
                        {deploying ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Rocket size={14} />
                            Connect GitHub & Deploy
                          </>
                        )}
                      </button>
                    )}

                    {deployError && (
                      <p
                        className="text-xs text-center rounded-lg px-3 py-2"
                        style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444" }}
                      >
                        {deployError}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* ── Right column: Agent Chat (45%) ─────────────────────────────────────── */}
        <div className="flex flex-col" style={{ width: "45%" }}>
          {/* Header */}
          <div
            className="shrink-0 px-5 py-3 border-b"
            style={{ borderColor: "#1F1F1F", background: "#0E0E0E" }}
          >
            <p className="text-sm font-bold mb-3" style={{ color: "#F5F5F5" }}>Chat with your team</p>

            {/* Agent selector tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {AGENTS.map(agent => {
                const active = activeAgent === agent.name;
                return (
                  <motion.button
                    key={agent.name}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => switchAgent(agent.name)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: active ? `${agent.color}18` : "transparent",
                      color: active ? agent.color : "#6B7280",
                      border: `1px solid ${active ? `${agent.color}35` : "rgba(255,255,255,0.05)"}`,
                    }}
                  >
                    <span>{agent.emoji}</span>
                    {agent.name}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3"
            style={{ scrollbarGutter: "stable" }}
          >
            <AnimatePresence mode="popLayout">
              {currentMessages.map((msg, i) => (
                <motion.div
                  key={`${activeAgent}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2`}
                >
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mb-0.5"
                      style={{ background: `${activeAgentMeta.color}18`, border: `1px solid ${activeAgentMeta.color}25` }}
                    >
                      {activeAgentMeta.emoji}
                    </div>
                  )}
                  <div
                    className="max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: activeAgentMeta.color, color: "#fff", borderBottomRightRadius: 4 }
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
                          strong: ({ children }) => (
                            <strong className="font-semibold" style={{ color: "#F5F5F5" }}>{children}</strong>
                          ),
                          ul: ({ children }) => <ul className="mt-1 mb-1.5 space-y-0.5 list-none pl-0">{children}</ul>,
                          li: ({ children }) => (
                            <li className="flex items-start gap-1.5">
                              <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: activeAgentMeta.color }} />
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
            </AnimatePresence>

            {/* Typing indicator */}
            {sending && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-end gap-2"
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 mb-0.5"
                  style={{ background: `${activeAgentMeta.color}18`, border: `1px solid ${activeAgentMeta.color}25` }}
                >
                  {activeAgentMeta.emoji}
                </div>
                <div
                  className="rounded-2xl px-4 py-3 flex items-center gap-1.5"
                  style={{ background: "#161616", border: "1px solid #1F1F1F", borderBottomLeftRadius: 4 }}
                >
                  {[0, 1, 2].map(j => (
                    <motion.div
                      key={j}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: activeAgentMeta.color }}
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
                placeholder={AGENT_PLACEHOLDERS[activeAgent]}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none"
                style={{
                  color: "#F5F5F5",
                  caretColor: activeAgentMeta.color,
                  maxHeight: 120,
                  overflowY: "auto",
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ["--tw-placeholder-color" as any]: "#333",
                }}
              />
              <motion.button
                whileHover={!sending && !!input.trim() ? { scale: 1.06 } : {}}
                whileTap={!sending && !!input.trim() ? { scale: 0.94 } : {}}
                onClick={() => void sendMessage()}
                disabled={sending || !input.trim()}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-opacity disabled:opacity-30"
                style={{ background: activeAgentMeta.color }}
              >
                {sending
                  ? <Loader2 size={14} className="animate-spin" style={{ color: "#fff" }} />
                  : <Send size={14} style={{ color: "#fff" }} />
                }
              </motion.button>
            </div>
            <p className="text-xs text-center mt-2" style={{ color: "#2A2A2A" }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
      {/* ── Payment Keys Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowPaymentModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm rounded-2xl border p-5"
              style={{ background: "#111111", borderColor: "#1F1F1F", boxShadow: "0 0 60px rgba(0,0,0,0.6)" }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} style={{ color: "#6366F1" }} />
                  <span className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>Add Payment Keys</span>
                </div>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="rounded-lg p-1.5 cursor-pointer transition-colors"
                  style={{ color: "#525252", background: "#161616", border: "1px solid #1A1A1A" }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: "#0D0D0D" }}>
                {(["stripe", "razorpay"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setPayTab(tab); setSaveError(null); }}
                    className="flex-1 py-1.5 text-xs font-medium rounded-lg cursor-pointer transition-all"
                    style={{
                      background: payTab === tab ? "#1F1F1F" : "transparent",
                      color: payTab === tab ? "#F5F5F5" : "#525252",
                      border: payTab === tab ? "1px solid #2A2A2A" : "1px solid transparent",
                    }}
                  >
                    {tab === "stripe" ? "Stripe" : "Razorpay"}
                  </button>
                ))}
              </div>

              {/* Stripe form */}
              {payTab === "stripe" && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-medium mb-1.5 block" style={{ color: "#A3A3A3" }}>Publishable Key</label>
                    <input
                      type="text"
                      placeholder="pk_live_... or pk_test_..."
                      value={stripeForm.pk}
                      onChange={e => setStripeForm(f => ({ ...f, pk: e.target.value }))}
                      className="w-full text-xs rounded-lg px-3 py-2 font-mono outline-none"
                      style={{ background: "#0D0D0D", border: "1px solid #1F1F1F", color: "#F5F5F5" }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium mb-1.5 block" style={{ color: "#A3A3A3" }}>Secret Key</label>
                    <input
                      type="password"
                      placeholder="sk_live_... or sk_test_..."
                      value={stripeForm.sk}
                      onChange={e => setStripeForm(f => ({ ...f, sk: e.target.value }))}
                      className="w-full text-xs rounded-lg px-3 py-2 font-mono outline-none"
                      style={{ background: "#0D0D0D", border: "1px solid #1F1F1F", color: "#F5F5F5" }}
                    />
                  </div>
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] transition-opacity hover:opacity-70"
                    style={{ color: "#525252" }}
                  >
                    <ExternalLink size={9} />
                    Get keys from dashboard.stripe.com/apikeys
                  </a>
                </div>
              )}

              {/* Razorpay form */}
              {payTab === "razorpay" && (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-[10px] font-medium mb-1.5 block" style={{ color: "#A3A3A3" }}>Key ID</label>
                    <input
                      type="text"
                      placeholder="rzp_live_... or rzp_test_..."
                      value={rzpForm.keyId}
                      onChange={e => setRzpForm(f => ({ ...f, keyId: e.target.value }))}
                      className="w-full text-xs rounded-lg px-3 py-2 font-mono outline-none"
                      style={{ background: "#0D0D0D", border: "1px solid #1F1F1F", color: "#F5F5F5" }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium mb-1.5 block" style={{ color: "#A3A3A3" }}>Key Secret</label>
                    <input
                      type="password"
                      placeholder="Key secret"
                      value={rzpForm.keySecret}
                      onChange={e => setRzpForm(f => ({ ...f, keySecret: e.target.value }))}
                      className="w-full text-xs rounded-lg px-3 py-2 font-mono outline-none"
                      style={{ background: "#0D0D0D", border: "1px solid #1F1F1F", color: "#F5F5F5" }}
                    />
                  </div>
                  <a
                    href="https://dashboard.razorpay.com/app/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] transition-opacity hover:opacity-70"
                    style={{ color: "#525252" }}
                  >
                    <ExternalLink size={9} />
                    Get keys from dashboard.razorpay.com/app/keys
                  </a>
                </div>
              )}

              {/* Error */}
              <AnimatePresence>
                {saveError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] mt-3 rounded-lg px-2.5 py-2"
                    style={{ background: "rgba(239,68,68,0.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    {saveError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Save button */}
              <motion.button
                whileHover={!saving ? { scale: 1.02 } : {}}
                whileTap={!saving ? { scale: 0.97 } : {}}
                onClick={() => void handleSavePayment()}
                disabled={saving}
                className="w-full mt-4 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  background: "#6366F1",
                  color: "#fff",
                  boxShadow: saving ? "none" : "0 0 20px rgba(99,102,241,0.28)",
                }}
              >
                {saving ? <><Loader2 size={12} className="animate-spin" /> Saving…</> : "Save Keys"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* ── Bottom bar ─────────────────────────────────────────────────────────── */}
      <div
        className="shrink-0 flex items-center gap-3 px-5 py-3 border-t flex-wrap"
        style={{ background: "#0E0E0E", borderColor: "#1F1F1F" }}
      >
        <Link
          href={`/app/${startupId}/connect-supabase`}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-60"
          style={{ background: "rgba(16,185,129,0.08)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(16,185,129,0.14)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "rgba(16,185,129,0.08)"; }}
        >
          <Database size={13} />
          Connect Supabase
        </Link>

        <button
          onClick={() => openModal("stripe")}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all"
          style={{ background: "rgba(99,102,241,0.08)", color: "#6366F1", border: "1px solid rgba(99,102,241,0.2)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.14)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(99,102,241,0.08)"; }}
        >
          <CreditCard size={13} />
          Add Payment Keys
        </button>

        <button
          onClick={() => void handleDeploy()}
          disabled={deploying}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all disabled:opacity-60"
          style={{ background: "rgba(139,92,246,0.08)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.2)" }}
          onMouseEnter={e => { if (!deploying) (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.14)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(139,92,246,0.08)"; }}
        >
          {deploying ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />}
          Connect GitHub &amp; Deploy
        </button>

        <div className="ml-auto">
          <Link
            href={`/app/${startupId}/build?type=standard`}
            className="flex items-center gap-2 text-xs font-medium transition-colors"
            style={{ color: "#525252" }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#A3A3A3"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "#525252"; }}
          >
            <Code2 size={13} />
            View Generated Code
          </Link>
        </div>
      </div>
    </div>
  );
}
