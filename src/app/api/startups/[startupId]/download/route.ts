import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { zipSync, strToU8 } from "fflate";
import type { CompanyBrain } from "@/types";

// ── Template generators ────────────────────────────────────────────────────────

function makeReadme(name: string): string {
  return `# ${name}
Built with Qrew — AI Startup Builder

## Setup
1. Clone this repo
2. Run: npm install
3. Copy .env.example to .env.local
4. Fill in your environment variables
5. Run Supabase schema: paste supabase/schema.sql in your Supabase SQL editor
6. Run: npm run dev
7. Open http://localhost:3000

## Environment Variables
- NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anon key
- SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key
- STRIPE_SECRET_KEY: Your Stripe secret key
- STRIPE_PUBLISHABLE_KEY: Your Stripe publishable key
- STRIPE_WEBHOOK_SECRET: Your Stripe webhook secret
- NEXT_PUBLIC_SITE_URL: Your deployment URL

## Tech Stack
- Next.js 14 + TypeScript
- Tailwind CSS + Framer Motion
- Supabase (Auth + Database)
- Stripe (Payments)
`;
}

function makeEnvExample(): string {
  return `# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_SITE_URL=
`;
}

function makePackageJson(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return JSON.stringify(
    {
      name: slug || "my-startup",
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        next: "14.2.5",
        react: "^18",
        "react-dom": "^18",
        "@supabase/supabase-js": "^2",
        "@supabase/ssr": "^0.3.0",
        "framer-motion": "^11",
        "lucide-react": "^0.400.0",
        stripe: "^15",
        clsx: "^2",
        "tailwind-merge": "^2",
      },
      devDependencies: {
        typescript: "^5",
        "@types/node": "^20",
        "@types/react": "^18",
        "@types/react-dom": "^18",
        tailwindcss: "^3.4",
        autoprefixer: "^10",
        postcss: "^8",
        eslint: "^8",
        "eslint-config-next": "14.2.5",
      },
    },
    null,
    2
  );
}

function makeNextConfig(): string {
  return `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'fal.media' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
`;
}

function makeTailwindConfig(colors: string[], fonts: string[]): string {
  const [bg, primary, secondary, accent] = colors;
  const [displayFont, bodyFont] = fonts;
  return `import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '${bg ?? "#0A0A0A"}',
        primary: '${primary ?? "#6366F1"}',
        secondary: '${secondary ?? "#10B981"}',
        accent: '${accent ?? "#818CF8"}',
      },
      fontFamily: {
        display: ['var(--font-display)', '${displayFont ?? "Space Grotesk"}', 'sans-serif'],
        body: ['var(--font-body)', '${bodyFont ?? "Inter"}', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
`;
}

function makeGlobalsCss(colors: string[], fonts: string[]): string {
  const [bg, primary, secondary] = colors;
  const [displayFont, bodyFont] = fonts;
  const dfSlug = (displayFont ?? "Space Grotesk").replace(/ /g, "+");
  const bfSlug = (bodyFont ?? "Inter").replace(/ /g, "+");
  return `@import url('https://fonts.googleapis.com/css2?family=${dfSlug}:wght@400;600;700;800&family=${bfSlug}:wght@300;400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-display: '${displayFont ?? "Space Grotesk"}', sans-serif;
  --font-body: '${bodyFont ?? "Inter"}', sans-serif;
  --color-bg: ${bg ?? "#0A0A0A"};
  --color-primary: ${primary ?? "#6366F1"};
  --color-secondary: ${secondary ?? "#10B981"};
}

* { box-sizing: border-box; padding: 0; margin: 0; }

html, body {
  max-width: 100vw;
  overflow-x: hidden;
  background: var(--color-bg);
  color: #F5F5F5;
  font-family: var(--font-body);
}
`;
}

function makeLayout(name: string, fonts: string[]): string {
  const [displayFont, bodyFont] = fonts;
  const dfSlug = (displayFont ?? "Space Grotesk").replace(/ /g, "+");
  const bfSlug = (bodyFont ?? "Inter").replace(/ /g, "+");
  return `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${name}",
  description: "${name} — Built with Qrew",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=${dfSlug}:wght@400;600;700;800&family=${bfSlug}:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
`;
}

function makeTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./src/*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  );
}

function makePostcss(): string {
  return `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
`;
}

function makeSupabaseTypes(): string {
  return `export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; created_at: string }
        Insert: { id: string; email: string; created_at?: string }
        Update: { id?: string; email?: string; created_at?: string }
      }
      waitlist: {
        Row: { id: string; email: string; created_at: string }
        Insert: { id?: string; email: string; created_at?: string }
        Update: { id?: string; email?: string; created_at?: string }
      }
      subscriptions: {
        Row: { id: string; user_id: string; stripe_customer_id: string | null; stripe_subscription_id: string | null; status: string; created_at: string }
        Insert: { id?: string; user_id: string; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; status?: string; created_at?: string }
        Update: { id?: string; user_id?: string; stripe_customer_id?: string | null; stripe_subscription_id?: string | null; status?: string }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
`;
}

function makeSupabaseLib(): string {
  return `import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
`;
}

function makeStripeLib(): string {
  return `import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});
`;
}

function makeAuthCallback(): string {
  return `import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(\`\${origin}\${next}\`);
  }

  return NextResponse.redirect(\`\${origin}/auth?error=auth_failed\`);
}
`;
}

function makeWaitlistRoute(): string {
  return `import { type NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { email } = (await request.json()) as { email: string };
    if (!email?.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('waitlist').insert({ email });
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
`;
}

function makeStripeCheckoutRoute(): string {
  return `import { type NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { priceId } = (await request.json()) as { priceId: string };
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: \`\${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_SITE_URL}/pricing\`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
`;
}

function makeStripeWebhookRoute(): string {
  return `import { type NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerSupabaseClient } from '@/lib/supabase';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (userId) {
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        status: 'active',
      });
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', sub.id);
  }

  return NextResponse.json({ received: true });
}
`;
}

function makeSupabaseSchema(): string {
  return `-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles (auto-created on signup)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  created_at timestamptz default now()
);

-- Subscriptions
create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text default 'inactive',
  created_at timestamptz default now()
);

-- Waitlist
create table if not exists waitlist (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table waitlist enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can view own subscription" on subscriptions for select using (auth.uid() = user_id);
create policy "Anyone can join waitlist" on waitlist for insert with check (true);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
`;
}

function makeAuthPage(name: string, primaryColor: string): string {
  return `"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const supabase = createClient();

  const handleMagicLink = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ email });
    setMessage(error ? error.message : "Check your email for the magic link!");
    setLoading(false);
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: \`\${window.location.origin}/api/auth/callback\` },
    });
  };

  return (
    <main style={{ background: "#0A0A0A", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#F5F5F5", marginBottom: "0.5rem" }}>${name}</h1>
        <p style={{ color: "#A3A3A3", marginBottom: "2rem" }}>Sign in to continue</p>

        <button
          onClick={handleGoogle}
          style={{ width: "100%", padding: "0.75rem", borderRadius: "8px", background: "${primaryColor}", color: "#fff", fontWeight: 600, cursor: "pointer", border: "none", marginBottom: "1.5rem" }}
        >
          Continue with Google
        </button>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" onKeyDown={e => e.key === "Enter" && void handleMagicLink()}
            style={{ flex: 1, padding: "0.75rem", borderRadius: "8px", background: "#111111", border: "1px solid #1F1F1F", color: "#F5F5F5", outline: "none" }}
          />
          <button
            onClick={() => void handleMagicLink()} disabled={loading}
            style={{ padding: "0.75rem 1rem", borderRadius: "8px", background: "#1F1F1F", color: "#F5F5F5", cursor: "pointer", border: "none" }}
          >
            {loading ? "…" : "→"}
          </button>
        </div>

        {message && <p style={{ color: "#10B981", fontSize: "0.875rem", textAlign: "center", marginTop: "1rem" }}>{message}</p>}
      </div>
    </main>
  );
}
`;
}

function makeDashboardPage(name: string, primaryColor: string): string {
  return `"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <main style={{ background: "#0A0A0A", minHeight: "100vh", color: "#F5F5F5", padding: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>${name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {user?.email && <span style={{ color: "#A3A3A3", fontSize: "0.875rem" }}>{user.email}</span>}
            <button
              onClick={() => void handleSignOut()}
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", background: "#1F1F1F", color: "#F5F5F5", cursor: "pointer", border: "1px solid #2A2A2A" }}
            >
              Sign out
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          {[{ label: "Total Users", value: "—" }, { label: "Revenue", value: "—" }, { label: "Active", value: "—" }].map(({ label, value }) => (
            <div key={label} style={{ background: "#111111", border: "1px solid #1F1F1F", borderRadius: "12px", padding: "1.5rem" }}>
              <p style={{ color: "#A3A3A3", fontSize: "0.75rem", marginBottom: "0.5rem" }}>{label}</p>
              <p style={{ fontSize: "2rem", fontWeight: 700, color: "${primaryColor}" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
`;
}

// ── Required project files ─────────────────────────────────────────────────────

type FileMap = Record<string, string>;

function buildCompleteProject(
  startupName: string,
  colors: string[],
  fonts: string[],
  existingFiles: FileMap
): FileMap {
  const has = (path: string) => path in existingFiles;
  const primaryColor = colors[1] ?? "#6366F1";
  const result: FileMap = { ...existingFiles };

  // Remove the error-fallback blob file — it's never useful in a ZIP
  delete result["generated-backend.txt"];

  // Config files
  if (!has("package.json")) result["package.json"] = makePackageJson(startupName);
  if (!has("next.config.ts")) result["next.config.ts"] = makeNextConfig();
  if (!has("tailwind.config.ts")) result["tailwind.config.ts"] = makeTailwindConfig(colors, fonts);
  if (!has("tsconfig.json")) result["tsconfig.json"] = makeTsConfig();
  if (!has("postcss.config.mjs")) result["postcss.config.mjs"] = makePostcss();
  if (!has(".env.example")) result[".env.example"] = makeEnvExample();
  if (!has("README.md")) result["README.md"] = makeReadme(startupName);

  // App files
  if (!has("src/app/globals.css")) result["src/app/globals.css"] = makeGlobalsCss(colors, fonts);
  if (!has("src/app/layout.tsx")) result["src/app/layout.tsx"] = makeLayout(startupName, fonts);
  if (!has("src/app/auth/page.tsx")) result["src/app/auth/page.tsx"] = makeAuthPage(startupName, primaryColor);
  if (!has("src/app/dashboard/page.tsx")) result["src/app/dashboard/page.tsx"] = makeDashboardPage(startupName, primaryColor);

  // Lib files
  if (!has("src/lib/supabase.ts")) result["src/lib/supabase.ts"] = makeSupabaseLib();
  if (!has("src/lib/stripe.ts")) result["src/lib/stripe.ts"] = makeStripeLib();

  // Types
  if (!has("src/types/supabase.ts")) result["src/types/supabase.ts"] = makeSupabaseTypes();

  // API routes
  if (!has("src/app/api/auth/callback/route.ts")) result["src/app/api/auth/callback/route.ts"] = makeAuthCallback();
  if (!has("src/app/api/waitlist/route.ts")) result["src/app/api/waitlist/route.ts"] = makeWaitlistRoute();
  if (!has("src/app/api/stripe/checkout/route.ts")) result["src/app/api/stripe/checkout/route.ts"] = makeStripeCheckoutRoute();
  if (!has("src/app/api/stripe/webhook/route.ts")) result["src/app/api/stripe/webhook/route.ts"] = makeStripeWebhookRoute();

  // Supabase schema
  if (!has("supabase/schema.sql")) result["supabase/schema.sql"] = makeSupabaseSchema();

  return result;
}

// ── Route handler ──────────────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch generated file map
  const { data: codeMapRow } = await supabase
    .from("code_maps")
    .select("file_map")
    .eq("startup_id", startupId)
    .single();

  if (!codeMapRow?.file_map) {
    return NextResponse.json({ error: "No generated code found" }, { status: 404 });
  }

  // Fetch brand info
  const { data: brainRaw } = await supabase
    .from("company_brain")
    .select("startup_name, colors, fonts")
    .eq("startup_id", startupId)
    .maybeSingle();

  const brain = brainRaw as Pick<CompanyBrain, "startup_name" | "colors" | "fonts"> | null;

  const startupName = brain?.startup_name ?? "My Startup";
  const colors: string[] = brain?.colors ?? ["#0A0A0A", "#6366F1", "#10B981", "#818CF8"];
  const fonts: string[] = (() => {
    const raw = brain?.fonts;
    if (!raw) return ["Space Grotesk", "Inter"];
    try { return JSON.parse(raw) as string[]; }
    catch { return [raw, "Inter"]; }
  })();

  const existingFiles = codeMapRow.file_map as FileMap;
  const projectFiles = buildCompleteProject(startupName, colors, fonts, existingFiles);

  // Build ZIP
  const zipFiles: Record<string, Uint8Array> = {};
  for (const [path, content] of Object.entries(projectFiles)) {
    if (typeof content === "string") {
      zipFiles[path] = strToU8(content);
    }
  }

  const zipped = zipSync(zipFiles);
  const slugName = startupName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  return new Response(zipped.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${slugName}-qrew.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
