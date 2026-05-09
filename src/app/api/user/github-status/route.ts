import { createClient as createServiceClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface ProfileRow {
  github_access_token: string | null;
}

export async function GET(_request: NextRequest) {
  try {
    // Authenticate via the cookie-based server client
    const supabaseAuth = await createClient();
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    console.log("[github-status] user.id:", user?.id ?? "NO SESSION");

    if (!user) {
      return NextResponse.json({ hasToken: false }, { status: 401 });
    }

    // Use the service role key to bypass RLS and read the profile row
    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseService
      .from("profiles")
      .select("github_access_token")
      .eq("id", user.id)
      .maybeSingle();

    console.log("[github-status] profiles query → data:", JSON.stringify(data), "error:", error?.message);

    if (error) {
      console.error("[github-status] profiles query error:", error.message, error.details);
      return NextResponse.json({ hasToken: false });
    }

    const profile = data as ProfileRow | null;
    const hasToken = !!profile?.github_access_token;
    console.log("[github-status] hasToken:", hasToken);
    return NextResponse.json({ hasToken });
  } catch (err) {
    console.error("[github-status] unexpected error:", err);
    return NextResponse.json({ hasToken: false });
  }
}
