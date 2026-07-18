import { supabase } from "./supabase";
import type { ITask } from "../types";

export interface CreateTaskInput {
  title: string;
  description: string;
  priority: string;
  column_id: string;
  created_by: string;
  position: number;
}

export interface UpdateTaskInput {
  title: string;
  description: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
}

export const tasksService = {
  async create(input: CreateTaskInput): Promise<ITask> {
    const { data, error } = await supabase
      .from("tasks")
      .insert([input])
      .select()
      .single();
    if (error) throw error;
    return data as ITask;
  },

  async update(taskId: string, updates: UpdateTaskInput): Promise<ITask> {
    const { data, error } = await supabase
      .from("tasks")
      .update(updates)
      .eq("id", taskId)
      .select()
      .single();
    if (error) throw error;
    return data as ITask;
  },

  async remove(taskId: string): Promise<void> {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) throw error;
  },

  async reorder(columnId: string, tasks: ITask[]): Promise<void> {
    const promises = tasks.map((task, index) =>
      supabase
        .from("tasks")
        .update({ position: index, column_id: columnId })
        .eq("id", task.id),
    );
    await Promise.all(promises);
  },
};
