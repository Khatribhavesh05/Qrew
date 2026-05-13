"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  RefreshCw, ExternalLink,
  ChevronRight, ChevronDown,
  FileCode2, FileJson, FileText, Database, Code2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getWebContainer } from "@/components/WebContainerPreview";

// Monaco must be client-side only — it needs window/document
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <div className="flex-1" style={{ background: "#1e1e1e" }} />,
});

// ── Language + icon helpers ───────────────────────────────────────────────────

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
  return <FileText style={{ ...s, color: "#525252" }} />;
}

// ── File tree data structure + builder ────────────────────────────────────────

interface DirNode  { type: "dir";  name: string; fullPath: string; children: TreeNode[] }
interface LeafNode { type: "file"; name: string; fullPath: string }
type TreeNode = DirNode | LeafNode;

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

  // Top-level dirs were not pushed to roots inside the loop; add them now
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

// ── Tree row (recursive) ──────────────────────────────────────────────────────

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
          className="flex items-center gap-1 w-full text-left py-[3px] rounded transition-colors hover:bg-white/5 cursor-pointer"
          style={{ paddingLeft: indent, paddingRight: 6, color: "#6B7280" }}
        >
          {isOpen
            ? <ChevronDown size={10} style={{ flexShrink: 0 }} />
            : <ChevronRight size={10} style={{ flexShrink: 0 }} />}
          <span className="text-[11px] truncate">{node.name}</span>
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
      className="flex items-center gap-1.5 w-full text-left py-[3px] rounded transition-colors cursor-pointer"
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

// ── Boot overlay ──────────────────────────────────────────────────────────────

type BootStep = "booting" | "installing" | "starting" | "ready" | "error";

const BOOT_LABELS: Record<BootStep, string> = {
  booting:    "Booting preview environment...",
  installing: "Installing dependencies...",
  starting:   "Starting dev server...",
  ready:      "Preview ready!",
  error:      "Preview failed to start",
};

const BOOT_ORDER: BootStep[] = ["booting", "installing", "starting"];

