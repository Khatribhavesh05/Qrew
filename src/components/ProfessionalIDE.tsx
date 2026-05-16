"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  RefreshCw, ExternalLink, ChevronRight, ChevronDown,
  FileCode2, FileJson, FileText, Database, Code2, Folder, FolderOpen,
  Download, Clock, AlertCircle, Loader2, X, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getWebContainer } from "@/components/WebContainerPreview";

// Monaco must be client-side only
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex-1" style={{ background: "#1e1e1e" }} />,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface DirNode { type: "dir"; name: string; fullPath: string; children: TreeNode[] }
interface LeafNode { type: "file"; name: string; fullPath: string }
type TreeNode = DirNode | LeafNode;

type BootStep = "booting" | "installing" | "starting" | "ready" | "error" | "timeout";

// ── Helpers ───────────────────────────────────────────────────────────────────

function langFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return (
    ({
      tsx: "typescriptreact", jsx: "javascriptreact",
      ts: "typescript", js: "javascript",
      json: "json", css: "css", scss: "scss",
      html: "html", md: "markdown", mdx: "markdown",
      sql: "sql", yml: "yaml", yaml: "yaml",
    }) as Record<string, string>
  )[ext] ?? "plaintext";
}

function FileIcon({ path, size = 12 }: { path: string; size?: number }) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const s = { width: size, height: size, flexShrink: 0 as const };
  if (["tsx", "jsx"].includes(ext)) return <Code2 style={{ ...s, color: "#61DAFB" }} />;
  if (["ts", "js"].includes(ext)) return <FileCode2 style={{ ...s, color: "#3B82F6" }} />;
  if (ext === "json") return <FileJson style={{ ...s, color: "#F5A623" }} />;
  if (ext === "sql") return <Database style={{ ...s, color: "#8B5CF6" }} />;
  if (["css", "scss"].includes(ext)) return <FileCode2 style={{ ...s, color: "#EC4899" }} />;
  if (ext === "md") return <FileText style={{ ...s, color: "#F5F5F5" }} />;
  return <FileText style={{ ...s, color: "#525252" }} />;
}

function buildTree(paths: string[]): TreeNode[] {
  const dirIndex = new Map<string, DirNode>();

  function ensureDir(segs: string[], upTo: number): DirNode {
    const key = segs.slice(0, upTo).join("/");
    if (dirIndex.has(key)) return dirIndex.get(key)!;
    const node: DirNode = { type: "dir", name: segs[upTo - 1], fullPath: key, children: [] };
    dirIndex.set(key, node);
    if (upTo > 1) ensureDir(segs, upTo - 1).children.push(node);
    return node;
  }

  const roots: TreeNode[] = [];

  for (const p of [...paths].sort()) {
    const segs = p.replace(/^\//, "").split("/");
    if (segs.length === 1) {
      roots.push({ type: "file", name: segs[0], fullPath: p });
    } else {
      const parent = ensureDir(segs, segs.length - 1);
      parent.children.push({ type: "file", name: segs[segs.length - 1], fullPath: p });
    }
  }

  dirIndex.forEach(dir => {
    if (!dir.fullPath.includes("/")) roots.push(dir);
  });

  function sortNodes(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => { if (n.type === "dir") sortNodes(n.children); });
  }
  sortNodes(roots);
  return roots;
}

function pickDefaultFile(paths: string[]): string | null {
  const preferred = [
    "src/app/page.tsx", "app/page.tsx",
    "src/pages/index.tsx", "pages/index.tsx",
    "src/app/layout.tsx", "app/layout.tsx",
  ];
  for (const c of preferred) {
    if (paths.includes(c)) return c;
  }
  return paths[0] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toWcTree(files: Record<string, string>): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tree: Record<string, any> = {};
  for (const [path, content] of Object.entries(files)) {
    const parts = path.replace(/^\//, "").split("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let node: Record<string, any> = tree;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]]) node[parts[i]] = { directory: {} };
      node = node[parts[i]].directory;
    }
    node[parts[parts.length - 1]] = { file: { contents: content } };
  }
  return tree;
}

// ── Tree Row ──────────────────────────────────────────────────────────────────

