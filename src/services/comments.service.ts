import { supabase } from "./supabase";
import type { ICommentWithAuthor } from "../types";

export const commentsService = {
  async listForTask(taskId: string): Promise<ICommentWithAuthor[]> {
    const { data, error } = await supabase
      .from("comments")
      .select("*, profiles(id, email, name, avatar_url)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    if (error) throw error;

    return (data || []).map((row) => ({
      ...row,
      author: row.profiles ?? undefined,
    }));
  },

  async add(taskId: string, userId: string, content: string): Promise<void> {
    const { error } = await supabase
      .from("comments")
      .insert([{ task_id: taskId, user_id: userId, content }]);
    if (error) throw error;
  },

  async remove(commentId: string): Promise<void> {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);
    if (error) throw error;
  },
};
