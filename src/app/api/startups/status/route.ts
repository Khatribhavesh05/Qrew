import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";

interface RequestBody {
  startupId: string;
  status: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { startupId, status } = (await request.json()) as RequestBody;
  if (!startupId || !status) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { error } = await supabase
    .from("startups")
    .update({ status })
    .eq("id", startupId)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
