import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { tasksService } from "../services/tasks.service";
import { useNotification } from "./useNotification";
import type { ColumnWithTasks } from "./useBoard";
import type { ITask } from "../types";

interface TaskUpdates {
  title: string;
  description: string;
  priority: string;
  due_date: string | null;
  assignee_id: string | null;
}

export const useBoardTasks = (
  columns: ColumnWithTasks[],
  setColumns: Dispatch<SetStateAction<ColumnWithTasks[]>>,
  userId: string | undefined,
) => {
  const { notify } = useNotification();

  // NOTE: task create/delete/move activity log entries are written by
  // database triggers (see schema.sql), not from here.

  const handleCreateTask = useCallback(
    async (
      title: string,
      description: string,
      priority: string,
      activeColumnId: string | null,
    ) => {
      if (!activeColumnId || !userId) return;
      try {
        const column = columns.find((c) => c.id === activeColumnId);
        const position = column ? column.tasks.length : 0;

        const newTask = await tasksService.create({
          title,
          description,
          priority,
          column_id: activeColumnId,
          created_by: userId,
          position,
        });

        setColumns((prev) =>
          prev.map((col) =>
            col.id === activeColumnId
              ? { ...col, tasks: [...col.tasks, newTask] }
              : col,
          ),
        );
      } catch (err) {
        console.error("Failed to create task:", err);
        const message =
          err instanceof Error ? err.message : "Failed to create task";
        notify(message, "error");
      }
    },
    [columns, userId, setColumns, notify],
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      try {
        await tasksService.remove(taskId);
        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          })),
        );
      } catch (err) {
        console.error("Failed to delete task:", err);
        const message =
          err instanceof Error ? err.message : "Failed to delete task";
        notify(message, "error");
      }
    },
    [setColumns, notify],
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: TaskUpdates) => {
      try {
        const updated: ITask = await tasksService.update(taskId, updates);
        setColumns((prev) =>
          prev.map((col) => ({
            ...col,
            tasks: col.tasks.map((t) => (t.id === taskId ? updated : t)),
          })),
        );
      } catch (err) {
        console.error("Failed to update task:", err);
        const message =
          err instanceof Error ? err.message : "Failed to update task";
        notify(message, "error");
      }
    },
    [setColumns, notify],
  );

  return { handleCreateTask, handleDeleteTask, handleUpdateTask };
};
