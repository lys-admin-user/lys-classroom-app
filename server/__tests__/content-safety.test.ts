import { describe, it, expect } from "vitest";
import {
  classifyFlaggedCategories,
  safetyHttpResponse,
  moderateUserInput,
  CRISIS_RESOURCES,
} from "../services/contentSafety";

// These tests cover the deterministic pieces of the content-safety layer:
// the category->verdict mapping, the verdict->HTTP-response mapping, and the
// local keyword fallback (which runs when the moderation API is unavailable —
// the case in this hermetic, network-free test environment).

describe("classifyFlaggedCategories", () => {
  it("maps self-harm categories to a crisis verdict", () => {
    expect(classifyFlaggedCategories(["self-harm"]).action).toBe("crisis");
    expect(classifyFlaggedCategories(["self-harm/intent"]).action).toBe("crisis");
    expect(classifyFlaggedCategories(["self-harm/instructions"]).action).toBe("crisis");
  });

  it("maps severe categories to a block verdict", () => {
    expect(classifyFlaggedCategories(["sexual/minors"]).action).toBe("block");
    expect(classifyFlaggedCategories(["sexual"]).action).toBe("block");
    expect(classifyFlaggedCategories(["harassment/threatening"]).action).toBe("block");
    expect(classifyFlaggedCategories(["violence/graphic"]).action).toBe("block");
  });

  it("does NOT block broad academic categories (violence, hate)", () => {
    // Plain 'violence'/'hate' fire on legitimate history/literature topics.
    expect(classifyFlaggedCategories(["violence"]).action).toBe("allow");
    expect(classifyFlaggedCategories(["hate"]).action).toBe("allow");
  });

  it("prioritizes crisis over block when both are present", () => {
    expect(classifyFlaggedCategories(["sexual", "self-harm"]).action).toBe("crisis");
  });

  it("allows an empty category set", () => {
    expect(classifyFlaggedCategories([]).action).toBe("allow");
  });
});

describe("safetyHttpResponse", () => {
  it("returns null for an allow verdict", () => {
    expect(safetyHttpResponse({ action: "allow", categories: [] })).toBeNull();
  });

  it("maps a crisis verdict to a 200 with resources", () => {
    const resp = safetyHttpResponse({ action: "crisis", categories: ["self-harm"], message: "x" });
    expect(resp?.status).toBe(200);
    expect(resp?.body.crisis).toBe(true);
    expect(resp?.body.blocked).toBe(true);
    expect(resp?.body.resources).toEqual(CRISIS_RESOURCES);
  });

  it("maps a block verdict to a 422", () => {
    const resp = safetyHttpResponse({ action: "block", categories: ["sexual"], message: "x" });
    expect(resp?.status).toBe(422);
    expect(resp?.body.blocked).toBe(true);
    expect(resp?.body.crisis).toBeUndefined();
  });
});

describe("moderateUserInput local fallback", () => {
  it("allows ordinary academic topics", async () => {
    const v = await moderateUserInput(["The American Revolution", "History"]);
    expect(v.action).toBe("allow");
  });

  it("allows empty / blank input", async () => {
    expect((await moderateUserInput([])).action).toBe("allow");
    expect((await moderateUserInput([" ", undefined, null])).action).toBe("allow");
  });

  it("flags self-harm phrasing as a crisis", async () => {
    const v = await moderateUserInput(["i want to kill myself"]);
    expect(v.action).toBe("crisis");
  });

  it("blocks obvious profanity", async () => {
    const v = await moderateUserInput(["this is fucking stupid"]);
    expect(v.action).toBe("block");
  });
});

describe("CRISIS_RESOURCES", () => {
  it("includes the 988 lifeline and crisis text line", () => {
    const all = CRISIS_RESOURCES.lines.join(" ");
    expect(all).toContain("988");
    expect(all).toContain("741741");
  });
});
