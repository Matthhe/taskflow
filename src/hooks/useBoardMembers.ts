import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { type IProfile } from "../types";

export const useBoardMembers = (boardId: string | undefined) => {
  return useQuery({
    queryKey: ["board-members", boardId],
    enabled: !!boardId,
    queryFn: async (): Promise<IProfile[]> => {
      const { data, error } = await supabase
        .from("board_members")
        .select("user_id, profiles(id, email, name, avatar_url)")
        .eq("board_id", boardId!);

      if (error) throw error;

      return (data || []).map((row: any) => row.profiles);
    },
  });
};
