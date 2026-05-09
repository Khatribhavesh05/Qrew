import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { tavily } from "@tavily/core";
import { createClient } from "@/lib/supabase-server";
import { type NextRequest } from "next/server";
import type { Startup } from "@/types";

export const maxDuration = 300;

const anthropic = new Anthropic();
const genai = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// ── Tavily search helper ──────────────────────────────────────────────────────
async function tavilySearch(query: string): Promise<string> {
  if (!process.env.TAVILY_API_KEY) return "";
  try {
    const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
    const [primary, stats] = await Promise.all([
      tvly.search(query, { maxResults: 7, searchDepth: "advanced", includeRawContent: "markdown" as const }),
      tvly.search(`${query.slice(0, 100)} market size statistics TAM SAM 2024 2025`, {
        maxResults: 5,
        searchDepth: "advanced",
        includeRawContent: "markdown" as const,
      }),
    ]);
    const seen = new Set<string>();
    const results = [...primary.results, ...stats.results]
      .filter((r) => { if (seen.has(r.url)) return false; seen.add(r.url); return true; })
      .slice(0, 10);
    return results.map((r) => `### ${r.title}\nSource: ${r.url}\n${r.content}`).join("\n\n");
  } catch { return ""; }
}

// ── Alex — Research report ────────────────────────────────────────────────────
async function runAlex(startup: Startup): Promise<string> {
  const query = `${startup.name ?? ""} ${startup.industry ?? ""} ${startup.idea} market research competitors`;
  const webData = await tavilySearch(query);

  const system = `You are Alex, Research Agent at Qrew. You produce elite startup market research reports.

Format your report with these exact sections using markdown:
## Market Overview
## Target Audience
## Competitor Landscape
## Market Size & Opportunity
## Key Insights
## Risks & Challenges

Rules:
- Lead every section with the most important finding
- Use **bold** for critical numbers and names
- Use tables for competitor comparisons
- Cite sources inline where available
- Be specific — no vague statements
- Total length: 600-900 words`;

  const userMsg = `Startup: ${startup.name ?? "Unknown"}
Idea: ${startup.idea}
Industry: ${startup.industry ?? "Unknown"}
Target Audience: ${startup.audience ?? "Unknown"}
Customer Type: ${startup.customer_type ?? "Unknown"}

${webData ? `LIVE WEB DATA:\n${webData}` : ""}

Write the full market research report now.`;

  let report = "";
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMsg }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      report += event.delta.text;
    }
  }
  return report;
}

// ── Sam — Strategy report ─────────────────────────────────────────────────────
async function runSam(startup: Startup, researchReport: string): Promise<string> {
  const system = `You are Sam, Strategy Agent at Qrew. You produce precise, actionable startup strategy documents.

Format your report with these exact sections using markdown:
## Positioning & Differentiation
## Revenue Model
## Go-To-Market Strategy
## 90-Day Roadmap
## Pricing Strategy
## Key Metrics to Track

Rules:
- Always give a recommendation, never just options
- Use numbered lists for sequences and phases
- Bold key decisions
- End each section with one concrete next action
- Total length: 500-800 words`;

  const userMsg = `Startup: ${startup.name ?? "Unknown"}
Idea: ${startup.idea}
Industry: ${startup.industry ?? "Unknown"}
Audience: ${startup.audience ?? "Unknown"}
Customer Type: ${startup.customer_type ?? "Unknown"}
Revenue Model: ${startup.revenue_model ?? "Unknown"}
Brand Vibe: ${startup.brand_vibe ?? "Unknown"}

RESEARCH FINDINGS FROM ALEX:
${researchReport}

Write the full strategy report now.`;

  let report = "";
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userMsg }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      report += event.delta.text;
    }
  }
  return report;
}

