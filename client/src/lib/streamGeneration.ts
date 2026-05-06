// Tiny SSE consumer for our /api/.../generate-stream endpoints. Server emits
// `data: {json}\n\n` frames; we parse each frame as a typed event.

export type StreamEventType = "phase" | "delta" | "done" | "error";
export interface StreamEvent {
  type: StreamEventType;
  data?: any;
}

export async function streamGeneration<T = any>(
  url: string,
  body: unknown,
  onEvent: (event: StreamEvent) => void,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!response.ok) {
    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      /* ignore */
    }
    const err: any = new Error(payload?.message || payload?.error || `HTTP ${response.status}`);
    Object.assign(err, payload || {});
    err.status = response.status;
    throw err;
  }

  if (!response.body) throw new Error("Stream not supported by browser");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let final: T | null = null;
  let finalError: { message?: string; hint?: string } | null = null;

  const processFrame = (frame: string) => {
    const line = frame.trimStart();
    if (!line.startsWith("data:")) return;
    const json = line.slice(5).trim();
    if (!json) return;
    let parsed: StreamEvent;
    try {
      parsed = JSON.parse(json) as StreamEvent;
    } catch {
      return;
    }
    onEvent(parsed);
    if (parsed.type === "done") final = parsed.data as T;
    if (parsed.type === "error") finalError = (parsed.data ?? {}) as { message?: string; hint?: string };
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE frames are separated by \n\n. Keep any trailing partial in buffer.
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) processFrame(frame);
  }
  // Flush any final frame the server emitted without a trailing \n\n
  // (e.g. when the response is closed immediately after writing the last
  // event). Without this, the terminal `done` / `error` event would be lost.
  buffer += decoder.decode();
  if (buffer.trim()) processFrame(buffer);

  if (finalError) {
    const fe = finalError as { message?: string; hint?: string };
    const err: any = new Error(fe.message || "Generation failed");
    err.hint = fe.hint;
    throw err;
  }
  if (!final) throw new Error("Stream ended without result");
  return final;
}
