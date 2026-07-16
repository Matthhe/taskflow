import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import { type IProfile } from "../types";

export interface IBoardMember extends IProfile {
  role: "owner" | "member";
}

export const useBoardMembers = (boardId: string | undefined) => {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["board-members", boardId],
    enabled: !!boardId,
    queryFn: async (): Promise<IBoardMember[]> => {
      const { data, error } = await supabase
        .from("board_members")
        .select("role, profiles(id, email, name, avatar_url)")
        .eq("board_id", boardId!);

      if (error) throw error;

      return (data || []).map((row) => ({
        ...row.profiles,
        role: row.role as "owner" | "member",
      }));
    },
  });

  const inviteMember = useMutation({
    mutationFn: async (email: string) => {
      if (!boardId) return;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile) {
        throw new Error("User with this email is not registered yet.");
      }

      const { error: insertError } = await supabase
        .from("board_members")
        .insert([{ board_id: boardId!, user_id: profile.id, role: "member" }]);

      if (insertError) {
        if (insertError.code === "23505") {
          throw new Error("This user is already a member of the board.");
        }
        throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-members", boardId] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (userId: string) => {
      if (!boardId) return;
      const { error } = await supabase
        .from("board_members")
        .delete()
        .eq("board_id", boardId!)
        .eq("user_id", userId);
      if (error) throw error;
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
