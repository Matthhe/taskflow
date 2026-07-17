import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../services/supabase";
import { useNotification } from "./useNotification";
import type { ColumnWithTasks } from "./useBoard";
import type { useActivityLog } from "./useActivityLog";

type LogAction = ReturnType<typeof useActivityLog>["logAction"];

export const useBoardColumns = (
  boardId: string | undefined,
  columns: ColumnWithTasks[],
  setColumns: Dispatch<SetStateAction<ColumnWithTasks[]>>,
  logAction: LogAction,
  userId: string | undefined,
) => {
  const { notify } = useNotification();

  const handleCreateColumn = useCallback(
    async (title: string) => {
      if (!boardId) return;
      try {
        const { data, error } = await supabase
          .from("columns")
          .insert([{ title, board_id: boardId, position: columns.length }])
          .select()
          .single();
        if (error) throw error;
        setColumns((prev) => [...prev, { ...data, tasks: [] }]);
      } catch (err) {
        console.error("Failed to create column:", err);
        const message =
          err instanceof Error ? err.message : "Failed to create column";
        notify(message, "error");
      }
    },
    [boardId, columns.length, setColumns, notify],
  );

  const handleRenameColumn = useCallback(
    async (columnId: string, newTitle: string) => {
      try {
        const { error } = await supabase
          .from("columns")
          .update({ title: newTitle })
          .eq("id", columnId);
        if (error) throw error;
        setColumns((prev) =>
          prev.map((col) =>
            col.id === columnId ? { ...col, title: newTitle } : col,
          ),
        );
      } catch (err) {
        console.error("Failed to rename column:", err);
        const message =
          err instanceof Error ? err.message : "Failed to rename column";
        notify(message, "error");
      }
    },
    [setColumns, notify],
  );

  const handleDeleteColumn = useCallback(
    async (columnId: string) => {
      try {
        const column = columns.find((c) => c.id === columnId);
        const { error } = await supabase
          .from("columns")
          .delete()
          .eq("id", columnId);
        if (error) throw error;

        setColumns((prev) => prev.filter((col) => col.id !== columnId));

        // Columns have no server-side activity trigger, so this stays client-side.
        if (column && userId) {
          logAction.mutate({
            userId,
            action: `deleted column "${column.title}"`,
          });
        }
      } catch (err) {
        console.error("Failed to delete column:", err);
        const message =
          err instanceof Error ? err.message : "Failed to delete column";
        notify(message, "error");
      }
    },
    [columns, userId, logAction, setColumns, notify],
  );

  return { handleCreateColumn, handleRenameColumn, handleDeleteColumn };
};
