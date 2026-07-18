import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsService } from "../services/comments.service";

export const useComments = (taskId: string | undefined) => {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ["comments", taskId],
    enabled: !!taskId,
    queryFn: () => commentsService.listForTask(taskId!),
  });

  const addComment = useMutation({
    mutationFn: async ({
      userId,
      content,
    }: {
      userId: string;
      content: string;
    }) => {
      if (!taskId) return;
      await commentsService.add(taskId, userId, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: (commentId: string) => commentsService.remove(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  return {
    comments: commentsQuery.data ?? [],
    isLoading: commentsQuery.isLoading,
    addComment,
    deleteComment,
  };
};
