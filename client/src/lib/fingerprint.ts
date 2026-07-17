// Lightweight, stable browser fingerprint used for guest free-trial tracking.
// Computed once per page load and cached; safe to call from any fetch helper.

let cached: string | null = null;

export function getFingerprint(): string {
  if (cached) return cached;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillText("LYS-fp", 2, 2);
    }
    const canvasData = canvas.toDataURL();

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + "x" + screen.height,
      screen.colorDepth?.toString() || "",
      new Date().getTimezoneOffset().toString(),
      navigator.hardwareConcurrency?.toString() || "",
      canvasData.slice(-50),
    ];

    let hash = 0;
    const str = components.join("|");
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    cached = "fp_" + Math.abs(hash).toString(36);
  } catch {
    cached = "";
  }
  return cached;
}
