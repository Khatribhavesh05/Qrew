import Anthropic from "@anthropic-ai/sdk";
import { v0 } from "v0-sdk";

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface CodeGenBrain {
  startup_name: string;
  idea: string;
  audience: string;
  positioning: string;
  colors: string[];
  fonts: string[];
  flux_bg_url: string;
  flux_texture_url: string;
  tech_stack: string;
  revenue_model: string;
  brand_vibe: string;
}

// ── v0 helper ──────────────────────────────────────────────────────────────────

async function callV0(
  prompt: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const promptBytes = Buffer.byteLength(prompt, "utf8");
  console.log("[v0 SDK] Prompt chars:", prompt.length, "| bytes:", promptBytes);

  const chat = await v0.chats.create({ message: prompt });

  console.log("[v0 SDK] Chat created:", chat.id);
  console.log("[v0 SDK] Latest version status:", chat.latestVersion?.status);
  console.log("[v0 SDK] Files generated:", chat.latestVersion?.files?.length ?? 0);

  const files = chat.latestVersion?.files ?? [];
  const codeFile =
    files.find((f) => f.name === "app/page.tsx" || f.name === "page.tsx") ??
    files.find((f) => f.name.endsWith(".tsx") || f.name.endsWith(".jsx")) ??
    files.find((f) => f.name.endsWith(".ts") || f.name.endsWith(".js")) ??
    files[0];

  const code = codeFile?.content ?? chat.text ?? "";

  console.log("[v0 SDK] Extracted from file:", codeFile?.name ?? "(text field)");
  console.log("[v0 SDK] Code length:", code.length, "chars");

  if (code) onChunk?.(code);
  return code;
}

// ── Frontend: 3 v0 calls ───────────────────────────────────────────────────────

export async function generateLandingPage(
  brain: CodeGenBrain,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const [primary, secondary, accent] = brain.colors;
  const [displayFont, bodyFont] = brain.fonts;
  const fluxBg = brain.flux_bg_url?.startsWith("data:") ? "" : (brain.flux_bg_url ?? "");
  const fluxTexture = brain.flux_texture_url?.startsWith("data:") ? "" : (brain.flux_texture_url ?? "");

  // FIX 2: Dynamic layout based on brand_vibe
  const vibe = brain.brand_vibe.toLowerCase();
  let layoutInstruction: string;
  if (vibe.includes("dark") || vibe.includes("minimal")) {
    layoutInstruction =
      "Full viewport hero, large asymmetric typography, minimal navbar, content revealed on scroll";
  } else if (vibe.includes("playful") || vibe.includes("bold")) {
    layoutInstruction =
      "Colorful sections, large emoji accents, rounded cards, fun micro-interactions";
  } else if (vibe.includes("professional") || vibe.includes("corporate")) {
    layoutInstruction =
      "Clean grid layout, trust signals above fold, case study style sections";
  } else {
    layoutInstruction =
      "Full viewport hero, bold typography, smooth scroll sections, strong CTA hierarchy";
  }

  // CSS custom properties string for all brand colors
  const cssVars = brain.colors
    .map((c, i) => `--color-${["bg", "primary", "secondary", "accent"][i] ?? `c${i}`}: ${c};`)
    .join(" ");

  const prompt = `Create a stunning, production-ready Next.js landing page for "${brain.startup_name}".

This is a PREMIUM startup website. Every section must look unique and custom-designed for this specific brand.

STARTUP CONTEXT:
- Industry: ${brain.tech_stack ?? "SaaS"}
- Target audience: ${brain.audience.slice(0, 100)}
- Brand vibe: ${brain.brand_vibe.slice(0, 100)}
- Key value proposition: ${brain.idea.slice(0, 200)}

BRAND IDENTITY — define these in a <style> tag or global CSS :root block at the top of the component:
\`:root {
  ${cssVars}
}\`
- Primary color: ${primary}
- Secondary color: ${secondary}
- Accent color: ${accent}
- Display font: "${displayFont}" — use this for ALL headings and hero text (import from Google Fonts)
- Body font: "${bodyFont}" — use this for paragraphs and UI text (import from Google Fonts)

LAYOUT INSTRUCTION (based on brand vibe "${brain.brand_vibe}"):
${layoutInstruction}

HERO BACKGROUND — CRITICAL — COPY THIS EXACTLY INTO YOUR JSX:
${fluxBg
  ? `The hero section MUST use this exact inline style object — do not paraphrase, do not omit the URL:
  style={{
    backgroundImage: "url('${fluxBg}')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    minHeight: "100vh",
    position: "relative",
  }}
Inside the hero, add a dark overlay as the first child element:
  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} />
