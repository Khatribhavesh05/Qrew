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
  const [bg, primary, secondary, accent, text] = brain.colors;
  const [displayFont, bodyFont] = brain.fonts;
  const fluxBg = brain.flux_bg_url?.startsWith("data:") ? "" : (brain.flux_bg_url ?? "");
  const fluxTexture = brain.flux_texture_url?.startsWith("data:") ? "" : (brain.flux_texture_url ?? "");

  console.log(`[Morgan] Building landing page for ${brain.startup_name}`);
  console.log(`[Morgan] Using colors: ${brain.colors.join(", ")}`);
  console.log(`[Morgan] Using fonts: ${brain.fonts.join(", ")}`);
  console.log(`[Morgan] Flux BG URL: ${fluxBg ? "✓ Present" : "✗ Missing"}`);

  const prompt = `You are building a PREMIUM, production-ready Next.js 14 landing page for "${brain.startup_name}".

═══════════════════════════════════════════════════════════════════════════════
STARTUP IDENTITY
═══════════════════════════════════════════════════════════════════════════════
Name: ${brain.startup_name}
Industry: ${brain.tech_stack ?? "SaaS"}
Idea: ${brain.idea.slice(0, 250)}
Target Audience: ${brain.audience.slice(0, 150)}
Positioning: ${brain.positioning.slice(0, 150)}
Brand Vibe: ${brain.brand_vibe}

═══════════════════════════════════════════════════════════════════════════════
BRAND COLORS — USE THESE EXACT VALUES EVERYWHERE
═══════════════════════════════════════════════════════════════════════════════
Background: ${bg}
Primary: ${primary}
Secondary: ${secondary}
Accent: ${accent}
Text: ${text}

Define these as CSS variables at the top of your component:
<style jsx global>{\`
  :root {
    --color-bg: ${bg};
    --color-primary: ${primary};
    --color-secondary: ${secondary};
    --color-accent: ${accent};
    --color-text: ${text};
  }
\`}</style>

═══════════════════════════════════════════════════════════════════════════════
TYPOGRAPHY — IMPORT AND USE THESE EXACT GOOGLE FONTS
═══════════════════════════════════════════════════════════════════════════════
Display Font (headings, hero, CTAs): "${displayFont}"
Body Font (paragraphs, UI text): "${bodyFont}"

Import at the top of your component:
import { ${displayFont.replace(/\s+/g, "_")}, ${bodyFont.replace(/\s+/g, "_")} } from "next/font/google";

const displayFont = ${displayFont.replace(/\s+/g, "_")}({ subsets: ["latin"], weight: ["600", "700"] });
const bodyFont = ${bodyFont.replace(/\s+/g, "_")}({ subsets: ["latin"], weight: ["400", "500", "600"] });

Apply fonts:
- All <h1>, <h2>, <h3>, hero text, CTA buttons → className={displayFont.className}
- All <p>, <span>, body text → className={bodyFont.className}

═══════════════════════════════════════════════════════════════════════════════
HERO BACKGROUND IMAGE — CRITICAL REQUIREMENT
═══════════════════════════════════════════════════════════════════════════════
${fluxBg
  ? `The hero section MUST use this EXACT background image URL. Copy this style object LITERALLY into your JSX:

