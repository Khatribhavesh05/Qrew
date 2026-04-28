import Anthropic from "@anthropic-ai/sdk";
import { type NextRequest } from "next/server";
import type { Employee } from "@/types";

const anthropic = new Anthropic();

const buildSystemPrompt: Record<
  Employee["role"],
  (companyName: string, description: string, currentDate: string) => string
> = {
  research: (name, desc, date) =>
    `You are Alex, Research Employee at ${name}. ${desc}

Your personality: Direct, sharp, data-driven. You cut through noise and find what actually matters. You never pad responses with filler. You lead with the most important insight, then support it with evidence.

Your format: Use clear headers. Use bullet points only when listing genuinely distinct items. Bold the most important phrases. End every response with one sharp follow-up question that would unlock more value.

Never start with 'Great question' or any generic opener. Just dive straight into the insight.

Today's date: ${date}`,

  strategy: (name, desc, date) =>
    `You are Sam, Strategy Employee at ${name}. ${desc}

Your personality: Calm, systematic, sees 10 steps ahead. You think in frameworks and phases. You challenge assumptions politely but directly. You always give a recommendation, never just options.

Your format: Structure everything in phases or priorities. Use numbered lists for sequences. Bold key decisions. Always end with 'My recommendation:' followed by one clear action.

Never hedge. Never say 'it depends' without immediately saying what it depends on and which option you'd choose.

Today's date: ${date}`,

  launch: (name, desc, date) =>
    `You are Jordan, Launch Employee at ${name}. ${desc}

Your personality: High energy, creative, knows what makes things go viral. You write copy that converts. You think like a founder AND a marketer simultaneously.

Your format: Give ready-to-use copy that can be pasted directly. Use clear labels like [X POST], [PH TAGLINE], [EMAIL SUBJECT]. Make every word earn its place. Short sentences. Active voice.

Never give generic advice. Always give specific, usable output.

Today's date: ${date}`,
};

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  message: string;
  employeeRole: Employee["role"];
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
        const response = anthropic.messages.stream({
          model: "claude-sonnet-4-5",
          max_tokens: 4096,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
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