// ── Company Brain update (Gemini Flash extraction) ────────────────────────────
async function updateCompanyBrain(
  supabase: Awaited<ReturnType<typeof createClient>>,
  startup: Startup,
  researchReport: string,
  strategyReport: string
): Promise<void> {
  try {
    const model = genai.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    const prompt = `Extract structured startup intelligence from these two reports.

RESEARCH REPORT (Alex):
${researchReport.slice(0, 3000)}

STRATEGY REPORT (Sam):
${strategyReport.slice(0, 3000)}

Return ONLY a valid JSON object. No markdown. No explanation.
{
  "positioning": "1-sentence unique value proposition extracted from strategy report",
  "audience": "specific audience description from research report",
  "revenue_model": "primary revenue model from strategy report",
  "tech_stack": "recommended tech stack if mentioned, otherwise 'Next.js + Supabase + Stripe'",
  "key_decisions": ["key strategic decision 1", "key strategic decision 2", "key strategic decision 3"]
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return;

    const extracted = JSON.parse(match[0]) as {
      positioning?: string;
      audience?: string;
      revenue_model?: string;
      tech_stack?: string;
      key_decisions?: string[];
    };

    // Upsert into company_brain
    await supabase.from("company_brain").upsert({
      startup_id: startup.id,
      startup_name: startup.name,
      idea: startup.idea,
      audience: extracted.audience ?? startup.audience,
      customer_type: startup.customer_type,
      revenue_model: extracted.revenue_model ?? startup.revenue_model,
      brand_vibe: startup.brand_vibe,
      positioning: extracted.positioning,
      tech_stack: extracted.tech_stack ?? "Next.js + Supabase + Stripe",
      key_decisions: extracted.key_decisions ?? [],
      updated_at: new Date().toISOString(),
    }, { onConflict: "startup_id" });

    // Also update the startup row with refined audience/revenue_model
    await supabase.from("startups").update({
      audience: extracted.audience ?? startup.audience,
      revenue_model: extracted.revenue_model ?? startup.revenue_model,
    }).eq("id", startup.id);

  } catch (err) {
    // Non-fatal — log but don't fail the generation
    console.error("[CompanyBrain] update failed:", err);
  }
}

// ── SSE helper ────────────────────────────────────────────────────────────────
function sseEvent(type: string, data: Record<string, unknown> | object): string {
  return `data: ${JSON.stringify({ type, ...(data as Record<string, unknown>) })}\n\n`;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ startupId: string }> }
) {
  const { startupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: startupRow } = await supabase
    .from("startups")
    .select("*")
    .eq("id", startupId)
    .eq("user_id", user.id)
    .single();

  if (!startupRow) return new Response("Not found", { status: 404 });
  const startup = startupRow as Startup;

  // If already done, stream stored reports back immediately
  if (startup.status === "report_ready" || startup.status === "live") {
    const reportData = startup.report_data as { research?: string; strategy?: string } | null;
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(sseEvent("status", { agent: "alex", state: "done" })));
        if (reportData?.research) {
          controller.enqueue(encoder.encode(sseEvent("report", { agent: "alex", content: reportData.research })));
        }
        controller.enqueue(encoder.encode(sseEvent("status", { agent: "sam", state: "done" })));
        if (reportData?.strategy) {
          controller.enqueue(encoder.encode(sseEvent("report", { agent: "sam", content: reportData.strategy })));
        }
        controller.enqueue(encoder.encode(sseEvent("complete", {})));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  // Mark as researching
  await supabase.from("startups").update({ status: "researching" }).eq("id", startupId);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: string) => controller.enqueue(encoder.encode(data));

      try {
        // ── Alex ──────────────────────────────────────────────────────────────
        enqueue(sseEvent("status", { agent: "alex", state: "thinking" }));

        const researchReport = await runAlex(startup);

        enqueue(sseEvent("status", { agent: "alex", state: "done" }));
        enqueue(sseEvent("report", { agent: "alex", content: researchReport }));

        // Save Alex to DB
        await supabase.from("agent_messages").insert({
          startup_id: startupId,
          agent_name: "Alex",
          role: "assistant",
          content: researchReport,
        });

        // ── Sam ───────────────────────────────────────────────────────────────
        enqueue(sseEvent("status", { agent: "sam", state: "thinking" }));

        const strategyReport = await runSam(startup, researchReport);

        enqueue(sseEvent("status", { agent: "sam", state: "done" }));
        enqueue(sseEvent("report", { agent: "sam", content: strategyReport }));

        // Save Sam to DB
        await supabase.from("agent_messages").insert({
          startup_id: startupId,
          agent_name: "Sam",
          role: "assistant",
          content: strategyReport,
        });

        // Save combined reports + mark report_ready
        await supabase.from("startups").update({
          status: "report_ready",
          report_data: { research: researchReport, strategy: strategyReport },
        }).eq("id", startupId);

        // Update company_brain with extracted intelligence (non-blocking for SSE)
        void updateCompanyBrain(supabase, startup, researchReport, strategyReport);

        enqueue(sseEvent("complete", {}));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        enqueue(sseEvent("error", { message: msg }));
        await supabase.from("startups").update({ status: "error" }).eq("id", startupId);
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
