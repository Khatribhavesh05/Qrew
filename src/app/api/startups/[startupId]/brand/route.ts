import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const maxDuration = 60;

// ── Industry-specific brand palettes ──────────────────────────────────────────
const INDUSTRY_PALETTES: Record<string, { colors: string[]; fonts: string[] }> = {
  fintech:     { colors: ["#0A1628", "#D4AF37", "#1E3A5F", "#F5F5F5", "#FFFFFF"], fonts: ["Inter", "JetBrains Mono"] },
  finance:     { colors: ["#0A1628", "#D4AF37", "#1E3A5F", "#F5F5F5", "#FFFFFF"], fonts: ["Inter", "JetBrains Mono"] },
  health:      { colors: ["#F0F9F4", "#10B981", "#FFFFFF", "#065F46", "#1F2937"], fonts: ["Plus Jakarta Sans", "Inter"] },
  healthcare:  { colors: ["#F0F9F4", "#10B981", "#FFFFFF", "#065F46", "#1F2937"], fonts: ["Plus Jakarta Sans", "Inter"] },
  fashion:     { colors: ["#0A0A0A", "#FFB6C1", "#FFFFFF", "#FF69B4", "#1F1F1F"], fonts: ["Playfair Display", "Lato"] },
  ecommerce:   { colors: ["#0A0A0A", "#FFB6C1", "#FFFFFF", "#FF69B4", "#1F1F1F"], fonts: ["Playfair Display", "Lato"] },
  saas:        { colors: ["#0A0A0A", "#0EA5E9", "#FFFFFF", "#38BDF8", "#1E293B"], fonts: ["Space Grotesk", "DM Sans"] },
  software:    { colors: ["#0A0A0A", "#0EA5E9", "#FFFFFF", "#38BDF8", "#1E293B"], fonts: ["Space Grotesk", "DM Sans"] },
  technology:  { colors: ["#0A0A0A", "#0EA5E9", "#FFFFFF", "#38BDF8", "#1E293B"], fonts: ["Space Grotesk", "DM Sans"] },
  food:        { colors: ["#FFF8F0", "#FF6B35", "#FFFFFF", "#F97316", "#78350F"], fonts: ["Nunito", "Open Sans"] },
  restaurant:  { colors: ["#FFF8F0", "#FF6B35", "#FFFFFF", "#F97316", "#78350F"], fonts: ["Nunito", "Open Sans"] },
  education:   { colors: ["#F0F4FF", "#4F46E5", "#FFFFFF", "#6366F1", "#1E1B4B"], fonts: ["Inter", "Lora"] },
  learning:    { colors: ["#F0F4FF", "#4F46E5", "#FFFFFF", "#6366F1", "#1E1B4B"], fonts: ["Inter", "Lora"] },
  luxury:      { colors: ["#0A0A0A", "#D4AF37", "#FFFFFF", "#B8860B", "#1F1F1F"], fonts: ["Cormorant Garamond", "Montserrat"] },
  travel:      { colors: ["#0A1F3D", "#00B4D8", "#FFFFFF", "#0077B6", "#F0F9FF"], fonts: ["Poppins", "Inter"] },
  real_estate: { colors: ["#1C1C1C", "#10B981", "#FFFFFF", "#059669", "#F5F5F5"], fonts: ["Plus Jakarta Sans", "Inter"] },
  gaming:      { colors: ["#0A0A0A", "#A855F7", "#FFFFFF", "#C084FC", "#1F1F1F"], fonts: ["Space Grotesk", "Inter"] },
  crypto:      { colors: ["#0A0A0A", "#F59E0B", "#FFFFFF", "#FBBF24", "#1F1F1F"], fonts: ["Space Mono", "Inter"] },
  ai:          { colors: ["#050510", "#6366F1", "#FFFFFF", "#818CF8", "#C7D2FE"], fonts: ["Space Grotesk", "Inter"] },
};

// ── Brand vibe modifiers ──────────────────────────────────────────────────────
const VIBE_MODIFIERS: Record<string, { colors: string[]; fonts: string[] }> = {
  bold:        { colors: ["#0A0A0A", "#FF3333", "#FFFFFF", "#FF6B6B", "#1F1F1F"], fonts: ["Space Grotesk", "DM Sans"] },
  playful:     { colors: ["#FFD93D", "#6BCB77", "#FFFFFF", "#4D96FF", "#FF6B6B"], fonts: ["Nunito", "Poppins"] },
  minimal:     { colors: ["#FAFAFA", "#111111", "#FFFFFF", "#E5E5E5", "#666666"], fonts: ["Plus Jakarta Sans", "Inter"] },
  dark:        { colors: ["#0A0A0A", "#6366F1", "#FFFFFF", "#818CF8", "#C7D2FE"], fonts: ["Space Grotesk", "Inter"] },
  professional: { colors: ["#0A0A0A", "#3B82F6", "#FFFFFF", "#60A5FA", "#1E293B"], fonts: ["Inter", "JetBrains Mono"] },
  creative:    { colors: ["#0A0A0A", "#EC4899", "#FFFFFF", "#F472B6", "#1F1F1F"], fonts: ["Playfair Display", "Lato"] },
  friendly:    { colors: ["#FFF8F0", "#10B981", "#FFFFFF", "#34D399", "#065F46"], fonts: ["Nunito", "Open Sans"] },
};

