import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../services/supabase";
import { useNotification } from "./useNotification";
import type { ColumnWithTasks } from "./useBoard";

export const useBoardColumns = (
  boardId: string | undefined,
  columns: ColumnWithTasks[],
  setColumns: Dispatch<SetStateAction<ColumnWithTasks[]>>,
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
        const { error } = await supabase
          .from("columns")
          .delete()
          .eq("id", columnId);
        if (error) throw error;

        setColumns((prev) => prev.filter((col) => col.id !== columnId));
      } catch (err) {
        console.error("Failed to delete column:", err);
        const message =
          err instanceof Error ? err.message : "Failed to delete column";
        notify(message, "error");
      }
    },
    [setColumns, notify],
  );

  return { handleCreateColumn, handleRenameColumn, handleDeleteColumn };
};
