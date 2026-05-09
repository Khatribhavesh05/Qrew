export interface Profile {
  id: string;
  email: string;
  token_balance: number;
  free_build_used: boolean;
  created_at: string;
}

export interface Startup {
  id: string;
  user_id: string;
  name: string | null;
  idea: string;
  industry: string | null;
  audience: string | null;
  customer_type: string | null;
  revenue_model: string | null;
  brand_vibe: string | null;
  status:
    | "draft"         // idea submitted, setting up
    | "processing"    // legacy alias for draft
    | "naming"        // legacy alias for draft
    | "team_assembly" // legacy alias for draft
    | "researching"   // Alex + Sam generating reports
    | "report_ready"  // legacy alias for ready
    | "ready"         // reports done, ready to build
    | "building"      // build SSE in progress
    | "built"         // code generated, not yet deployed
    | "deployed"      // live on user's Vercel
    | "live"          // legacy alias for deployed
    | "error";
  build_type: "standard" | "premium" | null;
  tokens_spent: number;
  report_data: Record<string, unknown> | null;
  github_url: string | null;
  live_url: string | null;
  created_at: string;
}

export interface CompanyBrain {
  startup_id: string;
  startup_name: string | null;
  idea: string | null;
  audience: string | null;
  customer_type: string | null;
  revenue_model: string | null;
  brand_vibe: string | null;
  positioning: string | null;
  colors: string[];
  fonts: string | null;
  flux_bg_url: string | null;
  flux_texture_url: string | null;
  video_frames_url: string | null;
  tech_stack: string | null;
  live_url: string | null;
  github_url: string | null;
  key_decisions: unknown[];
  history: unknown[];
  updated_at: string;
}

export type AgentName = "Alex" | "Sam" | "Jordan" | "Morgan" | "Riley";
export type AgentRole = "research" | "strategy" | "design" | "dev" | "launch";

export const AGENTS: Array<{
  name: AgentName;
  role: AgentRole;
  emoji: string;
  color: string;
  description: string;
}> = [
  { name: "Alex",   role: "research",  emoji: "🔍", color: "#6366F1", description: "Market research, competitors, audience" },
  { name: "Sam",    role: "strategy",  emoji: "📊", color: "#10B981", description: "Business plan, positioning, pricing" },
  { name: "Jordan", role: "design",    emoji: "🎨", color: "#F59E0B", description: "Brand assets, visual identity" },
  { name: "Morgan", role: "dev",       emoji: "⚙️", color: "#3B82F6", description: "Full code generation" },
  { name: "Riley",  role: "launch",    emoji: "🚀", color: "#EF4444", description: "Push to GitHub + Vercel deploy" },
];

export interface AgentMessage {
  id: string;
  startup_id: string;
  agent_name: AgentName;
  role: "user" | "assistant" | "system";
  content: string;
  tokens_used: number;
  created_at: string;
}

export interface AgentSummary {
  startup_id: string;
  agent_name: AgentName;
  summary: string;
  message_count: number;
  updated_at: string;
}

export interface CodeMap {
  startup_id: string;
  file_map: Record<string, unknown>;
  architecture: string;
  patterns: string;
  updated_at: string;
}

export interface TokenTransaction {
  id: string;
  user_id: string;
  startup_id: string | null;
  action: string;
  tokens_consumed: number;
  credits_used: number;
  created_at: string;
}

export interface Build {
  id: string;
  startup_id: string;
  status: "pending" | "running" | "done" | "error" | "cancelled";
  build_type: "standard" | "premium" | null;
  current_step: string | null;
  error_log: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface ExtractedIdea {
  name: string;
  description: string;
  industry: string;
  audience: string;
  customer_type: string;
  revenue_model: string;
  brand_vibe: string;
}
