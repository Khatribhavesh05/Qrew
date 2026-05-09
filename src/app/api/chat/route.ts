// TODO: Add Gemini streaming support for strategy + launch roles.
// Currently all chat roles stream via Claude Sonnet because the Gemini SDK's
// streamGenerateContent API requires a different response-pipe pattern.
// The pipeline route (non-streaming) already uses Gemini 2.5 Pro for those roles.
import Anthropic from "@anthropic-ai/sdk";
import { tavily } from "@tavily/core";
import { type NextRequest } from "next/server";
import type { AgentRole } from "@/types";

const anthropic = new Anthropic();

const buildSystemPrompt: Record<
  AgentRole,
  (companyName: string, description: string, currentDate: string) => string
> = {
  research: (name, desc, date) =>
    `You are Alex, Research Employee at ${name}. ${desc}

Your personality: Direct, sharp, data-driven. You cut through noise and find what actually matters. You never pad responses with filler. You lead with the most important insight, then support it with evidence.

Your format:
- Use ## headers for major sections, ### for sub-sections
- For key metrics, put each on its own line: **$7.8B** Total addressable market — group 2-3 related metrics together this way
- Use | markdown tables for any comparison of companies, products, or options
- Begin key insights with [INSIGHT] on its own line
- Begin risks with [WARNING] on its own line
- Begin opportunities with [OPPORTUNITY] on its own line
- Bold the most important phrases in body text
- End every response with one sharp follow-up question that would unlock more value

Never start with 'Great question' or any generic opener. Dive straight into the insight.

Today's date: ${date}`,

  strategy: (name, desc, date) =>
    `You are Sam, Strategy Employee at ${name}. ${desc}

Your personality: Calm, systematic, sees 10 steps ahead. You think in frameworks and phases. You challenge assumptions politely but directly. You always give a recommendation, never just options.

Your format: Structure everything in phases or priorities. Use numbered lists for sequences. Bold key decisions. Always end with 'My recommendation:' followed by one clear action.

Never hedge. Never say 'it depends' without immediately saying what it depends on and which option you'd choose.

Today's date: ${date}`,

  launch: (name, desc, date) =>
    `You are Blaze, Launch Employee at ${name}. ${desc}

Your personality: High energy, creative, knows what makes things go viral. You write copy that converts. You think like a founder AND a marketer simultaneously.

Your format: Give ready-to-use copy that can be pasted directly. Use clear labels like [X POST], [PH TAGLINE], [EMAIL SUBJECT]. Make every word earn its place. Short sentences. Active voice.

Never give generic advice. Always give specific, usable output.

Today's date: ${date}`,

  design: (_name, _desc, _date) =>
    `You are Jordan, Design Agent. You handle brand assets silently and do not respond in chat.`,

  dev: (name, desc, date) =>
    `You are Morgan, Dev Agent at ${name}. ${desc}. Personality: Pragmatic, security-conscious, production-minded. Prefers Next.js + Supabase. Always production-ready code with RLS policies. Lead with code immediately. Every schema includes RLS. Every API route includes error handling. End with env variables needed. Today: ${date}`,
};

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  message: string;
  employeeRole: AgentRole;
  companyName: string;
  companyDescription: string;
  conversationHistory: ConversationMessage[];
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ChatRequestBody;
  const { message, employeeRole, companyName, companyDescription, conversationHistory } = body;

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const systemPrompt = buildSystemPrompt[employeeRole](companyName, companyDescription, today);

  // Build message history — cap at 20 turns to stay within context limits
  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        // ── Web search for Research Employee ─────────────────────────────────
        let webContext = "";

        if (employeeRole === "research" && process.env.TAVILY_API_KEY) {
          try {
            const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

            // Two complementary searches: direct query + data-focused variant
            const [primary, dataFocused] = await Promise.all([
              tvly.search(message, { maxResults: 3, searchDepth: "basic" }),
              tvly.search(
                `${message.slice(0, 120)} statistics data research`,
                { maxResults: 3, searchDepth: "basic" }
              ),
            ]);

            // Merge, deduplicate by URL, keep top 5
            const seen = new Set<string>();
            const results = [...primary.results, ...dataFocused.results]
              .filter((r) => {
                if (seen.has(r.url)) return false;
                seen.add(r.url);
                return true;
              })
              .slice(0, 5);

            if (results.length > 0) {
              const formatted = results
                .map(
                  (r) =>
                    `### ${r.title}\n**Source:** ${r.url}\n${r.content}`
                )
                .join("\n\n");

              webContext =
                `LIVE WEB RESEARCH DATA (use this to give current, accurate information):\n\n${formatted}`;
            }
          } catch (searchErr) {
            console.error("[Tavily] search failed:", searchErr);
            // Proceed without web context — Claude will answer from training data
          }
        }

        // ── Build system blocks ───────────────────────────────────────────────
        const systemBlocks = [
          {
            type: "text" as const,
            text: systemPrompt,
            cache_control: { type: "ephemeral" as const },
          },
          ...(webContext
            ? [{ type: "text" as const, text: webContext }]
            : []),
        ];

        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 4096,
          system: systemBlocks,
          messages,
        });

        for await (const event of response) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
