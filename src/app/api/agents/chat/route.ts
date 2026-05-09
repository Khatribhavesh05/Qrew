import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { tavily } from "@tavily/core";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  startupId: string;
  agent: "alex" | "sam";
  message: string;
  history: ChatMessage[];
}

const anthropic = new Anthropic();

const SEARCH_TRIGGERS = [
  "research", "search", "find", "what is", "latest", "current", "market size",
  "competitors", "trend", "data", "statistic", "how many", "how much",
];

function alexSystem(report: string, name: string) {
  return `You are Alex, a sharp research analyst at Qrew, a startup studio. You're working on ${name}.

Personality: Direct, data-driven, researcher mindset. You answer with market data and facts. When you reference numbers, be specific. If you don't know something, say "let me look that up."

STRICT RULE: Maximum 3 sentences per reply. Never more. User asks follow-ups for detail.

Your research report for ${name}:
<report>
${report}
</report>

Reference this report directly when relevant. Be specific and cite the data you find in it.`;
}

function samSystem(report: string, name: string) {
  return `You are Sam, a strategic advisor at Qrew, a startup studio. You're working on ${name}.

Personality: Strategic, big-picture thinker. You use frameworks and clear positioning. Confident, decisive, never vague. You think in terms of GTM, competitive advantage, and 90-day milestones.

Keep replies concise — 3-4 sentences max. Be conversational, not a data dump. The user can ask follow-up questions for more detail.

Your strategy report for ${name}:
<report>
${report}
</report>

Ground every answer in this strategy report. When the user asks a question, connect it back to the positioning and roadmap you've built.`;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as RequestBody;
  const { startupId, agent, message, history } = body;

  if (!startupId || !agent || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name, report_data")
    .eq("id", startupId)
    .eq("user_id", user.id)
    .single();

  if (!startup) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const reportData = startup.report_data as { research?: string; strategy?: string } | null;
  const startupName = (startup as { name?: string | null }).name ?? "your startup";

  const reportContext = agent === "alex"
    ? (reportData?.research ?? "Research report not yet available.")
    : (reportData?.strategy ?? "Strategy report not yet available.");

  const systemPrompt = agent === "alex"
    ? alexSystem(reportContext, startupName)
    : samSystem(reportContext, startupName);

  // Build message list (history + current message)
  const userMessage = { role: "user" as const, content: message };
  let enrichedContent = message;

  // Alex uses Tavily for live search when query looks research-oriented
  if (agent === "alex") {
    const needsSearch = SEARCH_TRIGGERS.some(t => message.toLowerCase().includes(t));
    if (needsSearch && process.env.TAVILY_API_KEY) {
      try {
        const tv = tavily({ apiKey: process.env.TAVILY_API_KEY });
        const result = await tv.search(message, { maxResults: 3 });
        const snippets = result.results
          .map(r => `**${r.title}**\n${r.content}`)
          .join("\n\n---\n\n");
        enrichedContent = `${message}\n\n[Live search results]:\n${snippets}`;
      } catch (err) {
        console.warn("[agents/chat] Tavily search failed:", err);
      }
    }
  }

  const messages: ChatMessage[] = [
    ...history,
    { ...userMessage, content: enrichedContent },
  ];

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const reply = response.content[0]?.type === "text" ? response.content[0].text : "";
  return NextResponse.json({ reply });
}
