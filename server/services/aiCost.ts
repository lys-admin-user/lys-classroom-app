// AI cost accounting — converts OpenAI token usage into estimated USD and
// accumulates per-generation spend across multiple model calls.
//
// Prices are USD per 1,000,000 tokens at OpenAI list rates. They can be
// overridden via env (e.g. if you negotiate volume pricing or want to bake in
// the Replit-managed-integration markup) without code changes:
//   AI_PRICE_GPT_4O_INPUT, AI_PRICE_GPT_4O_OUTPUT
//   AI_PRICE_GPT_4O_MINI_INPUT, AI_PRICE_GPT_4O_MINI_OUTPUT
//   AI_PRICE_EMBED_SMALL_INPUT
import type { AiCostEntry } from "@shared/schema";

type Price = { input: number; output: number };

function envNum(name: string, fallback: number): number {
  const v = parseFloat(process.env[name] || "");
  return Number.isFinite(v) && v >= 0 ? v : fallback;
}

// Per 1,000,000 tokens.
const PRICING: Record<string, Price> = {
  "gpt-4o": {
    input: envNum("AI_PRICE_GPT_4O_INPUT", 2.5),
    output: envNum("AI_PRICE_GPT_4O_OUTPUT", 10),
  },
  "gpt-4o-mini": {
    input: envNum("AI_PRICE_GPT_4O_MINI_INPUT", 0.15),
    output: envNum("AI_PRICE_GPT_4O_MINI_OUTPUT", 0.6),
  },
  "text-embedding-3-small": {
    input: envNum("AI_PRICE_EMBED_SMALL_INPUT", 0.02),
    output: 0,
  },
};

function priceFor(model: string): Price {
  if (PRICING[model]) return PRICING[model];
  // Best-effort prefix match (e.g. dated model snapshots like gpt-4o-2024-…).
  const key = Object.keys(PRICING).find((k) => model.startsWith(k));
  return key ? PRICING[key] : { input: 0, output: 0 };
}

export function costForUsage(model: string, promptTokens: number, completionTokens: number): number {
  const p = priceFor(model);
  return (promptTokens / 1_000_000) * p.input + (completionTokens / 1_000_000) * p.output;
}

// Minimal shape of the `usage` object OpenAI returns on chat completions.
export interface OpenAiUsageLike {
  prompt_tokens?: number;
  completion_tokens?: number;
}

// Accumulates the cost of every model call that makes up a single generation
// (e.g. main draft + optional re-draft + voice critic), then produces flat
// totals + a per-call breakdown ready to store on an attribution row.
export class UsageMeter {
  private entries: AiCostEntry[] = [];

  /** Record one chat-completion call from its `response.usage`. */
  record(model: string, phase: string, usage: OpenAiUsageLike | null | undefined): void {
    const promptTokens = usage?.prompt_tokens ?? 0;
    const completionTokens = usage?.completion_tokens ?? 0;
    if (promptTokens === 0 && completionTokens === 0) return;
    this.entries.push({
      model,
      phase,
      promptTokens,
      completionTokens,
      costUsd: costForUsage(model, promptTokens, completionTokens),
    });
  }

  get promptTokens(): number {
    return this.entries.reduce((s, e) => s + e.promptTokens, 0);
  }

  get completionTokens(): number {
    return this.entries.reduce((s, e) => s + e.completionTokens, 0);
  }

  get costUsd(): number {
    return this.entries.reduce((s, e) => s + e.costUsd, 0);
  }

  get breakdown(): AiCostEntry[] {
    return this.entries;
  }

  /** Flat fields ready to spread into an attribution insert. */
  toAttribution(): {
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
    costBreakdown: AiCostEntry[];
  } {
    return {
      promptTokens: this.promptTokens,
      completionTokens: this.completionTokens,
      costUsd: this.costUsd,
      costBreakdown: this.breakdown,
    };
  }
}
