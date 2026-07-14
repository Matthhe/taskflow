import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import type { IActivityLog } from "../types";

export const useActivityLog = (boardId: string | undefined) => {
  const queryClient = useQueryClient();

  const logQuery = useQuery({
    queryKey: ["activity-log", boardId],
    enabled: !!boardId,
    queryFn: async (): Promise<IActivityLog[]> => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("*, profiles(id, email, name, avatar_url)")
        .eq("board_id", boardId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((row: any) => ({ ...row, author: row.profiles }));
    },
  });

  const logAction = useMutation({
    mutationFn: async ({
      userId,
      action,
    }: {
      userId: string;
      action: string;
    }) => {
      const { error } = await supabase
        .from("activity_log")
        .insert([{ board_id: boardId, user_id: userId, action }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-log", boardId] });
    },
  });

  return {
    activity: logQuery.data ?? [],
    isLoading: logQuery.isLoading,
    logAction,
  };
};
