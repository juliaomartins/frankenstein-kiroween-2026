import Anthropic from "@anthropic-ai/sdk";
import { ADVISOR_SYSTEM_PROMPT, describeContext, offlineAdvice, type AdvisorContext } from "@/game/logic/advisor";
import type { GameState } from "@/game/logic/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 40;
const MAX_CHARS = 2000;
const DEFAULT_MODEL = "claude-opus-5-5";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AdvisorRequest {
  messages: ChatMessage[];
  context: AdvisorContext;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

function str(value: unknown, max = 200): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function parseRequest(body: unknown): AdvisorRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.messages) || !b.context || typeof b.context !== "object") return null;

  const messages = b.messages
    .slice(-MAX_MESSAGES)
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
        typeof (m as ChatMessage).content === "string" &&
        (m as ChatMessage).content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));

  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;

  const c = b.context as Record<string, unknown>;
  const s = (c.state ?? {}) as Record<string, unknown>;
  const state: GameState = {
    bodyStability: num(s.bodyStability),
    neuralStability: num(s.neuralStability),
    emotionalStability: num(s.emotionalStability),
    creatureTrust: num(s.creatureTrust),
    creatureAwake: s.creatureAwake === true,
    victorAlive: s.victorAlive !== false,
    currentObjective: str(s.currentObjective),
  };
  const objectives: Record<string, boolean> = {};
  if (c.objectives && typeof c.objectives === "object") {
    for (const [k, v] of Object.entries(c.objectives as Record<string, unknown>).slice(0, 12)) {
      objectives[str(k, 32)] = v === true;
    }
  }
  const inventory = Array.isArray(c.inventory) ? c.inventory.slice(0, 20).map((i) => str(i, 60)) : [];
  const choiceLog = Array.isArray(c.choiceLog) ? c.choiceLog.slice(-40).map((i) => str(i, 200)) : [];

  return { messages, context: { state, objectives, inventory, choiceLog } };
}

function textStream(text: string, mode: "live" | "offline"): Response {
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Advisor-Mode": mode, "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  let parsed: AdvisorRequest | null = null;
  try {
    parsed = parseRequest(await request.json());
  } catch {
    parsed = null;
  }
  if (!parsed) return Response.json({ error: "Invalid advisor request" }, { status: 400 });

  const question = parsed.messages[parsed.messages.length - 1].content;

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return textStream(offlineAdvice(parsed.context, question), "offline");
  }

  const client = new Anthropic();
  const model = process.env.ADVISOR_MODEL || DEFAULT_MODEL;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let wroteText = false;
      try {
        const response = client.beta.messages.stream({
          model,
          max_tokens: 2048,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          system: [{ type: "text", text: ADVISOR_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages: [
            ...parsed.messages,
            { role: "system", content: describeContext(parsed.context) },
          ],
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            wroteText = true;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        const final = await response.finalMessage();
        if (final.stop_reason === "refusal" && !wroteText) {
          controller.enqueue(encoder.encode(offlineAdvice(parsed.context, question)));
        }
      } catch (error) {
        if (error instanceof Anthropic.RateLimitError) {
          console.warn("Advisor rate limited");
        } else if (error instanceof Anthropic.APIError) {
          console.error(`Advisor API error ${error.status ?? ""}: ${error.message}`);
        } else {
          console.error("Advisor stream failed", error);
        }
        if (!wroteText) controller.enqueue(encoder.encode(offlineAdvice(parsed.context, question)));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Advisor-Mode": "live", "Cache-Control": "no-store" },
  });
}
