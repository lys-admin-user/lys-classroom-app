// ACH outcome email content + send-path tests (hermetic — db and transport mocked).
import { describe, it, expect, vi, beforeEach } from "vitest";

let nextUserRow: Array<{ email: string | null; firstName: string | null }> = [];
vi.mock("../db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => Promise.resolve(nextUserRow),
      }),
    }),
  },
}));

const sent: Array<{ to: string | null; subject: string; body: string }> = [];
vi.mock("../services/emailTransport", () => ({
  sendEmail: vi.fn(async (recipient: { email: string | null }, subject: string, body: string) => {
    sent.push({ to: recipient.email, subject, body });
    return { status: "sent" };
  }),
  getBaseUrl: () => "https://lyslessonplanning.com",
}));

import {
  buildAchOutcomeEmail,
  notifyAchPaymentOutcome,
  tierLabel,
} from "../services/achPaymentEmails";

beforeEach(() => {
  sent.length = 0;
  nextUserRow = [];
});

describe("buildAchOutcomeEmail", () => {
  it("success email names the plan and greets by first name", () => {
    const { subject, body } = buildAchOutcomeEmail("succeeded", {
      firstName: "Bayo",
      tier: "pro",
      baseUrl: "https://lyslessonplanning.com",
    });
    expect(subject).toContain("cleared");
    expect(subject).toContain("Pro");
    expect(body).toContain("Hi Bayo,");
    expect(body).toContain("Pro plan is now fully active");
    expect(body).toContain("https://lyslessonplanning.com");
  });

  it("failure email says the plan was reverted and links back to /pricing", () => {
    const { subject, body } = buildAchOutcomeEmail("failed", {
      firstName: null,
      tier: "campus",
      baseUrl: "https://lyslessonplanning.com",
    });
    expect(subject).toContain("didn't go through");
    expect(body).toContain("Hi,");
    expect(body).toContain("Campus plan");
    expect(body).toContain("moved back to the free plan");
    expect(body).toContain("https://lyslessonplanning.com/pricing");
  });

  it("unknown or missing tiers degrade to a generic label (never echoed into copy)", () => {
    expect(tierLabel(null)).toBe("your plan");
    expect(tierLabel("mystery")).toBe("your plan");
    const { body } = buildAchOutcomeEmail("succeeded", {
      tier: null,
      baseUrl: "https://x.test",
    });
    expect(body).toContain("your plan is now fully active");
  });
});

describe("notifyAchPaymentOutcome", () => {
  it("looks up the user and sends the failure notice to their email", async () => {
    nextUserRow = [{ email: "teacher@example.com", firstName: "Ada" }];
    await notifyAchPaymentOutcome("user-1", "failed", "pro");

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe("teacher@example.com");
    expect(sent[0].body).toContain("Hi Ada,");
    expect(sent[0].body).toContain("/pricing");
  });

  it("skips silently when the user has no email on file", async () => {
    nextUserRow = [{ email: null, firstName: null }];
    await notifyAchPaymentOutcome("user-1", "succeeded", "pro");
    expect(sent).toHaveLength(0);
  });

  it("never throws even if the lookup itself explodes", async () => {
    nextUserRow = null as any; // destructuring [user] of null throws
    await expect(notifyAchPaymentOutcome("user-1", "failed", "pro")).resolves.toBeUndefined();
    expect(sent).toHaveLength(0);
  });
});
