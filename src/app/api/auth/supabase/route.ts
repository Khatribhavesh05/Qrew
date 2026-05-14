import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/auth/supabase?startupId=xxx
// Initiates Supabase Management API OAuth flow
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { searchParams } = new URL(request.url);
  const startupId = searchParams.get("startupId") ?? "";

  const params = new URLSearchParams({
    client_id:     process.env.SUPABASE_OAUTH_CLIENT_ID ?? "",
    redirect_uri:  process.env.SUPABASE_OAUTH_REDIRECT_URI ?? "",
    response_type: "code",
    scope:         "all",
    state:         startupId, // passed back verbatim so callback knows which startup
  });

  return NextResponse.redirect(
    `https://api.supabase.com/v1/oauth/authorize?${params.toString()}`
  );
}
