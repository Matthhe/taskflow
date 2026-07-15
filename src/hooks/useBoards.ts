import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "./useAuth";
import type { IBoardWithRole } from "../types";

export const useBoards = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const boardsQuery = useQuery({
    queryKey: ["boards", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<IBoardWithRole[]> => {
      const { data, error } = await supabase
        .from("board_members")
        .select("role, boards(*)")
        .eq("user_id", user!.id);

      if (error) throw error;

      return (data || []).map((row: any) => ({
        ...row.boards,
        role: row.role,
      }));
    },
  });

  const createBoard = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase.rpc("create_board_with_defaults", {
        _title: title,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", user?.id] });
    },
  });

  const deleteBoard = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase
        .from("boards")
        .delete()
        .eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", user?.id] });
    },
  });

  return {
    boards: boardsQuery.data ?? [],
    isLoading: boardsQuery.isLoading,
    isError: boardsQuery.isError,
    error: boardsQuery.error,
    createBoard,
    deleteBoard,
  };
};
