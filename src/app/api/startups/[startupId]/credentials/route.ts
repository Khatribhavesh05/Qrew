import { createClient as createServiceClient } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

interface CredentialsBody {
  supabase_project_url?:     string;
  supabase_anon_key?:        string;
  supabase_service_role_key?: string;
  stripe_publishable_key?:   string;
  stripe_secret_key?:        string;
  razorpay_key_id?:          string;
  razorpay_key_secret?:      string;
}

const ALLOWED_FIELDS = new Set<string>([
  "supabase_project_url",
  "supabase_anon_key",
  "supabase_service_role_key",
  "stripe_publishable_key",
  "stripe_secret_key",
  "razorpay_key_id",
  "razorpay_key_secret",
]);

// POST /api/startups/[startupId]/credentials
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as CredentialsBody;

  // Only pick allowed fields with non-empty string values
  const updates: Record<string, string> = {};
  for (const [k, v] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(k) && typeof v === "string" && v.trim().length > 0) {
      updates[k] = v.trim();
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const supabaseService = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabaseService
    .from("startup_credentials")
    .upsert(
      { startup_id: startupId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: "startup_id" }
    );

  if (error) {
    console.error("[credentials] upsert error:", error);
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
