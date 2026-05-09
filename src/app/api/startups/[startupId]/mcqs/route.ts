import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase-server";
import { type NextRequest, NextResponse } from "next/server";
import type { Startup } from "@/types";

const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export interface MCQ {
  id: string;
  agent: "alex" | "sam" | "jordan";
  question: string;
  choices: string[];
  field: string; // which company_brain field this answer maps to
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: startupRow } = await supabase
    .from("startups")
    .select("*")
    .eq("id", startupId)
    .eq("user_id", user.id)
    .single();

  if (!startupRow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const startup = startupRow as Startup;

  const model = genai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `You decide if a startup founder needs clarifying questions before AI research begins.

Startup: "${startup.idea}"
Industry: ${startup.industry ?? "?"}  Audience: ${startup.audience ?? "?"}  Revenue: ${startup.revenue_model ?? "?"}

STRICT RULES:
1. If the idea clearly implies audience, revenue model and market — return exactly: []
2. Only ask if something is GENUINELY ambiguous and would meaningfully change the research direction
3. MAXIMUM 2 questions. Usually 0 or 1 is correct.
4. Never ask about something already answered above

CLEAR → return []:
"fitness app for busy moms" — audience clear, B2C clear, subscription implied
"SaaS invoicing for freelancers" — B2B, SaaS, clear market
"recipe app for vegans" — B2C, clear
"Uber for dog walking" — B2C, marketplace, clear

AMBIGUOUS → ask 1-2 questions:
"marketplace" — what kind? for whom?
"AI tool" — B2B or B2C?
"platform for students" — what does it do?

Return ONLY valid JSON array, no markdown, no explanation:
[
  {
    "id": "q1",
    "agent": "alex",
    "question": "Short specific question?",
    "choices": ["Option A", "Option B", "Option C", "Option D"],
    "field": "customer_type"
  }
]

field: one of "audience" | "customer_type" | "revenue_model" | "brand_vibe"
agent: one of "alex" | "sam" | "jordan"

Most responses should be: []`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (!match) return NextResponse.json({ mcqs: [] });
    const mcqs = JSON.parse(match[0]) as MCQ[];
    return NextResponse.json({ mcqs });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg, mcqs: [] }, { status: 500 });
  }
}

// Save MCQ answer to company_brain
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { field, value } = (await request.json()) as { field: string; value: string };
  if (!field || !value) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Update the startup row with the refined value
  const allowedFields = ["audience", "customer_type", "revenue_model", "brand_vibe"];
  if (!allowedFields.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  await supabase
    .from("startups")
    .update({ [field]: value })
    .eq("id", startupId)
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true });
}