function TreeRow({
  node, depth, activeFile, onSelect, openPaths, onToggle,
}: {
  node: TreeNode;
  depth: number;
  activeFile: string | null;
  onSelect: (path: string) => void;
  openPaths: Set<string>;
  onToggle: (path: string) => void;
}) {
  const indent = 8 + depth * 12;

  if (node.type === "dir") {
    const isOpen = openPaths.has(node.fullPath);
    return (
      <>
        <button
          onClick={() => onToggle(node.fullPath)}
          className="flex items-center gap-1.5 w-full text-left py-[3px] rounded transition-colors hover:bg-white/5 cursor-pointer"
          style={{ paddingLeft: indent, paddingRight: 6, color: "#A3A3A3" }}
        >
          {isOpen ? <FolderOpen size={12} style={{ flexShrink: 0, color: "#6366F1" }} /> : <Folder size={12} style={{ flexShrink: 0, color: "#525252" }} />}
          <span className="text-[11px] truncate font-medium">{node.name}</span>
          {isOpen ? <ChevronDown size={10} style={{ flexShrink: 0, marginLeft: "auto" }} /> : <ChevronRight size={10} style={{ flexShrink: 0, marginLeft: "auto" }} />}
        </button>
        {isOpen && node.children.map(child => (
          <TreeRow
            key={child.fullPath}
            node={child}
            depth={depth + 1}
            activeFile={activeFile}
            onSelect={onSelect}
            openPaths={openPaths}
            onToggle={onToggle}
          />
        ))}
      </>
    );
  }

  const isActive = node.fullPath === activeFile;
  return (
    <button
      onClick={() => onSelect(node.fullPath)}
      className="flex items-center gap-1.5 w-full text-left py-[3px] rounded transition-colors cursor-pointer hover:bg-white/5"
      style={{
        paddingLeft: indent + 14,
        paddingRight: 6,
        background: isActive ? "rgba(99,102,241,0.18)" : "transparent",
        color: isActive ? "#E0E0FF" : "#7A8B9D",
      }}
    >
      <FileIcon path={node.fullPath} />
      <span className="text-[11px] truncate">{node.name}</span>
    </button>
  );
}

// ── Boot Overlay ──────────────────────────────────────────────────────────────

const BOOT_LABELS: Record<BootStep, string> = {
  booting: "Booting preview environment...",
  installing: "Installing dependencies... (~60s)",
  starting: "Starting dev server...",
  ready: "Preview ready!",
  error: "Preview failed",
  timeout: "Preview timed out",
};

const BOOT_ORDER: BootStep[] = ["booting", "installing", "starting"];

