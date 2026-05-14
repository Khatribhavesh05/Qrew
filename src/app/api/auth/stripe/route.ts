// To activate: Go to dashboard.stripe.com/settings/connect
// Create a Connect OAuth app
// Get client_id (starts with ca_)
// Add to .env.local as STRIPE_OAUTH_CLIENT_ID
// Add redirect URI: http://localhost:3000/api/auth/stripe/callback

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/auth/stripe?startupId=xxx
// Initiates Stripe Connect OAuth flow
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { searchParams } = new URL(request.url);
  const startupId = searchParams.get("startupId") ?? "";

  const params = new URLSearchParams({
    response_type: "code",
    client_id:     process.env.STRIPE_OAUTH_CLIENT_ID ?? "",
    scope:         "read_write",
    state:         startupId,
    redirect_uri:  process.env.STRIPE_OAUTH_REDIRECT_URI ?? "",
  });

  return NextResponse.redirect(
    `https://connect.stripe.com/oauth/authorize?${params.toString()}`
  );
}
