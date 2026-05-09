import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";
import type { ExtractedIdea } from "@/types";

const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

interface RequestBody {
  idea?: string;
  startupId?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as RequestBody;
  const { startupId } = body;
  let { idea } = body;

  // If only startupId given, fetch idea from DB
  if (!idea?.trim() && startupId) {
    const { data: startup } = await supabase
      .from("startups")
      .select("idea")
      .eq("id", startupId)
      .eq("user_id", user.id)
      .single();
    idea = (startup as { idea: string } | null)?.idea;
  }

  if (!idea?.trim()) {
    return NextResponse.json({ error: "Idea is required" }, { status: 400 });
  }

  const model = genai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You are extracting structured startup information from a founder's idea description.

Founder's idea: "${idea}"

Extract and return ONLY a valid JSON object with these exact fields:
{
  "name": "A short, catchy startup name (2-3 words max, no Inc/LLC/etc)",
  "description": "One clear sentence describing what the startup does",
  "industry": "The primary industry (e.g. Health & Wellness, EdTech, FinTech, SaaS, E-commerce, etc.)",
  "audience": "Primary target audience description (be specific: demographics, location if obvious)",
  "customer_type": "B2B or B2C",
  "revenue_model": "Primary revenue model (e.g. Subscription, Marketplace, SaaS, Freemium, One-time purchase)",
  "brand_vibe": "Brand personality in 3 words (e.g. Clean & minimal, Bold & playful, Professional & trustworthy)"
}

Rules:
- name: Creative, memorable, domain-friendly. Not generic.
- If any field cannot be determined from the idea, make a reasonable inference based on the industry/context.
- Return ONLY the JSON object. No markdown. No explanation.`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    let extracted: ExtractedIdea;
    try {
      const cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      extracted = JSON.parse(match[0]) as ExtractedIdea;
    } catch {
      return NextResponse.json({ error: "Failed to parse Gemini response" }, { status: 500 });
    }

    // If startupId provided, update the existing startup row
    if (startupId) {
      const { error } = await supabase
        .from("startups")
        .update({
          name: extracted.name,
          industry: extracted.industry,
          audience: extracted.audience,
          customer_type: extracted.customer_type,
          revenue_model: extracted.revenue_model,
          brand_vibe: extracted.brand_vibe,
          status: "naming",
        })
        .eq("id", startupId)
        .eq("user_id", user.id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      // Create a new startup row with the idea + extracted fields
      const { data: startup, error } = await supabase
        .from("startups")
        .insert({
          user_id: user.id,
          idea: idea.trim(),
          name: extracted.name,
          industry: extracted.industry,
          audience: extracted.audience,
          customer_type: extracted.customer_type,
          revenue_model: extracted.revenue_model,
          brand_vibe: extracted.brand_vibe,
          status: "naming",
        })
        .select("id")
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ extracted, startupId: (startup as { id: string }).id });
    }

    return NextResponse.json({ extracted, startupId });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
