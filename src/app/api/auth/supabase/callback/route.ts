import { createClient as createServiceClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface SupabaseTokenResponse {
  access_token?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
}

interface SupabaseProject {
  id: string;
  name: string;
  region: string;
  organization_id: string;
}

// GET /api/auth/supabase/callback?code=xxx&state=startupId
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code      = searchParams.get("code");
  const startupId = searchParams.get("state") ?? "";

  if (!code) {
    console.error("[supabase-callback] missing code");
    return NextResponse.redirect(new URL("/app?error=supabase_oauth", request.url));
  }

  // ── Exchange authorization code for access token ────────────────────────────
  const tokenRes = await fetch("https://api.supabase.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      client_id:     process.env.SUPABASE_OAUTH_CLIENT_ID ?? "",
      client_secret: process.env.SUPABASE_OAUTH_CLIENT_SECRET ?? "",
      redirect_uri:  process.env.SUPABASE_OAUTH_REDIRECT_URI ?? "",
    }),
  });

  const tokenData = (await tokenRes.json()) as SupabaseTokenResponse;
  if (!tokenData.access_token) {
    console.error("[supabase-callback] token exchange failed:", tokenData.error, tokenData.error_description);
    return NextResponse.redirect(new URL("/app?error=supabase_token", request.url));
  }

  const accessToken = tokenData.access_token;

  // ── Fetch user's Supabase projects ──────────────────────────────────────────
  const projectsRes = await fetch("https://api.supabase.com/v1/projects", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const allProjects = projectsRes.ok
    ? ((await projectsRes.json()) as SupabaseProject[])
    : [];

  // ── Store access token in profiles via service role (bypasses RLS) ──────────
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const supabaseService = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabaseService
    .from("profiles")
    .update({ supabase_oauth_token: accessToken })
    .eq("id", user.id);

  // ── Redirect to project picker ──────────────────────────────────────────────
  const projectsParam = encodeURIComponent(
    JSON.stringify(
      allProjects.map(p => ({ id: p.id, name: p.name, region: p.region }))
    )
  );

  const dest = startupId
    ? `/app/${startupId}/connect-supabase?projects=${projectsParam}`
    : `/app?supabase=connected`;

  return NextResponse.redirect(new URL(dest, request.url));
}