function BootOverlay({ step, error }: { step: BootStep; error: string | null }) {
  const idx = BOOT_ORDER.indexOf(step as (typeof BOOT_ORDER)[number]);
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 h-full"
      style={{ background: "#0A0A0A" }}
    >
      {step === "error" ? (
        <>
          <p className="text-sm font-medium" style={{ color: "#EF4444" }}>Preview failed</p>
          {error && (
            <p className="text-xs font-mono max-w-xs text-center px-4" style={{ color: "#525252" }}>
              {error}
            </p>
          )}
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

// ── WC filesystem helper ──────────────────────────────────────────────────────

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

// ── BuildIDE ──────────────────────────────────────────────────────────────────

type Tab = "code" | "preview";

export function BuildIDE({ files }: { files: Record<string, string> }) {
  const paths = Object.keys(files);
  const treeNodes = buildTree(paths);

  const [tab, setTab] = useState<Tab>("code");
  const [activeFile, setActiveFile] = useState<string | null>(() => pickDefaultFile(paths));
  const [bootStep, setBootStep] = useState<BootStep>("booting");
  const [bootError, setBootError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Dirs open by default: only the top-level dirs
  const [openPaths, setOpenPaths] = useState<Set<string>>(() => {
    const open = new Set<string>();
    treeNodes.forEach(n => { if (n.type === "dir") open.add(n.fullPath); });
    return open;
  });

  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const wcRef      = useRef<Awaited<ReturnType<typeof getWebContainer>> | null>(null);
  const startedRef = useRef(false);
  // Edits stored in a ref so writes to WC don't trigger re-renders
  const editsRef   = useRef<Record<string, string>>({ ...files });

  // ── Boot WebContainer ────────────────────────────────────────────────────
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      try {
        setBootStep("booting");
        const wc = await getWebContainer();
        wcRef.current = wc;

        setBootStep("installing");
        await wc.mount(toWcTree(files));
        const install = await wc.spawn("npm", ["install"]);
        if (await install.exit !== 0) throw new Error("npm install failed");

        setBootStep("starting");
        await wc.spawn("npm", ["run", "dev"]);
        wc.on("server-ready", (_port, url) => {
          setPreviewUrl(url);
          setBootStep("ready");
        });
      } catch (err) {
        setBootStep("error");
        setBootError(err instanceof Error ? err.message : "Unknown error");
      }
    })();
  }, []); // boot once — files are stable after mount

  // ── File edit → write to WC fs (hot reload picks it up) ─────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ background: "#0A0A0A" }}>

      {/* Tab bar */}
      <div
        className="shrink-0 flex items-center gap-1 px-2 border-b"
        style={{ borderColor: "#1F1F1F", background: "#0C0C0C", height: "36px" }}
      >
        {(["code", "preview"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
            style={{
              background: tab === t ? "rgba(99,102,241,0.15)" : "transparent",
              color:      tab === t ? "#818CF8" : "#525252",
              border:     `1px solid ${tab === t ? "rgba(99,102,241,0.25)" : "transparent"}`,
            }}
          >
            {t === "code" ? "Code" : "Preview"}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{
              background: bootStep === "ready" ? "rgba(16,185,129,0.12)" : "#161616",
              color:      bootStep === "ready" ? "#10B981" : "#525252",
              border:     `1px solid ${bootStep === "ready" ? "rgba(16,185,129,0.2)" : "#1F1F1F"}`,
            }}
          >
            {bootStep === "ready" ? "Live" : bootStep === "error" ? "Error" : "Booting…"}
          </span>
          <button
            onClick={handleRefresh}
            disabled={!previewUrl}
            className="p-1.5 rounded-md cursor-pointer disabled:opacity-30 transition-colors hover:bg-white/5"
            style={{ color: "#525252" }}
            title="Refresh preview"
          >
            <RefreshCw size={11} />
          </button>
          <button
            onClick={() => previewUrl && window.open(previewUrl, "_blank")}
            disabled={!previewUrl}
            className="p-1.5 rounded-md cursor-pointer disabled:opacity-30 transition-colors hover:bg-white/5"
            style={{ color: "#525252" }}
            title="Open in new tab"
          >
            <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {tab === "code" ? (
          <div className="flex h-full">

            {/* File tree */}
            <div
              className="w-[200px] shrink-0 border-r overflow-y-auto flex flex-col py-1"
              style={{ borderColor: "#1A1A1A", background: "#080808" }}
            >
              <div className="px-2 pt-1.5 pb-1">
                <span
                  className="text-[9px] font-semibold uppercase tracking-widest"
                  style={{ color: "#2A2A2A" }}
                >
                  Explorer
                </span>
              </div>
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

            {/* Editor pane */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {activeFile ? (
                <>
                  {/* Breadcrumb */}
                  <div
                    className="shrink-0 flex items-center gap-1.5 px-3 border-b"
                    style={{ borderColor: "#1A1A1A", background: "#0A0A0A", height: "27px" }}
                  >
                    <FileIcon path={activeFile} size={11} />
                    <span className="text-[10px] font-mono" style={{ color: "#525252" }}>
                      {activeFile}
                    </span>
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <MonacoEditor
                      height="100%"
                      theme="vs-dark"
                      path={activeFile}
                      defaultValue={files[activeFile] ?? ""}
                      language={langFromPath(activeFile)}
                      onChange={v => { if (v !== undefined) handleEdit(activeFile, v); }}
                      options={{
                        fontSize: 12,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        padding: { top: 12, bottom: 12 },
                        fontFamily: "'Fira Code', 'JetBrains Mono', 'Courier New', monospace",
                        lineNumbers: "on",
                        folding: true,
                        smoothScrolling: true,
                        cursorBlinking: "smooth",
                        renderLineHighlight: "line",
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </>
              ) : (
                <div
                  className="flex-1 flex items-center justify-center"
                  style={{ color: "#2A2A2A" }}
                >
                  <p className="text-sm">Select a file to edit</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Preview tab */
          <div className="flex flex-col h-full">

            {/* Preview sub-toolbar */}
            <div
              className="shrink-0 flex items-center gap-2 px-3 border-b"
              style={{ borderColor: "#1A1A1A", background: "#080808", height: "30px" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: bootStep === "ready" ? "#10B981" : "#525252" }}
              />
              <span className="text-[11px] font-mono" style={{ color: "#525252" }}>
                localhost:3000
              </span>
              <span
                className="ml-auto text-[10px] px-2 py-0.5 rounded-full shrink-0"
                style={{ background: "#161616", color: "#525252", border: "1px solid #222" }}
              >
                Preview — auth &amp; payments require deployment
              </span>
            </div>

            {/* iframe + boot overlay */}
            <div className="flex-1 relative overflow-hidden">
              <AnimatePresence>
                {bootStep !== "ready" && (
                  <motion.div
                    key="overlay"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 z-10"
                  >
                    <BootOverlay step={bootStep} error={bootError} />
                  </motion.div>
                )}
              </AnimatePresence>

              {previewUrl && (
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  className="absolute inset-0 w-full h-full border-0"
                  title="Live Preview"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
