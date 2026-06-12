---
name: gpt-5 / gpt-5-mini API contract (Replit modelfarm)
description: Non-obvious request-param rules for calling gpt-5 family via the OpenAI SDK; needed whenever adding or editing a chat.completions call.
---

# gpt-5 / gpt-5-mini chat.completions contract

When using the gpt-5 family (incl. gpt-5-mini) through the OpenAI SDK against the
Replit-managed proxy, three request-param rules differ from gpt-4o and will cause
hard failures or silent empty output if ignored:

1. **No custom `temperature`.** Any explicit `temperature` (even `0`) is REJECTED;
   only the model default (1) is allowed. Omit the field entirely.
2. **`max_tokens` is rejected** — use `max_completion_tokens` instead.
3. **gpt-5 is a reasoning model.** With a small completion budget, reasoning tokens
   eat the whole budget and the call returns EMPTY `content`. Always set
   `reasoning_effort: "minimal"` (zeros out reasoning) for deterministic, fast,
   non-empty JSON generation. `ReasoningEffort` valid values:
   `'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | null`.

`response_format: { type: "json_object" }` works normally.

**Why:** verified live via throwaway probes against the modelfarm proxy; without
rule 3, a `max_completion_tokens: 50` call returned empty content because reasoning
consumed the budget.

**How to apply:** any new/edited `chat.completions.create` using gpt-5/gpt-5-mini
must omit `temperature`, use `max_completion_tokens`, and include
`reasoning_effort: "minimal"`. Drop-in replacement pattern for gpt-4o calls.
SDK `openai@6.36.0` types support both `max_completion_tokens` and `reasoning_effort`.
Pricing lives in `server/services/aiCost.ts` (exact lookup then `startsWith`, so the
`gpt-5-mini` entry must precede the broader `gpt-5` entry).
