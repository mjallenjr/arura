import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInvoke = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: { invoke: mockInvoke },
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({
    user: { id: "u1", email: "a@b.com" },
    session: { access_token: "tok123" },
    loading: false,
  })),
}));

import { renderHook, waitFor } from "@testing-library/react";
import { useSubscription } from "@/hooks/useSubscription";

describe("useSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns subscribed false when check-subscription says so", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { subscribed: false },
      error: null,
    });

    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subscribed).toBe(false);
    expect(result.current.isPro).toBe(false);
  });

  it("returns subscribed true with end date", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { subscribed: true, subscription_end: "2026-04-01T00:00:00Z" },
      error: null,
    });

    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subscribed).toBe(true);
    expect(result.current.subscriptionEnd).toBe("2026-04-01T00:00:00Z");
  });

  it("handles errors gracefully", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error("fail"),
    });

    const { result } = renderHook(() => useSubscription());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.subscribed).toBe(false);
  });
});
