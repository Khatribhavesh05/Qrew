import { createClient as createServiceClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface StripeTokenResponse {
  access_token?: string;
  stripe_publishable_key?: string;
  error?: string;
  error_description?: string;
}

// GET /api/auth/stripe/callback?code=xxx&state=startupId
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code      = searchParams.get("code");
  const startupId = searchParams.get("state") ?? "";

  if (!code) {
    console.error("[stripe-callback] missing code");
    return NextResponse.redirect(new URL("/app?error=stripe_oauth", request.url));
  }

  // ── Exchange authorization code for access token ────────────────────────────
  const tokenRes = await fetch("https://connect.stripe.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type:    "authorization_code",
      code,
      client_secret: process.env.STRIPE_SECRET_KEY ?? "",
    }),
  });

  const tokenData = (await tokenRes.json()) as StripeTokenResponse;
  if (!tokenData.access_token) {
    console.error("[stripe-callback] token exchange failed:", tokenData.error, tokenData.error_description);
    return NextResponse.redirect(new URL("/app?error=stripe_token", request.url));
  }

  const stripeSecretKey      = tokenData.access_token;
  const stripePublishableKey = tokenData.stripe_publishable_key ?? "";

  // ── Require authenticated user ──────────────────────────────────────────────
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  // ── Upsert stripe keys into startup_credentials (service role bypasses RLS) ─
  const supabaseService = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabaseService
    .from("startup_credentials")
    .upsert(
      {
        startup_id:            startupId,
        stripe_publishable_key: stripePublishableKey,
        stripe_secret_key:      stripeSecretKey,
        updated_at:             new Date().toISOString(),
      },
      { onConflict: "startup_id" }
    );

  return NextResponse.redirect(
    new URL(`/app/${startupId}/build?stripe=connected`, request.url)
  );
}
