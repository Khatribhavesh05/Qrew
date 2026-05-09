import { createClient as createServiceClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface GitHubTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  login?: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    console.error("[github-callback] missing code or state");
    return NextResponse.redirect(new URL("/app?error=github_oauth", request.url));
  }

  // Exchange code for GitHub access token
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = (await tokenRes.json()) as GitHubTokenResponse;
  console.log("[github-callback] token exchange result:", {
    hasToken: !!tokenData.access_token,
    error: tokenData.error,
  });

  if (!tokenData.access_token) {
    console.error("[github-callback] no access_token:", tokenData.error, tokenData.error_description);
    return NextResponse.redirect(new URL("/app?error=github_token", request.url));
  }

  // Fetch GitHub username
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  const githubUser = (await userRes.json()) as GitHubUserResponse;
  console.log("[github-callback] github username:", githubUser.login);

  // Resolve the Supabase user — prefer the live auth session over the state param
  // so we always write to the correct profile row.
  const supabaseAuth = await createClient();
  const { data: { user: sessionUser } } = await supabaseAuth.auth.getUser();
  const userId = sessionUser?.id ?? state;
  console.log("[github-callback] writing token for userId:", userId, "(from session:", !!sessionUser?.id, ")");

  // Use the service role key so the upsert bypasses RLS on the profiles table.
  // The anon key cannot write to profiles without explicit INSERT/UPDATE policies.
  const supabaseService = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: upsertError } = await supabaseService
    .from("profiles")
    .upsert(
      {
        id: userId,
        email: sessionUser?.email ?? null,
        github_access_token: tokenData.access_token,
        github_username: githubUser.login ?? null,
      },
      { onConflict: "id" }
    );

  if (upsertError) {
    console.error("[github-callback] profiles upsert failed:", upsertError.message, upsertError.details);
  } else {
    console.log("[github-callback] profiles upsert succeeded for userId:", userId);
  }

  return NextResponse.redirect(new URL("/app?github=connected", request.url));
}