This overlay ensures text readability. All hero text goes AFTER this overlay div (use position: relative and z-index: 1).
DO NOT replace this backgroundImage with a gradient. The URL must appear literally in the rendered JSX.`
  : `flux_bg_url is empty — use an animated CSS mesh gradient hero using the brand colors above`}
${fluxTexture
  ? `TEXTURE OVERLAY: Apply this URL as a noise texture across the ENTIRE page at 5% opacity using a fixed-position wrapper div as the very first element inside the root:
  <div style={{ position: "fixed", inset: 0, backgroundImage: "url('${fluxTexture}')", opacity: 0.05, pointerEvents: "none", zIndex: 0 }} />`
  : ""}

REQUIRED SECTIONS (in order):
1. Navigation — Logo + startup name left, CTA button right
2. Hero — Full viewport, background EXACTLY as specified above, startup name as H1 in ${displayFont}, one-line value prop, two CTA buttons (primary + secondary)
3. Features — 3 features with Lucide icons, relevant to this specific product, each with a unique layout (not a uniform 3-column card grid)
4. Social proof — 3 testimonial cards with real-sounding names and quotes specific to this product's value
5. Pricing — Free tier + Pro tier with feature list
6. Final CTA — bold conversion section with email waitlist form
7. Footer — minimal, links

HARD BANS — violating any of these makes the output unacceptable:
- DO NOT use purple gradients or blue-to-purple gradients anywhere — use ${primary} and ${secondary} only
- DO NOT use Inter as the only font — "${displayFont}" is REQUIRED for every heading, hero text, and display element
- DO NOT use generic card layouts where every section looks the same (3 equal cards side by side)
- DO NOT use "Acme Corp", "Company", or any placeholder name — always "${brain.startup_name}"
- DO NOT use empty placeholder text — write real, specific copy for this exact startup and its audience
- DO NOT use boring hover states — every interactive element needs a unique micro-interaction

REQUIRED QUALITY BARS:
- ALWAYS Framer Motion: fadeInUp with staggerChildren for every section reveal
- ALWAYS fully mobile responsive with proper breakpoints
- ALWAYS dark theme unless brand palette is explicitly light
- ALWAYS write copy as if you are the startup's actual marketing team

Return ONLY the complete TypeScript React component code. No explanation. No markdown fences. Start directly with "use client";`;

  const code = await callV0(prompt, onChunk);
  return code || `"use client";\nexport default function Page() { return <main style={{background:"#0A0A0A",color:"#F5F5F5",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><h1 style={{fontSize:"3rem",fontWeight:700}}>${brain.startup_name}</h1></main>; }`;
}

