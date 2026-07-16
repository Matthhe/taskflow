export interface IProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export interface IBoard {
  id: string;
  title: string;
  owner_id: string;
  created_at: string | null;
}

export interface IBoardWithRole extends IBoard {
  role: "owner" | "member";
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
  priority: TaskPriority | null;
  due_date: string | null;
  assignee_id: string | null;
  position: number;
  created_by: string;
  created_at: string | null;
}

export interface IComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string | null;
}

export interface ICommentWithAuthor extends IComment {
  author?: IProfile;
}

export interface IActivityLog {
  id: string;
  board_id: string;
  user_id: string;
  action: string;
  event_type: string | null;
  task_id: string | null;
  from_column_id: string | null;
  to_column_id: string | null;
  created_at: string | null;
  author?: IProfile;
}

export interface ITaskAttachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string | null;
  uploader?: IProfile;
}
