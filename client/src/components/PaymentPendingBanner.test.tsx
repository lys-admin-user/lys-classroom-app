import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PaymentPendingBanner } from "./PaymentPendingBanner";

const DISMISS_KEY = "lys-payment-pending-banner-dismissed";

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "customer@example.com",
    tier: "campus",
    subscriptionStatus: "payment_pending",
    ...overrides,
  };
}

function renderBanner(user: Record<string, unknown> | null) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // The component relies on the app-wide default fetcher; in tests we
        // serve the canned user object instead of hitting the network.
        queryFn: async () => user,
      },
    },
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <PaymentPendingBanner />
    </QueryClientProvider>,
  );
  return { queryClient, ...utils };
}

async function waitForSettled(_queryClient: QueryClient) {
  // Let the initial query promise resolve and React re-render.
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
}

describe("PaymentPendingBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows while the bank payment is still clearing (payment_pending)", async () => {
    const { queryClient } = renderBanner(makeUser());
    await waitForSettled(queryClient);

    expect(await screen.findByTestId("banner-payment-pending")).toBeTruthy();
    expect(screen.getByTestId("text-payment-pending-title").textContent).toContain(
      "bank payment is processing",
    );
    // Names the tier that will unlock.
    expect(screen.getByTestId("text-payment-pending-detail").textContent).toContain("Campus");
  });

  it("stays hidden once the subscription is active", async () => {
    const { queryClient } = renderBanner(makeUser({ subscriptionStatus: "active" }));
    await waitForSettled(queryClient);

    expect(screen.queryByTestId("banner-payment-pending")).toBeNull();
  });

  it("stays hidden when there is no subscription status at all", async () => {
    const { queryClient } = renderBanner(makeUser({ subscriptionStatus: null, tier: "free" }));
    await waitForSettled(queryClient);

    expect(screen.queryByTestId("banner-payment-pending")).toBeNull();
  });

  it("stays hidden for anonymous visitors (no user)", async () => {
    const { queryClient } = renderBanner(null);
    await waitForSettled(queryClient);

    expect(screen.queryByTestId("banner-payment-pending")).toBeNull();
  });

  it("disappears automatically when the status flips to active (webhook cleared)", async () => {
    const { queryClient } = renderBanner(makeUser());
    await waitForSettled(queryClient);
    expect(screen.getByTestId("banner-payment-pending")).toBeTruthy();

    // Simulate the poll picking up the webhook's status flip.
    await act(async () => {
      queryClient.setQueryData(["/api/auth/user"], makeUser({ subscriptionStatus: "active" }));
      await new Promise((r) => setTimeout(r, 0));
    });

    expect(screen.queryByTestId("banner-payment-pending")).toBeNull();
  });

  it("dismiss hides it and remembers that for the session", async () => {
    const { queryClient } = renderBanner(makeUser());
    await waitForSettled(queryClient);

    await userEvent.click(screen.getByTestId("button-dismiss-payment-pending"));

    expect(screen.queryByTestId("banner-payment-pending")).toBeNull();
    expect(sessionStorage.getItem(DISMISS_KEY)).toBe("1");
  });

  it("stays hidden for the rest of the session after a dismissal", async () => {
    sessionStorage.setItem(DISMISS_KEY, "1");

    const { queryClient } = renderBanner(makeUser());
    await waitForSettled(queryClient);

    expect(screen.queryByTestId("banner-payment-pending")).toBeNull();
  });

  it("comes back in a fresh session while the payment is still pending", async () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    // A new browser session starts with empty sessionStorage.
    sessionStorage.clear();

    const { queryClient } = renderBanner(makeUser());
    await waitForSettled(queryClient);

    expect(screen.getByTestId("banner-payment-pending")).toBeTruthy();
  });
});
