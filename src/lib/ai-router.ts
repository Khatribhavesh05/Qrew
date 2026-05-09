import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AgentRole =
  | "research"
  | "strategy"
  | "frontend"
  | "backend"
  | "launch"
  | "ceo";

/**
 * Routes each agent role to the best-fit model:
 *   strategy, launch → Gemini 2.5 Pro  (great at frameworks + copywriting, cost-efficient)
 *   ceo              → Claude Haiku    (fast, cheap, just needs to emit JSON)
 *   research, frontend, backend → Claude Sonnet (best for code + Tavily integration)
 */
export async function generateWithBestModel(
  role: AgentRole,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  maxTokens: number = 200
): Promise<string> {
  if (messages.length === 0) return "";

  if (role === "strategy") {
    // ── Gemini 2.5 Pro ────────────────────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: systemPrompt,
    });

    // Convert prior turns to Gemini history format (all but the last message)
    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(lastMessage);
    return result.response.text();

  } else if (role === "ceo") {
    // ── Claude Haiku — fast + cheap, used only for JSON task delegation ───────
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });
    return response.content[0].type === "text" ? response.content[0].text : "";

  } else {
    // ── Claude Sonnet — research, frontend, backend ───────────────────────────
    const anthropic = new Anthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    });
    return response.content[0].type === "text" ? response.content[0].text : "";
  }
}
