import { supabase } from "./supabase";
import type { IBoardWithRole } from "../types";

export const boardsService = {
  async listForUser(userId: string): Promise<IBoardWithRole[]> {
    const { data, error } = await supabase
      .from("board_members")
      .select("role, boards(*)")
      .eq("user_id", userId);
    if (error) throw error;

    return (data || []).map((row) => ({
      ...(row.boards as IBoardWithRole),
      role: row.role as "owner" | "member",
    }));
  },

  async create(title: string) {
    const { data, error } = await supabase.rpc("create_board_with_defaults", {
      _title: title,
    });
    if (error) throw error;
    return data;
  },

  async remove(boardId: string): Promise<void> {
    const { error } = await supabase.from("boards").delete().eq("id", boardId);
    if (error) throw error;
  },
};
