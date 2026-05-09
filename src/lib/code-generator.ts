import Anthropic from "@anthropic-ai/sdk";

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

const V0_ENDPOINT = "https://v0.dev/chat/api/stream";

async function callV0Stream(
  prompt: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const apiKey = process.env.V0_API_KEY;

  const requestHeaders = {
    "Authorization": `Bearer ${apiKey ?? ""}`,
    "Content-Type": "application/json",
  };

  console.log("[v0 API] Calling: POST", V0_ENDPOINT);
  console.log("[v0 API] Key prefix:", apiKey?.slice(0, 12) ?? "NOT SET");
  console.log("[v0 API] Headers being sent:", {
    ...requestHeaders,
    Authorization: `Bearer ${apiKey?.slice(0, 12) ?? "NOT SET"}...`,
  });

  const response = await fetch(V0_ENDPOINT, {
    method: "POST",
    headers: requestHeaders,
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("[v0 API] FAILED:", {
      status: response.status,
      statusText: response.statusText,
      body: errorBody,
      responseHeaders: Object.fromEntries(response.headers.entries()),
    });
    throw new Error(`v0 API failed (HTTP ${response.status}): ${errorBody}`);
  }

  console.log("[v0 API] Response OK — status:", response.status);
  console.log("[v0 API] Response headers:", Object.fromEntries(response.headers.entries()));

  // Read the SSE stream
  const reader = response.body?.getReader();
  if (!reader) throw new Error("v0 API: no response body");

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const rawChunk = decoder.decode(value, { stream: true });
    console.log("[v0 API] Raw chunk:", rawChunk);
    buffer += rawChunk;

    // Parse SSE lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data) as Record<string, unknown>;
        // Handle both OpenAI-style delta and plain text formats
        const delta = (parsed as { choices?: Array<{ delta?: { content?: string } }> }).choices?.[0]?.delta?.content;
        const textField = (parsed as { text?: string }).text;
        const text = delta ?? textField ?? "";
        if (text) {
          fullText += text;
          onChunk?.(text);
        }
      } catch {
        // Not JSON — might be plain text chunk
        if (data) {
          fullText += data;
          onChunk?.(data);
        }
      }
    }
  }

  console.log("[v0 API] Stream complete — received", fullText.length, "chars");
  return fullText;
}

export async function generateLandingPage(
  brain: CodeGenBrain,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const [primary, secondary, accent] = brain.colors;
  const [displayFont, bodyFont] = brain.fonts;

  const prompt = `Create a stunning, production-ready Next.js landing page for "${brain.startup_name}".

STARTUP CONTEXT:
- What it does: ${brain.idea}
- Target audience: ${brain.audience}
- Unique positioning: ${brain.positioning}
- Revenue model: ${brain.revenue_model}

BRAND IDENTITY:
- Primary color: ${primary}
- Secondary color: ${secondary}
- Accent color: ${accent}
- Display font: "${displayFont}" (import from Google Fonts)
- Body font: "${bodyFont}" (import from Google Fonts)
- Hero background image: ${brain.flux_bg_url}
- Texture overlay: ${brain.flux_texture_url}

REQUIRED SECTIONS (in order):
1. Navigation — Logo + startup name left, CTA button right
2. Hero — Full viewport, Flux BG as CSS background-image, dark gradient overlay, noise texture overlay at 5% opacity, startup name as H1 in display font, one-line value prop, two CTA buttons (primary + secondary)
3. Features — 3 features with Lucide icons, relevant to this specific product
4. Social proof — 3 testimonial cards with real-sounding names and quotes
5. Pricing — Free tier + Pro tier with feature list
6. Final CTA — bold conversion section with email waitlist form
7. Footer — minimal, links

ANTI-SLOP RULES — VIOLATING THESE WILL FAIL:
- NEVER use generic purple/blue gradients — use ${primary} and ${secondary} only
- NEVER "Acme Corp" or "Company" — always "${brain.startup_name}"
- NEVER Inter as only font — must use ${displayFont} for all headings
- NEVER empty placeholder text — write real copy for this exact startup
- NEVER boring hover states — unique micro-interactions on every interactive element
- ALWAYS use ${brain.flux_bg_url} as the actual hero CSS background-image URL
- ALWAYS Framer Motion: fadeInUp with staggerChildren for each section
- ALWAYS fully mobile responsive with proper breakpoints
- ALWAYS dark theme unless brand palette is light

Return ONLY the complete TypeScript React component code. No explanation. No markdown fences. Start directly with "use client";`;

  const fullCode = await callV0Stream(prompt, onChunk);
  return fullCode || `"use client";\nexport default function Page() { return <main style={{background:"#0A0A0A",color:"#F5F5F5",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}><h1>${brain.startup_name}</h1></main>; }`;
}

