"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { exportReportPDF } from "@/lib/pdf-export";

interface ReportPanelProps {
  open: boolean;
  title: string;
  agentName: string;
  agentRole: string;
  startupName: string;
  content: string;
  accentColor: string;
  accentRGB: [number, number, number];
  onClose: () => void;
}

export function ReportPanel({
  open, title, agentName, agentRole, startupName,
  content, accentColor, accentRGB, onClose,
}: ReportPanelProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleExportPDF = () => {
    exportReportPDF({
      title,
      agentName,
      agentRole,
      startupName,
      content,
      accentColor: accentRGB,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
            className="fixed right-0 top-0 h-full z-50 flex flex-col"
            style={{ width: "min(500px, 100vw)", background: "#0E0E0E", borderLeft: "1px solid #1F1F1F" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "#1F1F1F" }}>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full" style={{ background: accentColor }} />
                <div>
                  <span className="text-sm font-semibold" style={{ color: "#F5F5F5" }}>{title}</span>
                  <p className="text-xs mt-0.5" style={{ color: "#525252" }}>{agentName} · {agentRole}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all"
                  style={{ color: "#525252", border: "1px solid #1F1F1F" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = accentColor;
                    e.currentTarget.style.borderColor = accentColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#525252";
                    e.currentTarget.style.borderColor = "#1F1F1F";
                  }}
                >
                  <Download size={12} />
                  Export PDF
                </button>
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
            </div>

            {/* Scrollable content — pb-20 ensures nothing cut off at bottom */}
            <div className="flex-1 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
              <div className="px-6 pt-6 pb-20">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-base font-bold mt-6 mb-3 pb-2 border-b" style={{ color: "#F5F5F5", borderColor: "#1F1F1F" }}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold mt-4 mb-2" style={{ color: "#E5E5E5" }}>
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm leading-relaxed mb-3" style={{ color: "#A3A3A3" }}>
                        {children}
                      </p>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold" style={{ color: "#F5F5F5" }}>{children}</strong>
                    ),
                    ul: ({ children }) => <ul className="my-3 space-y-1.5 list-none pl-0">{children}</ul>,
                    li: ({ children }) => (
                      <li className="flex items-start gap-2 text-sm" style={{ color: "#A3A3A3" }}>
                        <span className="mt-2 w-1 h-1 rounded-full shrink-0" style={{ background: accentColor }} />
                        <span>{children}</span>
                      </li>
                    ),
                    ol: ({ children }) => <ol className="my-3 space-y-1.5 list-decimal pl-4">{children}</ol>,
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-4 rounded-xl border" style={{ borderColor: "#1F1F1F" }}>
                        <table className="w-full text-xs">{children}</table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-2.5 text-left font-semibold border-b" style={{ background: "#161616", color: "#F5F5F5", borderColor: "#1F1F1F" }}>
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-2.5 border-b" style={{ color: "#A3A3A3", borderColor: "#1A1A1A" }}>
                        {children}
                      </td>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 pl-4 my-3 italic text-sm" style={{ borderColor: accentColor, color: "#525252" }}>
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
