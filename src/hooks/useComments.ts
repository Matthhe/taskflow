import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { type ICommentWithAuthor } from "../types";

export const useComments = (taskId: string | undefined) => {
  const queryClient = useQueryClient();

  const commentsQuery = useQuery({
    queryKey: ["comments", taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<ICommentWithAuthor[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("*, profiles(id, email, name, avatar_url)")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((row) => ({
        ...row,
        author: row.profiles ?? undefined,
      }));
    },
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
      const { error } = await supabase
        .from("comments")
        .insert([{ task_id: taskId, user_id: userId, content }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
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