async function generateAuthPage(
  brain: CodeGenBrain,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const [primary, secondary] = brain.colors;
  const [displayFont] = brain.fonts;

  const prompt = `Create a polished Next.js auth page for "${brain.startup_name}".

BRAND:
- Primary color: ${primary}
- Secondary color: ${secondary}
- Display font: "${displayFont}"
- Dark theme: background #0A0A0A, cards #111111, borders #1F1F1F

REQUIRED:
1. Centered card layout, max-width 420px
2. App logo / name at top using display font
3. "Continue with Google" OAuth button (primary color)
4. Email + password fields with dark styling
5. Sign In / Sign Up toggle
6. Framer Motion fade-in animation on mount
7. Fully responsive

USE:
- createClient() from "@/lib/supabase" for auth
- supabase.auth.signInWithOAuth({ provider: "google" }) for Google
- supabase.auth.signInWithPassword() for email/password
- Redirect to /dashboard after login
- Lucide React icons only

Return ONLY the complete TypeScript React component code starting with "use client";`;

  const code = await callV0(prompt, onChunk);
  return code || `"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
export default function AuthPage() {
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const signIn = async () => { setLoading(true); await supabase.auth.signInWithPassword({ email, password: pw }); setLoading(false); };
  const google = async () => { await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin + "/api/auth/callback" } }); };
  return (
    <main style={{background:"#0A0A0A",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{width:"100%",maxWidth:"420px",background:"#111111",borderRadius:"16px",padding:"2rem",border:"1px solid #1F1F1F"}}>
        <h1 style={{color:"#F5F5F5",fontSize:"1.5rem",fontWeight:700,marginBottom:"2rem"}}>${brain.startup_name}</h1>
        <button onClick={google} style={{width:"100%",padding:"0.75rem",borderRadius:"8px",background:"${primary}",color:"#fff",fontWeight:600,cursor:"pointer",border:"none",marginBottom:"1rem"}}>Continue with Google</button>
        <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:"0.75rem",borderRadius:"8px",background:"#0A0A0A",border:"1px solid #1F1F1F",color:"#F5F5F5",marginBottom:"0.5rem",outline:"none"}}/>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} style={{width:"100%",padding:"0.75rem",borderRadius:"8px",background:"#0A0A0A",border:"1px solid #1F1F1F",color:"#F5F5F5",marginBottom:"1rem",outline:"none"}}/>
        <button onClick={signIn} disabled={loading} style={{width:"100%",padding:"0.75rem",borderRadius:"8px",background:"#1F1F1F",color:"#F5F5F5",cursor:"pointer",border:"1px solid #2A2A2A"}}>Sign In</button>
      </div>
    </main>
  );
}`;
}

async function generateDashboardPage(
  brain: CodeGenBrain,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const [primary, secondary] = brain.colors;
  const [displayFont] = brain.fonts;

  const prompt = `Create a user dashboard page for "${brain.startup_name}" (Next.js, TypeScript).

PRODUCT CONTEXT:
- Product: ${brain.idea.slice(0, 150)}
- Audience: ${brain.audience.slice(0, 80)}
- Revenue model: ${brain.revenue_model}

BRAND:
- Primary color: ${primary}
- Secondary color: ${secondary}
- Display font: "${displayFont}"
- Dark theme: background #0A0A0A, sidebar #0D0D0D, cards #111111

REQUIRED SECTIONS:
1. Left sidebar (240px) — logo, nav links relevant to this product, user avatar, sign out
2. Main content area:
   - Welcome header with user's name
   - 3 stat cards relevant to this product (not generic "Users/Revenue/Active")
   - Recent activity feed
   - Quick action buttons
3. Framer Motion stagger animation on mount

USE:
- createClient() from "@/lib/supabase"
- supabase.auth.getUser() to get current user
- Redirect to /auth if not logged in
- Lucide React icons
- Fully responsive (mobile: sidebar becomes bottom nav)

Return ONLY the complete TypeScript React component code starting with "use client";`;

  const code = await callV0(prompt, onChunk);
  return code || `"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
export default function DashboardPage() {
  const [user, setUser] = useState<User|null>(null);
  const supabase = createClient();
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { if (!data.user) window.location.href = "/auth"; else setUser(data.user); }); }, []);
  return (
    <main style={{background:"#0A0A0A",minHeight:"100vh",color:"#F5F5F5",padding:"2rem"}}>
      <div style={{maxWidth:"1200px",margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"3rem"}}>
          <h1 style={{fontSize:"1.5rem",fontWeight:700}}>${brain.startup_name}</h1>
          {user?.email && <span style={{color:"#A3A3A3",fontSize:"0.875rem"}}>{user.email}</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"1.5rem"}}>
          {["Overview","Analytics","Settings"].map(label => (
            <div key={label} style={{background:"#111111",border:"1px solid #1F1F1F",borderRadius:"12px",padding:"1.5rem"}}>
              <p style={{color:"#525252",fontSize:"0.75rem",marginBottom:"0.5rem"}}>{label}</p>
              <p style={{fontSize:"1.5rem",fontWeight:700,color:"${primary}"}}>—</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}`;
}

