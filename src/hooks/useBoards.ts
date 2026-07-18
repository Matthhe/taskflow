import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { boardsService } from "../services/boards.service";
import { useAuth } from "./useAuth";

export const useBoards = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const boardsQuery = useQuery({
    queryKey: ["boards", user?.id],
    enabled: !!user,
    queryFn: () => boardsService.listForUser(user!.id),
  });

  const createBoard = useMutation({
    mutationFn: (title: string) => boardsService.create(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards", user?.id] });
    },
  });

  const deleteBoard = useMutation({
    mutationFn: (boardId: string) => boardsService.remove(boardId),
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
