import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { generateFullCodebase, type CodeGenBrain } from "@/lib/code-generator";
import type { CompanyBrain } from "@/types";

export const maxDuration = 300;

function sse(type: string, data: Record<string, unknown>): string {
  return `data: ${JSON.stringify({ type, ...data })}\n\n`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const buildType = request.nextUrl.searchParams.get("type") ?? "standard";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name, status, user_id")
    .eq("id", startupId)
    .eq("user_id", user.id)
    .single();

  if (!startup) return new Response("Not found", { status: 404 });

  // Check credits before starting build
  const { data: profileData } = await supabase
    .from("profiles")
    .select("credits_balance")
    .eq("id", user.id)
    .single();

  const creditsBalance = (profileData as { credits_balance?: number } | null)?.credits_balance ?? 0;
  if (Number(creditsBalance) < 1.5) {
    return new Response("Insufficient credits", { status: 402 });
  }

  // Create build record
  const { data: buildRecord } = await supabase
    .from("builds")
    .insert({
      startup_id: startupId,
      status: "running",
      build_type: buildType,
      current_step: "jordan",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  const buildId = (buildRecord as { id: string } | null)?.id ?? null;

  async function updateStep(step: string) {
    if (!buildId) return;
    await supabase.from("builds").update({ current_step: step }).eq("id", buildId);
  }

  async function isCancelled(): Promise<boolean> {
    if (!buildId) return false;
    const { data } = await supabase
      .from("builds")
      .select("status")
      .eq("id", buildId)
      .single();
    return (data as { status?: string } | null)?.status === "cancelled";
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (data: string) => controller.enqueue(encoder.encode(data));

      try {
        // Mark as building immediately so dashboard + routing reflects it
        await supabase.from("startups").update({ status: "building" }).eq("id", startupId);

        // ── STEP 1: Jordan — Brand identity ──────────────────────────────────
        if (await isCancelled()) { emit(sse("cancelled", {})); return; }

        emit(sse("step_start", { step: "jordan", label: "Creating brand identity...", agent: "Jordan" }));
        await updateStep("jordan");

        const brandRes = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/startups/${startupId}/brand`,
          { method: "POST", headers: { Cookie: request.headers.get("cookie") ?? "" } }
        );

        let brandData: { bgUrl?: string; textureUrl?: string; colors?: string[]; fonts?: string[]; error?: string } = {};

        if (brandRes.ok) {
          brandData = (await brandRes.json()) as typeof brandData;
        } else {
          const errText = await brandRes.text();
          console.error("[build] brand step failed:", errText);
        }

        emit(sse("step_done", {
          step: "jordan",
          data: {
            bgUrl: brandData.bgUrl ?? null,
            textureUrl: brandData.textureUrl ?? null,
            colors: brandData.colors ?? ["#0A0A0A", "#6366F1"],
            fonts: brandData.fonts ?? ["Space Grotesk", "Inter"],
          },
        }));

        // ── STEP 2+3+4: Morgan — Code generation ─────────────────────────────
        if (await isCancelled()) { emit(sse("cancelled", {})); return; }

        emit(sse("step_start", { step: "morgan_frontend", label: "Building frontend...", agent: "Morgan" }));
        await updateStep("morgan_frontend");

        // Get fresh company_brain with Jordan's brand data
        const { data: brainRaw } = await supabase
          .from("company_brain")
          .select("*")
          .eq("startup_id", startupId)
          .single();

        const brain = brainRaw as CompanyBrain | null;

        const parsedFonts = (() => {
          if (!brain?.fonts) return ["Space Grotesk", "Inter"];
          try { return JSON.parse(brain.fonts) as string[]; } catch { return [brain.fonts]; }
        })();

        const codeGenBrain: CodeGenBrain = {
          startup_name: brain?.startup_name ?? (startup as { name?: string }).name ?? "Startup",
          idea: brain?.idea ?? "",
          audience: brain?.audience ?? "",
          positioning: brain?.positioning ?? "",
          colors: brain?.colors ?? ["#0A0A0A", "#6366F1", "#818CF8", "#C7D2FE"],
          fonts: parsedFonts,
          flux_bg_url: brain?.flux_bg_url ?? "",
          flux_texture_url: brain?.flux_texture_url ?? "",
          tech_stack: brain?.tech_stack ?? "Next.js 14 + Supabase + Stripe",
          revenue_model: brain?.revenue_model ?? "Subscription",
          brand_vibe: brain?.brand_vibe ?? "dark",
        };

        let generatedFiles: Array<{ path: string; content: string }> = [];
        let morganStep = "morgan_frontend";

        const generatedCode = await generateFullCodebase(codeGenBrain, (chunk) => {
          if (chunk.includes("MORGAN: Building backend") && morganStep === "morgan_frontend") {
            morganStep = "morgan_backend";
            emit(sse("step_done", { step: "morgan_frontend" }));
            emit(sse("step_start", { step: "morgan_backend", label: "Building backend...", agent: "Morgan" }));
            void updateStep("morgan_backend");
          }
          if (chunk.includes("MORGAN: Self-correction") && morganStep === "morgan_backend") {
            morganStep = "morgan_review";
            emit(sse("step_done", { step: "morgan_backend" }));
            emit(sse("step_start", { step: "morgan_review", label: "Code review pass...", agent: "Morgan" }));
            void updateStep("morgan_review");
          }
          emit(sse("code_chunk", { step: morganStep, chunk }));
        });

        generatedFiles = generatedCode;

        emit(sse("step_done", { step: morganStep }));

        // Store FULL file contents in code_maps so deploy route can read them
        const fullFileMap = Object.fromEntries(generatedFiles.map(f => [f.path, f.content]));
        await supabase.from("code_maps").upsert({
          startup_id: startupId,
          file_map: fullFileMap,
          architecture: `Next.js 14 App Router — ${generatedFiles.length} files`,
          patterns: "TypeScript strict, Supabase, Stripe, Framer Motion",
          updated_at: new Date().toISOString(),
        }, { onConflict: "startup_id" });

        // Deduct credits on successful build
        const { data: freshProfile } = await supabase
          .from("profiles")
          .select("credits_balance")
          .eq("id", user.id)
          .single();
        const balance = (freshProfile as { credits_balance?: number } | null)?.credits_balance ?? 0;
        await supabase
          .from("profiles")
          .update({ credits_balance: Math.max(0, Number(balance) - 1.5) })
          .eq("id", user.id);
        await supabase.from("token_transactions").insert({
          user_id: user.id,
          type: "usage",
          credits: -1.5,
          startup_id: startupId,
          description: "Standard build",
        });

        // Code is ready — update to 'built' (waiting for manual deploy)
        await supabase.from("startups").update({ status: "built" }).eq("id", startupId);

        if (buildId) {
          await supabase.from("builds").update({
            status: "done",
            current_step: "code_ready",
            completed_at: new Date().toISOString(),
          }).eq("id", buildId);
        }

        emit(sse("code_ready", {
          startupName: codeGenBrain.startup_name,
          fileCount: generatedFiles.length,
          filePaths: generatedFiles.map(f => f.path),
        }));

      } catch (err) {
        const msg = err instanceof Error ? err.message : "Build failed";
        console.error("[build] fatal error:", msg);
        emit(sse("error", { message: msg }));

        await supabase.from("startups").update({ status: "error" }).eq("id", startupId);
        if (buildId) {
          await supabase.from("builds").update({ status: "error", error_log: msg }).eq("id", buildId);
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
