// Server-Sent Events helpers + a "thinking ticker" of LYS-flavored status
// phrases that rotate during the drafting phase, giving the user a sense of
// real progress without requiring full OpenAI token streaming (which is
// awkward to combine with response_format: json_object + the existing
// regenerate-on-low-quality loop).

import type { Response } from "express";

export type Phase = "studying" | "channeling-voice" | "drafting" | "polishing" | "done";

export type StreamEmit = (event: { type: "phase" | "delta" | "done" | "error"; data?: any }) => void;

export function setupSSE(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
}

export function makeEmitter(res: Response): StreamEmit {
  return (event) => {
    if (res.writableEnded) return;
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };
}

const LESSON_THINKING_TICKS = [
  "Studying standards alignment…",
  "Pulling Master Teacher exemplars…",
  "Drafting essential questions…",
  "Building anticipatory set…",
  "Balancing BE / KNOW / DO pillars…",
  "Designing guided practice…",
  "Wiring activities to objectives…",
  "Mapping life dimensions…",
  "Tightening cadence and rhythm…",
  "Checking for AI tells…",
  "Calibrating tone for your grade level…",
  "Finalizing assessment criteria…",
];

const ASSIGNMENT_THINKING_TICKS = [
  "Reading lesson objectives…",
  "Calibrating Bloom's level…",
  "Drafting question stems…",
  "Writing real-world stimuli…",
  "Building distractors with feedback…",
  "Mapping each item to an objective…",
  "Balancing BE / KNOW / DO across items…",
  "Tightening rubric language…",
  "Calibrating difficulty…",
];

export function startThinkingTicker(
  emit: StreamEmit,
  mode: "lesson" | "assignment",
  intervalMs = 1800,
): () => void {
  const ticks = mode === "assignment" ? ASSIGNMENT_THINKING_TICKS : LESSON_THINKING_TICKS;
  let i = 0;
  // Emit first tick immediately.
  emit({ type: "delta", data: ticks[0] + " " });
  const handle = setInterval(() => {
    i = (i + 1) % ticks.length;
    emit({ type: "delta", data: ticks[i] + " " });
  }, intervalMs);
  return () => clearInterval(handle);
}
