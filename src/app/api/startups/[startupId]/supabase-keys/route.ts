import { createClient as createServiceClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface ApiKey {
  api_key: string;
  name: string;
  tags: string;
}

// POST /api/startups/:startupId/supabase-keys
// Body: { projectRef: string }
// Fetches anon + service_role keys via Management API, stores in startup_credentials
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify startup ownership
  const { data: startup } = await supabase
    .from("startups")
    .select("id")
    .eq("id", startupId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { projectRef } = (await req.json()) as { projectRef: string };
  if (!projectRef) return NextResponse.json({ error: "projectRef required" }, { status: 400 });

  // Get the stored Management API OAuth token
  const { data: profile } = await supabase
    .from("profiles")
    .select("supabase_oauth_token")
    .eq("id", user.id)
    .single();

  const token = (profile as { supabase_oauth_token?: string | null } | null)
    ?.supabase_oauth_token;
  if (!token) {
    return NextResponse.json({ error: "Supabase not connected. Reconnect via OAuth." }, { status: 400 });
  }

  // Fetch API keys from Supabase Management API
  const keysRes = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/api-keys`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!keysRes.ok) {
    const txt = await keysRes.text();
    console.error("[supabase-keys] Management API error:", keysRes.status, txt.slice(0, 300));
    return NextResponse.json(
      { error: `Failed to fetch API keys (${keysRes.status})` },
      { status: 502 }
    );
  }

  const keys = (await keysRes.json()) as ApiKey[];

  // Supabase returns keys with tags: "anon" and "service_role"
  const anonKey        = keys.find(k => k.tags === "anon"         || k.name === "anon")?.api_key         ?? "";
  const serviceRoleKey = keys.find(k => k.tags === "service_role" || k.name === "service_role")?.api_key ?? "";
  const projectUrl     = `https://${projectRef}.supabase.co`;

  // Write to startup_credentials via service role (INSERT needs elevated access)
  const supabaseService = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: upsertError } = await supabaseService
    .from("startup_credentials")
    .upsert(
      {
        startup_id:                startupId,
        supabase_project_url:      projectUrl,
        supabase_anon_key:         anonKey,
        supabase_service_role_key: serviceRoleKey,
        updated_at:                new Date().toISOString(),
      },
      { onConflict: "startup_id" }
    );

  if (upsertError) {
    console.error("[supabase-keys] upsert failed:", upsertError.message);
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ projectUrl, anonKey, serviceRoleKey, success: true });
}
