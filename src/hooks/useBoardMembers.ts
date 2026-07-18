import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { membersService } from "../services/members.service";

export const useBoardMembers = (boardId: string | undefined) => {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["board-members", boardId],
    enabled: !!boardId,
    queryFn: () => membersService.listForBoard(boardId!),
  });

  const inviteMember = useMutation({
    mutationFn: async (email: string) => {
      if (!boardId) return;
      await membersService.inviteByEmail(boardId, email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!boardId) return;
      await membersService.remove(boardId, userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
    },
  });

  return {
    members: membersQuery.data ?? [],
    isLoading: membersQuery.isLoading,
    inviteMember,
    removeMember,
  };
};
