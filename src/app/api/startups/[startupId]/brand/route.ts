import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const maxDuration = 60;

const VIBE_PALETTES: Record<string, { colors: string[]; fonts: string[] }> = {
  bold:       { colors: ["#0A0A0A", "#FFFFFF", "#FF3333", "#FF6B6B"], fonts: ["Space Grotesk", "Inter"] },
  calm:       { colors: ["#F8F4EF", "#2D2D2D", "#B4A99A", "#6B7280"], fonts: ["DM Sans", "Lora"] },
  playful:    { colors: ["#FFD93D", "#6BCB77", "#4D96FF", "#FF6B6B"], fonts: ["Nunito", "Poppins"] },
  luxury:     { colors: ["#0A0A0A", "#D4AF37", "#C0A060", "#FAF8F0"], fonts: ["Playfair Display", "Cormorant Garamond"] },
  tech:       { colors: ["#000814", "#00B4D8", "#90E0EF", "#0077B6"], fonts: ["Space Mono", "Rajdhani"] },
  futuristic: { colors: ["#050510", "#6366F1", "#818CF8", "#C7D2FE"], fonts: ["Space Grotesk", "Inter"] },
  warm:       { colors: ["#FFF8F0", "#FF6B35", "#F7C59F", "#2D3047"], fonts: ["Nunito", "Quicksand"] },
  minimal:    { colors: ["#FAFAFA", "#111111", "#E5E5E5", "#666666"], fonts: ["Plus Jakarta Sans", "Inter"] },
  dark:       { colors: ["#0D0D0D", "#6366F1", "#818CF8", "#C7D2FE"], fonts: ["Space Grotesk", "Inter"] },
  modern:     { colors: ["#09090B", "#FAFAFA", "#71717A", "#3F3F46"], fonts: ["Plus Jakarta Sans", "Inter"] },
  clean:      { colors: ["#FFFFFF", "#111111", "#6366F1", "#E0E7FF"], fonts: ["Inter", "Plus Jakarta Sans"] },
};

function getPalette(vibe: string): { colors: string[]; fonts: string[] } {
  const v = vibe.toLowerCase();
  for (const [key, palette] of Object.entries(VIBE_PALETTES)) {
    if (v.includes(key)) return palette;
  }
  return VIBE_PALETTES.dark;
}

async function generateFluxImage(prompt: string): Promise<string> {
  const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
    method: "POST",
    headers: {
      Authorization: `Key ${process.env.FAL_API_KEY!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      image_size: "landscape_16_9",
      num_inference_steps: 4,
      num_images: 1,
      sync_mode: true,
      enable_safety_checker: false,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Fal.ai ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as { images: Array<{ url: string }> };
  const url = data.images?.[0]?.url;
  if (!url) throw new Error("Fal.ai returned no image URL");
  return url;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ data: brain }, { data: startup }] = await Promise.all([
    supabase.from("company_brain").select("startup_name, brand_vibe, positioning").eq("startup_id", startupId).single(),
    supabase.from("startups").select("industry, name").eq("id", startupId).eq("user_id", user.id).single(),
  ]);

  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const vibe = brain?.brand_vibe ?? startup?.industry ?? "dark";
  const name = brain?.startup_name ?? startup?.name ?? "Startup";
  const industry = startup?.industry ?? "technology";
  const palette = getPalette(vibe);

  const bgPrompt = `Cinematic abstract background for "${name}", a ${industry} startup. ${vibe} aesthetic. Ultra high quality, 8k. No text, no logos, no UI elements, no people. Dark dramatic atmosphere, depth of field, professional photography.`;
  const texturePrompt = `Seamless subtle micro noise texture, ${vibe} aesthetic, fine grain, abstract minimal background overlay. Pure grayscale monochromatic. No text, no shapes, no objects. Just texture.`;

  try {
    const [bgUrl, textureUrl] = await Promise.all([
      generateFluxImage(bgPrompt),
      generateFluxImage(texturePrompt),
    ]);

    const safeBgUrl = bgUrl.startsWith('data:') ? '' : bgUrl;
    const safeTextureUrl = textureUrl.startsWith('data:') ? '' : textureUrl;

    await supabase.from("company_brain").update({
      flux_bg_url: safeBgUrl,
      flux_texture_url: safeTextureUrl,
      colors: palette.colors,
      fonts: JSON.stringify(palette.fonts),
      updated_at: new Date().toISOString(),
    }).eq("startup_id", startupId);

    return NextResponse.json({ bgUrl: safeBgUrl, textureUrl: safeTextureUrl, colors: palette.colors, fonts: palette.fonts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Brand generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
