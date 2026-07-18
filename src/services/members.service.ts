import { supabase } from "./supabase";
import type { IProfile } from "../types";

export interface IBoardMember extends IProfile {
  role: "owner" | "member";
}

export const membersService = {
  async listForBoard(boardId: string): Promise<IBoardMember[]> {
    const { data, error } = await supabase
      .from("board_members")
      .select("role, profiles(id, email, name, avatar_url)")
      .eq("board_id", boardId);
    if (error) throw error;

    return (data || []).map((row) => ({
      ...(row.profiles as IProfile),
      role: row.role as "owner" | "member",
    }));
  },

  async inviteByEmail(boardId: string, email: string): Promise<void> {
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
      .insert([{ board_id: boardId, user_id: profile.id, role: "member" }]);

    if (insertError) {
      if (insertError.code === "23505") {
        throw new Error("This user is already a member of the board.");
      }
      throw insertError;
    }
  },

  async remove(boardId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("board_members")
      .delete()
      .eq("board_id", boardId)
      .eq("user_id", userId);
    if (error) throw error;
  },
};
