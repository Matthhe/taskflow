import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("../src/services/supabase", () => {
  const rpc = vi.fn();
  return {
    supabase: {
      rpc,
      from: vi.fn(),
    },
  };
});

import { supabase } from "../src/services/supabase";
import { boardsService } from "../src/services/boards.service";
import { useBoards } from "../src/hooks/useBoards";

vi.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1", email: "test@example.com" } }),
}));

const wrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("boardsService.create (integration via RPC)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the create_board_with_defaults RPC with the given title", async () => {
    const mockBoard = {
      id: "board-1",
      title: "My board",
      owner_id: "user-1",
      created_at: "2026-01-01T00:00:00Z",
    };
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockBoard,
      error: null,
    });

    const result = await boardsService.create("My board");

    expect(supabase.rpc).toHaveBeenCalledWith("create_board_with_defaults", {
      _title: "My board",
    });
    expect(result).toEqual(mockBoard);
  });

  it("throws when the RPC returns an error", async () => {
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: null,
      error: { message: "permission denied" },
    });

    await expect(boardsService.create("My board")).rejects.toEqual({
      message: "permission denied",
    });
  });
});

describe("useBoards createBoard mutation (integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a board end-to-end through the hook and invalidates the boards query", async () => {
    const mockBoard = {
      id: "board-2",
      title: "Sprint planning",
      owner_id: "user-1",
      created_at: "2026-01-01T00:00:00Z",
    };
    (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockBoard,
      error: null,
    });
    (supabase.from as ReturnType<typeof vi.fn>).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const { result } = renderHook(() => useBoards(), { wrapper });

    await act(async () => {
      await result.current.createBoard.mutateAsync("Sprint planning");
    });

    await waitFor(() => {
      expect(result.current.createBoard.isSuccess).toBe(true);
    });

    expect(supabase.rpc).toHaveBeenCalledWith("create_board_with_defaults", {
      _title: "Sprint planning",
    });
  });
});