// Smoke-test: run with `npx ts-node -e "require('./src/lib/code-generator').testV0()"`
export async function testV0(): Promise<void> {
  console.log("=== v0 API SMOKE TEST ===");
  try {
    const result = await callV0Stream(
      "Create a simple React button component with Tailwind CSS"
    );
    console.log("=== FULL RESPONSE ===");
    console.log(result);
    console.log("=== END ===");
  } catch (err) {
    console.error("=== TEST FAILED ===");
    console.error(err);
  }
}

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
1. package.json — next@14, react@18, @supabase/supabase-js, stripe, framer-motion, lucide-react, clsx, tailwind-merge
2. next.config.ts — images domains: fal.media, images.unsplash.com
3. tailwind.config.ts — brand colors as CSS custom properties
4. src/app/globals.css — Google Fonts imports for "${brain.fonts?.[0]}" and "${brain.fonts?.[1]}", CSS variables for all brand colors
5. src/lib/supabase.ts — Supabase browser client + server client factory
6. src/lib/stripe.ts — Stripe instance with type-safe helper
7. src/app/api/auth/callback/route.ts — Supabase OAuth code exchange callback
8. src/app/api/stripe/checkout/route.ts — POST: create Stripe checkout session
9. src/app/api/stripe/webhook/route.ts — handle checkout.session.completed + subscription events
10. src/app/api/waitlist/route.ts — POST: save email to Supabase waitlist table
11. supabase/schema.sql — tables: profiles, subscriptions, waitlist with RLS policies
12. .env.example — all required env vars with comments
13. README.md — 5-step setup guide

Return ONLY a valid JSON array. No markdown fences. No explanation before or after.`;

  let fullJson = "";

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    system: "You are Morgan, a senior full-stack engineer. Generate complete production code. Return ONLY valid JSON arrays with no markdown formatting.",
    messages: [{ role: "user", content: prompt }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      const text = event.delta.text;
      fullJson += text;
      onChunk?.(text);
    }
  }

  try {
    const cleaned = fullJson.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No array in response");
    return JSON.parse(match[0]) as GeneratedFile[];
  } catch {
    return [{ path: "generated-backend.txt", content: fullJson }];
  }
}

async function selfCorrect(
  files: GeneratedFile[],
  onChunk?: (chunk: string) => void
): Promise<GeneratedFile[]> {
  const anthropic = new Anthropic();
  const summary = files
    .slice(0, 6)
    .map(f => `### ${f.path}\n${f.content.slice(0, 300)}`)
    .join("\n\n");

  let fixJson = "";
  const stream = anthropic.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: `Review this Next.js codebase. Fix broken imports, missing exports, obvious type errors. Return ONLY files that need changes as JSON array [{path, content}]. Return [] if everything is fine.\n\n${summary}`,
    }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fixJson += event.delta.text;
      onChunk?.(event.delta.text);
    }
  }

  try {
    const cleaned = fixJson.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return files;
    const fixes = JSON.parse(match[0]) as GeneratedFile[];
    if (fixes.length === 0) return files;
    const fixMap = new Map(fixes.map(f => [f.path, f.content]));
    return files.map(f => fixMap.has(f.path) ? { path: f.path, content: fixMap.get(f.path)! } : f);
  } catch {
    return files;
  }
}

export async function generateFullCodebase(
  brain: CodeGenBrain,
  onChunk?: (chunk: string) => void
): Promise<GeneratedFile[]> {
  onChunk?.("// ══════════════════════════════════════════════\n// MORGAN: Building frontend (v0 API)\n// ══════════════════════════════════════════════\n\n");
  const landingPage = await generateLandingPage(brain, onChunk);

  onChunk?.("\n\n// ══════════════════════════════════════════════\n// MORGAN: Building backend (Claude Sonnet)\n// ══════════════════════════════════════════════\n\n");
  const backendFiles = await generateBackend(brain, onChunk);

  onChunk?.("\n\n// ══════════════════════════════════════════════\n// MORGAN: Self-correction pass (Claude Haiku)\n// ══════════════════════════════════════════════\n\n");
  const fixedFiles = await selfCorrect(backendFiles, onChunk);

  const rest = fixedFiles.filter(f => f.path !== "src/app/page.tsx");
  return [{ path: "src/app/page.tsx", content: landingPage }, ...rest];
}