function BootOverlay({ step, error, onDownload }: { step: BootStep; error: string | null; onDownload?: () => void }) {
  const idx = BOOT_ORDER.indexOf(step as (typeof BOOT_ORDER)[number]);
  
  if (step === "error" || step === "timeout") {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full px-6" style={{ background: "#0A0A0A" }}>
        {step === "timeout" ? <Clock size={28} style={{ color: "#F59E0B" }} /> : <AlertCircle size={28} style={{ color: "#EF4444" }} />}
        <div className="flex flex-col gap-2 text-center max-w-xs">
          <p className="text-sm font-medium" style={{ color: step === "timeout" ? "#F59E0B" : "#EF4444" }}>
            {BOOT_LABELS[step]}
          </p>
          <p className="text-xs" style={{ color: "#525252" }}>
            Download ZIP to run locally with <code className="px-1 py-0.5 rounded" style={{ background: "#161616", color: "#A3A3A3" }}>npm install && npm run dev</code>
          </p>
          {error && (
            <p className="text-[10px] font-mono mt-1 rounded px-2 py-1" style={{ background: "#161616", color: "#525252" }}>
              {error}
            </p>
          )}
        </div>
        {onDownload && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onDownload}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
            style={{ background: "#111111", color: "#A3A3A3", border: "1px solid #1F1F1F" }}
          >
            <Download size={13} />
            Download ZIP
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full" style={{ background: "#0A0A0A" }}>
      <div className="flex gap-2">
        {BOOT_ORDER.map((s, i) => (
          <motion.div
            key={s}
            className="w-2 h-2 rounded-full"
            style={{
              background: idx > i ? "#10B981" : idx === i ? "#6366F1" : "#1F1F1F",
            }}
            animate={idx === i ? { scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] } : {}}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      <p className="text-sm" style={{ color: "#A3A3A3" }}>{BOOT_LABELS[step]}</p>
    </div>
  );
}

// ── Resizable Divider ─────────────────────────────────────────────────────────

function ResizableDivider({
  onDrag,
  onDoubleClick,
}: {
  onDrag: (deltaX: number) => void;
  onDoubleClick: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      startXRef.current = e.clientX;
      onDrag(delta);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, onDrag]);

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
      className="w-1 shrink-0 cursor-col-resize hover:bg-indigo-500/30 transition-colors relative group"
      style={{ background: isDragging ? "rgba(99,102,241,0.5)" : "#1A1A1A" }}
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ProfessionalIDEProps {
  files: Record<string, string>;
  startupName: string;
  onDownloadZip?: () => void;
  showStepsPanel?: boolean;
  onToggleStepsPanel?: () => void;
}

export function ProfessionalIDE({
  files,
  startupName,
  onDownloadZip,
  showStepsPanel = true,
  onToggleStepsPanel,
}: ProfessionalIDEProps) {
  const paths = Object.keys(files);
  const treeNodes = buildTree(paths);

  const [activeFile, setActiveFile] = useState<string | null>(() => pickDefaultFile(paths));
  const [bootStep, setBootStep] = useState<BootStep>("booting");
  const [bootError, setBootError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Panel sizes (stored in localStorage)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") return 220;
    const saved = localStorage.getItem("qrew-ide-sidebar-width");
    return saved ? parseInt(saved, 10) : 220;
  });

  const [editorWidth, setEditorWidth] = useState(() => {
    if (typeof window === "undefined") return 50;
    const saved = localStorage.getItem("qrew-ide-editor-width");
    return saved ? parseFloat(saved) : 50;
  });

  // Dirs open by default: only top-level
  const [openPaths, setOpenPaths] = useState<Set<string>>(() => {
    const open = new Set<string>();
    treeNodes.forEach(n => { if (n.type === "dir") open.add(n.fullPath); });
    return open;
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wcRef = useRef<Awaited<ReturnType<typeof getWebContainer>> | null>(null);
  const startedRef = useRef(false);
  const timedOutRef = useRef(false);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editsRef = useRef<Record<string, string>>({ ...files });

  // ── Boot WebContainer ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    timeoutIdRef.current = setTimeout(() => {
      timedOutRef.current = true;
      setBootStep("timeout");
    }, 3 * 60 * 1000); // 3 minutes

    void (async () => {
      try {
        setBootStep("booting");
        const wc = await getWebContainer();
        wcRef.current = wc;

        if (timedOutRef.current) return;

        setBootStep("installing");
        await wc.mount(toWcTree(files));
        const install = await wc.spawn("npm", ["install"]);
        if (timedOutRef.current) return;
        if (await install.exit !== 0) throw new Error("npm install failed");

        setBootStep("starting");
        if (timedOutRef.current) return;
        await wc.spawn("npm", ["run", "dev"]);
        wc.on("server-ready", (_port, url) => {
          if (timedOutRef.current) return;
          clearTimeout(timeoutIdRef.current!);
          setPreviewUrl(url);
          setBootStep("ready");
        });
      } catch (err) {
        clearTimeout(timeoutIdRef.current!);
        if (timedOutRef.current) return;
        setBootStep("error");
        setBootError(err instanceof Error ? err.message : "Unknown error");
      }
    })();

    return () => {
      clearTimeout(timeoutIdRef.current!);
    };
  }, [files]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleEdit = useCallback((path: string, value: string) => {
    editsRef.current[path] = value;
    void wcRef.current?.fs.writeFile(path, value).catch(() => null);
  }, []);

  const toggleDir = useCallback((path: string) => {
    setOpenPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  }, []);

  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) iframeRef.current.src = previewUrl;
  };

  const handleSidebarResize = useCallback((delta: number) => {
    setSidebarWidth(prev => {
      const next = Math.max(150, Math.min(400, prev + delta));
      localStorage.setItem("qrew-ide-sidebar-width", next.toString());
      return next;
    });
  }, []);

  const handleEditorResize = useCallback((delta: number) => {
    setEditorWidth(prev => {
      const containerWidth = window.innerWidth - sidebarWidth;
      const deltaPercent = (delta / containerWidth) * 100;
      const next = Math.max(30, Math.min(70, prev + deltaPercent));
      localStorage.setItem("qrew-ide-editor-width", next.toString());
      return next;
    });
  }, [sidebarWidth]);

  const resetSidebarWidth = () => {
    setSidebarWidth(220);
    localStorage.setItem("qrew-ide-sidebar-width", "220");
  };

  const resetEditorWidth = () => {
    setEditorWidth(50);
    localStorage.setItem("qrew-ide-editor-width", "50");
  };

  const lineCount = activeFile ? (files[activeFile] ?? "").split("\n").length : 0;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ background: "#0A0A0A" }}>
      {/* Top Bar */}
      <div
        className="shrink-0 flex items-center justify-between px-4 border-b"
        style={{ borderColor: "#1F1F1F", background: "#0C0C0C", height: "40px" }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold" style={{ color: "#6366F1" }}>Qrew IDE</span>
          {onToggleStepsPanel && (
            <button
              onClick={onToggleStepsPanel}
              className="p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
              style={{ color: "#525252" }}
              title={showStepsPanel ? "Hide build steps" : "Show build steps"}
            >
              {showStepsPanel ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            </button>
          )}
        </div>
        <span className="text-xs font-medium truncate max-w-xs" style={{ color: "#A3A3A3" }}>
          {startupName}
        </span>
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: bootStep === "ready" ? "rgba(16,185,129,0.12)" : "#161616",
              color: bootStep === "ready" ? "#10B981" : "#525252",
              border: `1px solid ${bootStep === "ready" ? "rgba(16,185,129,0.2)" : "#1F1F1F"}`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: bootStep === "ready" ? "#10B981" : "#525252" }}
            />
            {bootStep === "ready" ? "Live" : bootStep === "error" || bootStep === "timeout" ? "Error" : "Booting"}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Tree Sidebar */}
        <div
          className="shrink-0 border-r overflow-y-auto flex flex-col"
          style={{ width: sidebarWidth, borderColor: "#1A1A1A", background: "#080808" }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: "#1A1A1A" }}>
            <span
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: "#525252" }}
            >
              Explorer
            </span>
          </div>
          <div className="flex-1 py-1 px-1">
            {treeNodes.map(node => (
              <TreeRow
                key={node.fullPath}
                node={node}
                depth={0}
                activeFile={activeFile}
                onSelect={setActiveFile}
                openPaths={openPaths}
                onToggle={toggleDir}
              />
            ))}
          </div>
        </div>

        <ResizableDivider onDrag={handleSidebarResize} onDoubleClick={resetSidebarWidth} />

        {/* Editor Panel */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: `${editorWidth}%` }}
        >
          {activeFile ? (
            <>
              {/* Tab Bar */}
              <div
                className="shrink-0 flex items-center gap-2 px-3 border-b"
                style={{ borderColor: "#1A1A1A", background: "#0A0A0A", height: "32px" }}
              >
                <FileIcon path={activeFile} size={12} />
                <span className="text-[11px] font-mono truncate" style={{ color: "#A3A3A3" }}>
                  {activeFile}
                </span>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 overflow-hidden">
                <MonacoEditor
                  height="100%"
                  theme="vs-dark"
                  path={activeFile}
                  defaultValue={files[activeFile] ?? ""}
                  language={langFromPath(activeFile)}
                  onChange={v => { if (v !== undefined) handleEdit(activeFile, v); }}
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    padding: { top: 12, bottom: 12 },
                    lineNumbers: "on",
                    folding: true,
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    renderLineHighlight: "line",
                    automaticLayout: true,
                    readOnly: false,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ color: "#2A2A2A" }}>
              <p className="text-sm">Select a file to view</p>
            </div>
          )}
        </div>

        <ResizableDivider onDrag={handleEditorResize} onDoubleClick={resetEditorWidth} />

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview Toolbar */}
          <div
            className="shrink-0 flex items-center gap-2 px-3 border-b"
            style={{ borderColor: "#1A1A1A", background: "#080808", height: "32px" }}
          >
            <div
              className="flex items-center gap-2 rounded px-2 py-1 text-[10px] font-mono"
              style={{ background: "#0D0D0D", color: "#525252", border: "1px solid #1A1A1A" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: bootStep === "ready" ? "#10B981" : "#525252" }}
              />
              localhost:3000
            </div>
            <span
              className="flex-1 text-[9px] text-center"
              style={{ color: "#3A3A3A" }}
            >
              Preview — auth & payments require deployment
            </span>
            <button
              onClick={handleRefresh}
              disabled={!previewUrl}
              className="p-1 rounded hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30"
              style={{ color: "#525252" }}
              title="Refresh"
            >
              <RefreshCw size={11} />
            </button>
            <button
              onClick={() => previewUrl && window.open(previewUrl, "_blank")}
              disabled={!previewUrl}
              className="p-1 rounded hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-30"
              style={{ color: "#525252" }}
              title="Open in new tab"
            >
              <ExternalLink size={11} />
            </button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 relative overflow-hidden" style={{ background: "#0A0A0A" }}>
            <AnimatePresence>
              {bootStep !== "ready" && (
                <motion.div
                  key="overlay"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0 z-10"
                >
                  <BootOverlay step={bootStep} error={bootError} onDownload={onDownloadZip} />
                </motion.div>
              )}
            </AnimatePresence>

            {previewUrl && (
              <iframe
                ref={iframeRef}
                src={previewUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="cross-origin-isolated"
                title="Live Preview"
              />
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div
        className="shrink-0 flex items-center justify-between px-3 border-t text-[10px]"
        style={{ borderColor: "#1F1F1F", background: "#0C0C0C", height: "24px", color: "#525252" }}
      >
        <div className="flex items-center gap-3">
          {activeFile && (
            <>
              <span className="font-mono">{activeFile}</span>
              <span>•</span>
              <span>{lineCount} lines</span>
              <span>•</span>
              <span className="font-medium">{langFromPath(activeFile) === "typescriptreact" ? "TypeScript React" : langFromPath(activeFile) === "typescript" ? "TypeScript" : langFromPath(activeFile)}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "#3A3A3A" }}>Qrew IDE v1.0</span>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
