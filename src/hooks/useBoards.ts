import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { useAuth } from "./useAuth";
import type { IBoardWithRole } from "../types";

const DEFAULT_COLUMNS = ["To Do", "In Progress", "Done"];

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
      const { data: board, error: boardError } = await supabase
        .from("boards")
        .insert([{ title, owner_id: user!.id }])
        .select()
        .single();
      if (boardError) throw boardError;

      const { error: memberError } = await supabase
        .from("board_members")
        .insert([{ board_id: board.id, user_id: user!.id, role: "owner" }]);
      if (memberError) throw memberError;

      const { error: columnsError } = await supabase.from("columns").insert(
        DEFAULT_COLUMNS.map((colTitle, index) => ({
          board_id: board.id,
          title: colTitle,
          position: index,
        })),
      );
      if (columnsError) throw columnsError;

      return board;
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