function generateBrandPalette(industry: string, vibe: string): { colors: string[]; fonts: string[] } {
  const industryKey = industry.toLowerCase().replace(/\s+/g, "_");
  const vibeKey = vibe.toLowerCase().replace(/\s+/g, "_");
  
  // Priority 1: Exact industry match
  if (INDUSTRY_PALETTES[industryKey]) {
    console.log(`[Jordan] Using industry palette: ${industryKey}`);
    return INDUSTRY_PALETTES[industryKey];
  }
  
  // Priority 2: Partial industry match
  for (const [key, palette] of Object.entries(INDUSTRY_PALETTES)) {
    if (industryKey.includes(key) || key.includes(industryKey)) {
      console.log(`[Jordan] Using partial industry match: ${key}`);
      return palette;
    }
  }
  
  // Priority 3: Vibe modifier
  if (VIBE_MODIFIERS[vibeKey]) {
    console.log(`[Jordan] Using vibe modifier: ${vibeKey}`);
    return VIBE_MODIFIERS[vibeKey];
  }
  
  // Priority 4: Partial vibe match
  for (const [key, palette] of Object.entries(VIBE_MODIFIERS)) {
    if (vibeKey.includes(key) || key.includes(vibeKey)) {
      console.log(`[Jordan] Using partial vibe match: ${key}`);
      return palette;
    }
  }
  
  // Fallback: Professional SaaS palette
  console.log(`[Jordan] Using fallback palette for industry: ${industry}, vibe: ${vibe}`);
  return { colors: ["#0A0A0A", "#3B82F6", "#FFFFFF", "#60A5FA", "#1E293B"], fonts: ["Inter", "DM Sans"] };
}

// Fal.ai Flux Schnell returns base64 data URIs, not hosted URLs.
// We upload to Supabase Storage (bucket: "brand-assets") and return the public URL.
// NOTE: Create the "brand-assets" bucket manually in your Supabase dashboard
//       (Storage → New bucket → name: "brand-assets" → Public: true).
async function generateFluxImage(
  prompt: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string
): Promise<string> {
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
  const raw = data.images?.[0]?.url;
  if (!raw) throw new Error("Fal.ai returned no image");

  // Strip the data URI prefix to get the raw base64 string
  const base64 = raw.startsWith("data:")
    ? raw.split(",")[1] ?? raw
    : null;

  if (!base64) {
    // Already a real URL (unlikely with Schnell, but handle it)
    return raw;
  }

  // Decode base64 → binary buffer
  const buffer = Buffer.from(base64, "base64");

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from("brand-assets")
    .upload(storagePath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Storage upload failed (${storagePath}): ${uploadError.message}`);
  }

  // Return the permanent public URL
  const { data: { publicUrl } } = supabase.storage
    .from("brand-assets")
    .getPublicUrl(storagePath);

  return publicUrl;
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

  const vibe = brain?.brand_vibe ?? "professional";
  const name = brain?.startup_name ?? startup?.name ?? "Startup";
  const industry = startup?.industry ?? "technology";
  
  // Generate unique brand palette based on industry + vibe
  const palette = generateBrandPalette(industry, vibe);
  
  console.log(`[Jordan] Generated brand for ${name}:`);
  console.log(`[Jordan] Industry: ${industry}, Vibe: ${vibe}`);
  console.log(`[Jordan] Colors: ${palette.colors.join(", ")}`);
  console.log(`[Jordan] Fonts: ${palette.fonts.join(", ")}`);

  const bgPrompt = `Cinematic abstract background for "${name}", a ${industry} startup. ${vibe} aesthetic. Ultra high quality, 8k. No text, no logos, no UI elements, no people. Dark dramatic atmosphere, depth of field, professional photography.`;
  const texturePrompt = `Seamless subtle micro noise texture, ${vibe} aesthetic, fine grain, abstract minimal background overlay. Pure grayscale monochromatic. No text, no shapes, no objects. Just texture.`;

  try {
    const [bgUrl, textureUrl] = await Promise.all([
      generateFluxImage(bgPrompt, supabase, `${startupId}/bg.jpg`),
      generateFluxImage(texturePrompt, supabase, `${startupId}/texture.jpg`),
    ]);

    console.log(`[Jordan] Flux images generated:`);
    console.log(`[Jordan] Background: ${bgUrl}`);
    console.log(`[Jordan] Texture: ${textureUrl}`);

    await supabase.from("company_brain").update({
      flux_bg_url: bgUrl,
      flux_texture_url: textureUrl,
      colors: palette.colors,
      fonts: JSON.stringify(palette.fonts),
      updated_at: new Date().toISOString(),
    }).eq("startup_id", startupId);

    console.log(`[Jordan] ✓ Brand assets saved to company_brain`);

    return NextResponse.json({ bgUrl, textureUrl, colors: palette.colors, fonts: palette.fonts });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Brand generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
