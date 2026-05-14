import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const maxDuration = 120;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name, user_id")
    .eq("id", startupId)
    .eq("user_id", user.id)
    .single();

  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Read full generated files from code_maps
  const { data: codeMap } = await supabase
    .from("code_maps")
    .select("file_map")
    .eq("startup_id", startupId)
    .single();

  if (!codeMap?.file_map) {
    return NextResponse.json({ error: "No generated code found. Run build first." }, { status: 400 });
  }

  const fileMap = codeMap.file_map as Record<string, string>;
  const files = Object.entries(fileMap).map(([path, content]) => ({ path, content }));

  const { data: brain } = await supabase
    .from("company_brain")
    .select("startup_name")
    .eq("startup_id", startupId)
    .single();

  const repoName = (brain?.startup_name ?? startup.name ?? "startup")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);

  const cookie = req.headers.get("cookie") ?? "";
  const base = process.env.NEXT_PUBLIC_SITE_URL!;

  // ── GitHub push ─────────────────────────────────────────────────────────────
  const githubRes = await fetch(`${base}/api/github/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ startupId, repoName, files }),
  });

  if (!githubRes.ok) {
    const err = await githubRes.text();
    console.error("[deploy] GitHub push failed:", err);
    return NextResponse.json({ error: `GitHub push failed: ${err.slice(0, 300)}` }, { status: 500 });
  }

  const { repoUrl: githubUrl } = (await githubRes.json()) as { repoUrl: string };

  // ── Generate Vercel deploy redirect URL ──────────────────────────────────────
  let vercelDeployUrl = "";
  const vercelRes = await fetch(`${base}/api/deploy/vercel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ githubUrl, projectName: repoName }),
  });

  if (vercelRes.ok) {
    const data = (await vercelRes.json()) as { vercelDeployUrl?: string };
    vercelDeployUrl = data.vercelDeployUrl ?? "";
  } else {
    console.error("[deploy] Failed to generate Vercel URL (non-fatal):", await vercelRes.text());
  }

  // ── Update DB — mark deployed after GitHub push; live_url set later by user ─
  await Promise.all([
    supabase.from("startups").update({
      status: "deployed",
      github_url: githubUrl || null,
    }).eq("id", startupId),
    supabase.from("company_brain").update({
      github_url: githubUrl || null,
      updated_at: new Date().toISOString(),
    }).eq("startup_id", startupId),
  ]);

  return NextResponse.json({ githubUrl, vercelDeployUrl, success: true });
}