<section
  className="relative min-h-screen flex items-center justify-center"
  style={{
    backgroundImage: "url('${fluxBg}')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  }}
>
  {/* Dark overlay for text readability */}
  <div className="absolute inset-0 bg-black/60" />
  
  {/* Hero content with z-index to appear above overlay */}
  <div className="relative z-10 container mx-auto px-6 text-center">
    {/* Your hero content here */}
  </div>
</section>

DO NOT:
- Replace the URL with a gradient
- Omit the backgroundImage property
- Use a different image
- Skip the dark overlay

The URL ${fluxBg} MUST appear in the final code.`
  : `No Flux background provided. Create an animated mesh gradient hero using the brand colors: ${bg}, ${primary}, ${secondary}, ${accent}`}

${fluxTexture
  ? `
TEXTURE OVERLAY (optional enhancement):
Add this as the FIRST element inside your root component for subtle texture:
<div
  className="fixed inset-0 pointer-events-none z-0 opacity-5"
  style={{ backgroundImage: "url('${fluxTexture}')" }}
/>`
  : ""}

═══════════════════════════════════════════════════════════════════════════════
REQUIRED SECTIONS — BUILD IN THIS EXACT ORDER
═══════════════════════════════════════════════════════════════════════════════

1. NAVIGATION BAR
   - Fixed top, backdrop blur
   - Logo + "${brain.startup_name}" on left
   - Primary CTA button on right (use ${primary} color)
   - Mobile hamburger menu

2. HERO SECTION
   - Full viewport height (min-h-screen)
   - Background image as specified above
   - H1: "${brain.startup_name}" in ${displayFont}
   - Tagline: One compelling sentence about ${brain.idea.slice(0, 100)}
   - Two CTA buttons: "Get Started" (${primary}) + "Learn More" (outline)
   - Framer Motion: fadeIn animation on mount

3. FEATURES SECTION
   - Title: "Why ${brain.startup_name}?"
   - 3-4 feature cards relevant to ${brain.idea.slice(0, 80)}
   - Each card: Lucide icon, title, description
   - Unique layouts (not uniform grid) — stagger cards, alternate left/right
   - Framer Motion: staggerChildren, each card slides up on scroll

4. HOW IT WORKS
   - Title: "How It Works"
   - 3 steps with numbers, icons, descriptions
   - Timeline or flow diagram layout
   - Framer Motion: sequential reveal on scroll

5. TESTIMONIALS
   - Title: "What People Say"
   - 3 testimonial cards with:
     * Real-sounding name (not "John Doe")
     * Role/company relevant to ${brain.audience.slice(0, 50)}
     * Quote specific to ${brain.idea.slice(0, 80)} value
   - Framer Motion: fade in with slight rotation

6. PRICING
   - Title: "Simple Pricing"
   - 2-3 tiers: Free, Pro, Enterprise
   - Feature lists relevant to ${brain.revenue_model}
   - CTA buttons (${primary} for recommended tier)
   - Framer Motion: scale up on scroll

7. FINAL CTA
   - Bold headline: "Ready to get started?"
   - Email waitlist form (input + submit button)
   - Use ${primary} for submit button
   - Framer Motion: pulse animation on CTA

8. FOOTER
   - Links: About, Privacy, Terms, Contact
   - Social icons (optional)
   - Copyright © 2024 ${brain.startup_name}

═══════════════════════════════════════════════════════════════════════════════
FRAMER MOTION ANIMATIONS — REQUIRED FOR EVERY SECTION
═══════════════════════════════════════════════════════════════════════════════

Import: import { motion } from "framer-motion";

Animation variants to use:

const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

Apply to sections:
<motion.section
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, margin: "-100px" }}
  variants={fadeInUp}
>

For card grids:
<motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
  {items.map(item => (
    <motion.div key={item.id} variants={fadeInUp}>
      {/* card content */}
    </motion.div>
  ))}
</motion.div>

═══════════════════════════════════════════════════════════════════════════════
QUALITY REQUIREMENTS — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════════════════════════

✓ Use ONLY the provided brand colors (${bg}, ${primary}, ${secondary}, ${accent}, ${text})
✓ Use ONLY the provided fonts (${displayFont}, ${bodyFont})
✓ Include Flux background image URL ${fluxBg ? "EXACTLY as provided" : "(not provided)"}
✓ Every section has Framer Motion animations
✓ Fully responsive (mobile, tablet, desktop breakpoints)
✓ Real, specific copy — NO generic placeholders like "Lorem ipsum" or "Acme Corp"
✓ Write as if you're the actual marketing team for ${brain.startup_name}
✓ Unique layouts — avoid repetitive 3-column card grids
✓ Interactive hover states on all buttons and cards
✓ Dark theme aesthetic (unless brand colors are explicitly light)

✗ DO NOT use purple/blue gradients
✗ DO NOT use Inter as the only font
✗ DO NOT use placeholder company names
✗ DO NOT skip Framer Motion animations
✗ DO NOT ignore the Flux background image URL

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Return ONLY the complete TypeScript React component code.
Start with: "use client";
No markdown fences. No explanations. Just the code.`;

  const code = await callV0(prompt, onChunk);
  return code || `"use client";\nexport default function Page() { return <main style={{background:"#0A0A0A",color:"#F5F5F5",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><h1 style={{fontSize:"3rem",fontWeight:700}}>${brain.startup_name}</h1></main>; }`;
}

async function generateAuthPage(
  brain: CodeGenBrain,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const [bg, primary, secondary, accent, text] = brain.colors;
  const [displayFont, bodyFont] = brain.fonts;

  const prompt = `Create a polished Next.js 14 auth page for "${brain.startup_name}".

═══════════════════════════════════════════════════════════════════════════════
BRAND IDENTITY
═══════════════════════════════════════════════════════════════════════════════
Colors:
- Background: ${bg}
- Primary: ${primary}
- Secondary: ${secondary}
- Accent: ${accent}
- Text: ${text}

Fonts:
- Display: "${displayFont}" (for logo, headings)
- Body: "${bodyFont}" (for form labels, text)

Import fonts from next/font/google and apply via className.

═══════════════════════════════════════════════════════════════════════════════
LAYOUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
1. Full-screen centered layout (min-h-screen flex items-center justify-center)
2. Auth card: max-w-md, rounded-2xl, backdrop blur, border
3. Logo/brand name at top in ${displayFont}
4. "Continue with Google" button (${primary} background)
5. Divider: "or continue with email"
6. Email + password inputs with proper styling
7. "Sign In" / "Sign Up" toggle
8. Framer Motion: card slides up + fades in on mount
9. Fully responsive

═══════════════════════════════════════════════════════════════════════════════
AUTHENTICATION LOGIC
═══════════════════════════════════════════════════════════════════════════════
Import: import { createClient } from "@/lib/supabase";

Google OAuth:
const supabase = createClient();
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: window.location.origin + "/api/auth/callback" }
});

Email/Password:
await supabase.auth.signInWithPassword({ email, password });
// or
await supabase.auth.signUp({ email, password });

Redirect to /dashboard after successful login.

═══════════════════════════════════════════════════════════════════════════════
FRAMER MOTION ANIMATION
═══════════════════════════════════════════════════════════════════════════════
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* Auth card content */}
</motion.div>

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
  const [bg, primary, secondary, accent, text] = brain.colors;
  const [displayFont, bodyFont] = brain.fonts;

  const prompt = `Create a user dashboard page for "${brain.startup_name}" (Next.js 14, TypeScript).

═══════════════════════════════════════════════════════════════════════════════
PRODUCT CONTEXT
═══════════════════════════════════════════════════════════════════════════════
Product: ${brain.idea.slice(0, 200)}
Audience: ${brain.audience.slice(0, 100)}
Revenue Model: ${brain.revenue_model}

═══════════════════════════════════════════════════════════════════════════════
BRAND IDENTITY
═══════════════════════════════════════════════════════════════════════════════
Colors:
- Background: ${bg}
- Primary: ${primary}
- Secondary: ${secondary}
- Accent: ${accent}
- Text: ${text}

Fonts:
- Display: "${displayFont}" (for headings, stats)
- Body: "${bodyFont}" (for UI text)

Import from next/font/google and apply via className.

═══════════════════════════════════════════════════════════════════════════════
LAYOUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════
1. LEFT SIDEBAR (w-64, fixed)
   - Logo + "${brain.startup_name}" at top
   - Navigation links relevant to ${brain.idea.slice(0, 60)}
   - User avatar + email at bottom
   - Sign out button
   - Background: slightly lighter than main bg

2. MAIN CONTENT AREA (ml-64)
   - Welcome header: "Welcome back, [User Name]"
   - 3-4 stat cards relevant to this product (NOT generic "Users/Revenue")
     Examples for ${brain.idea.slice(0, 80)}: active projects, completion rate, etc.
   - Recent activity feed
   - Quick action buttons (${primary} color)

3. MOBILE RESPONSIVE
   - Sidebar becomes slide-out drawer
   - Bottom navigation bar on mobile

═══════════════════════════════════════════════════════════════════════════════
AUTHENTICATION & DATA
═══════════════════════════════════════════════════════════════════════════════
Import: import { createClient } from "@/lib/supabase";

On mount:
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) router.push("/auth");

Display user.email and user.user_metadata.full_name

Sign out:
await supabase.auth.signOut();
router.push("/auth");

═══════════════════════════════════════════════════════════════════════════════
FRAMER MOTION ANIMATIONS
═══════════════════════════════════════════════════════════════════════════════
import { motion } from "framer-motion";

Stagger stat cards on mount:
<motion.div
  variants={{
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }}
  initial="hidden"
  animate="visible"
>
  {stats.map(stat => (
    <motion.div
      key={stat.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {/* Stat card */}
    </motion.div>
  ))}
</motion.div>

Use Lucide React icons throughout.

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
