export interface IProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

export interface IBoard {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
}

export interface IColumn {
  id: string;
  board_id: string;
  title: string;
  position: number;
}

export type TaskPriority = "low" | "medium" | "high";

export interface ITask {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  due_date: string | null;
  assignee_id: string | null;
  position: number;
  created_by: string;
  created_at: string;
}

export interface IComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