// ── Backend: Claude generates all infra files ──────────────────────────────────

export async function generateBackend(
  brain: CodeGenBrain,
  onChunk?: (chunk: string) => void
): Promise<GeneratedFile[]> {
  const anthropic = new Anthropic();

  const prompt = `Generate a complete Next.js 14 App Router backend for "${brain.startup_name}".

CONTEXT:
- Product: ${brain.idea}
- Audience: ${brain.audience}
- Tech stack: ${brain.tech_stack ?? "Next.js 14 + Supabase + Stripe + TypeScript"}
- Revenue model: ${brain.revenue_model}
- Brand colors: ${brain.colors?.join(", ")}
- Fonts: ${brain.fonts?.join(", ")}

Generate these files as a JSON array of {"path": "...", "content": "..."}:
1. package.json — next@14, react@18, @supabase/supabase-js, @supabase/ssr, stripe, framer-motion, lucide-react, clsx, tailwind-merge
2. next.config.ts — images domains: fal.media, images.unsplash.com
3. tailwind.config.ts — brand colors as CSS custom properties
4. src/app/globals.css — Google Fonts imports for "${brain.fonts?.[0]}" and "${brain.fonts?.[1]}", CSS variables for all brand colors
5. src/app/layout.tsx — root layout with Google Fonts link tag, metadata for "${brain.startup_name}"
6. src/lib/supabase.ts — Supabase browser client (createBrowserClient) + server client factory (createServerSupabaseClient using @supabase/ssr cookies)
7. src/lib/stripe.ts — Stripe instance initialized from STRIPE_SECRET_KEY
8. src/app/api/auth/callback/route.ts — Supabase OAuth code exchange callback
9. src/app/api/stripe/checkout/route.ts — POST: create Stripe checkout session
10. src/app/api/stripe/webhook/route.ts — handle checkout.session.completed + subscription events
11. src/app/api/waitlist/route.ts — POST: save email to Supabase waitlist table
12. src/types/supabase.ts — Database type definitions for profiles, subscriptions, waitlist tables
13. supabase/schema.sql — tables: profiles, subscriptions, waitlist with RLS policies and auto-profile trigger
14. .env.example — all required env vars with comments
15. README.md — 5-step setup guide

Return ONLY a valid JSON array. No markdown fences. No explanation before or after.`;

  let fullJson = "";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 10000,
    system:
      "You are Morgan, a senior full-stack engineer. Generate complete production code. Return ONLY valid JSON arrays with no markdown formatting.",
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      const text = event.delta.text;
      fullJson += text;
      onChunk?.(text);
    }
  }

  try {
    const cleaned = fullJson
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No array in response");
    return JSON.parse(match[0]) as GeneratedFile[];
  } catch {
    return [{ path: "generated-backend.txt", content: fullJson }];
  }
}

// ── Self-correction ────────────────────────────────────────────────────────────

