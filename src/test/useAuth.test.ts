import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing hook
vi.mock("@/integrations/supabase/client", () => {
  const mockAuth = {
    onAuthStateChange: vi.fn(() => ({
      data: {
        subscription: { unsubscribe: vi.fn() },
      },
    })),
    getSession: vi.fn(() =>
      Promise.resolve({ data: { session: null } })
    ),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  };
  return { supabase: { auth: mockAuth } };
});

import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("starts in loading state then resolves", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
    expect(result.current.session).toBeNull();
  });

  it("calls signInWithPassword on signIn", async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
      data: { user: null, session: null },
      error: null,
    } as any);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signIn("test@test.com", "password");
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@test.com",
      password: "password",
    });
  });

  it("calls signOut", async () => {
    vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({ error: null } as any);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.signOut();
    });

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });
});
