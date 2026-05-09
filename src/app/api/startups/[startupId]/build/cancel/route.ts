import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Find the running build for this startup
  const { data: build } = await supabase
    .from("builds")
    .select("id")
    .eq("startup_id", startupId)
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (!build) return NextResponse.json({ error: "No running build found" }, { status: 404 });

  await supabase
    .from("builds")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", (build as { id: string }).id);

  await supabase
    .from("startups")
    .update({ status: "report_ready" })
    .eq("id", startupId)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