async function selfCorrect(
  files: GeneratedFile[],
  onChunk?: (chunk: string) => void
): Promise<GeneratedFile[]> {
  const anthropic = new Anthropic();
  const summary = files
    .slice(0, 8)
    .map((f) => `### ${f.path}\n${f.content.slice(0, 300)}`)
    .join("\n\n");

  let fixJson = "";
  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `Review this Next.js codebase. Fix broken imports, missing exports, obvious type errors. Return ONLY files that need changes as JSON array [{path, content}]. Return [] if everything is fine.\n\n${summary}`,
      },
    ],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      fixJson += event.delta.text;
      onChunk?.(event.delta.text);
    }
  }

  try {
    const cleaned = fixJson
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return files;
    const fixes = JSON.parse(match[0]) as GeneratedFile[];
    if (fixes.length === 0) return files;
    const fixMap = new Map(fixes.map((f) => [f.path, f.content]));
    return files.map((f) =>
      fixMap.has(f.path) ? { path: f.path, content: fixMap.get(f.path)! } : f
    );
  } catch {
    return files;
  }
}

// ── Main orchestrator ──────────────────────────────────────────────────────────

export async function generateFullCodebase(
  brain: CodeGenBrain,
  onChunk?: (chunk: string) => void
): Promise<GeneratedFile[]> {
  const frontendFiles: GeneratedFile[] = [];

  // ── Step 1: Landing page (v0) ──────────────────────────────────────────────
  onChunk?.(
    "// ══════════════════════════════════════════════\n// MORGAN: Building frontend (v0 API)\n// ══════════════════════════════════════════════\n\n"
  );

  onChunk?.("// ═══ GENERATING: src/app/page.tsx ═══\n");
  const landingCode = await generateLandingPage(brain, onChunk);
  frontendFiles.push({ path: "src/app/page.tsx", content: landingCode });

  // ── Step 2: Auth page (v0) ─────────────────────────────────────────────────
  onChunk?.("\n\n// ═══ GENERATING: src/app/auth/page.tsx ═══\n");
  const authCode = await generateAuthPage(brain, onChunk);
  frontendFiles.push({ path: "src/app/auth/page.tsx", content: authCode });

  // ── Step 3: Dashboard page (v0) ───────────────────────────────────────────
  onChunk?.("\n\n// ═══ GENERATING: src/app/dashboard/page.tsx ═══\n");
  const dashCode = await generateDashboardPage(brain, onChunk);
  frontendFiles.push({ path: "src/app/dashboard/page.tsx", content: dashCode });

  // ── Step 4: Backend (Claude Sonnet) ───────────────────────────────────────
  onChunk?.(
    "\n\n// ══════════════════════════════════════════════\n// MORGAN: Building backend (Claude Sonnet)\n// ══════════════════════════════════════════════\n\n"
  );
  const backendFiles = await generateBackend(brain, onChunk);

  // ── Step 5: Self-correction (Claude Haiku) ────────────────────────────────
  onChunk?.(
    "\n\n// ══════════════════════════════════════════════\n// MORGAN: Self-correction pass (Claude Haiku)\n// ══════════════════════════════════════════════\n\n"
  );
  const fixedBackend = await selfCorrect(backendFiles, onChunk);

  // Merge: frontend pages + backend (backend wins if there's a path conflict
  // except for the three pages we just generated from v0)
  const frontendPaths = new Set(frontendFiles.map((f) => f.path));
  const mergedBackend = fixedBackend.filter((f) => !frontendPaths.has(f.path));

  return [...frontendFiles, ...mergedBackend];
}

// ── Smoke test ─────────────────────────────────────────────────────────────────
export async function testV0(): Promise<void> {
  console.log("=== v0 SDK SMOKE TEST ===");
  try {
    const chat = await v0.chats.create({
      message:
        "Create a hero section for a fitness app called MomFit with indigo colors and Framer Motion animations",
    });
    const messages = await v0.chats.findMessages({ chatId: chat.id });
    console.log("=== FULL CHAT RESPONSE ===");
    console.log(JSON.stringify(chat, null, 2));
    console.log("=== MESSAGES ===");
    console.log(JSON.stringify(messages, null, 2));
    console.log("=== END ===");
  } catch (err) {
    console.error("=== TEST FAILED ===");
    console.error(err);
  }
}
