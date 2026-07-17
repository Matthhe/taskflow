import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase";
import { useNotification } from "./useNotification";
import type { ITask, IColumn } from "../types";

export interface ColumnWithTasks extends IColumn {
  tasks: ITask[];
}

export const useBoard = (boardId: string | undefined, isReady: boolean) => {
  const { notify } = useNotification();
  const [columns, setColumns] = useState<ColumnWithTasks[]>([]);
  const [boardTitle, setBoardTitle] = useState<string>("");
  const [boardOwnerId, setBoardOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBoardData = useCallback(async () => {
    if (!boardId) return;
    try {
      setLoading(true);
      setError(null);

      const { data: boardData, error: boardError } = await supabase
        .from("boards")
        .select("title, owner_id")
        .eq("id", boardId)
        .single();
      if (boardError) throw boardError;
      setBoardTitle(boardData.title);
      setBoardOwnerId(boardData.owner_id);

      const { data: colsData, error: colsError } = await supabase
        .from("columns")
        .select("*")
        .eq("board_id", boardId)
        .order("position", { ascending: true });
      if (colsError) throw colsError;

      const columnIds = (colsData || []).map((c) => c.id);

      const { data: tasksData, error: tasksError } = columnIds.length
        ? await supabase
            .from("tasks")
            .select("*")
            .in("column_id", columnIds)
            .order("position", { ascending: true })
        : { data: [], error: null };
      if (tasksError) throw tasksError;

      const formattedColumns: ColumnWithTasks[] = (colsData || []).map(
        (col) => ({
          ...col,
          tasks: (tasksData || []).filter(
            (task) => task.column_id === col.id,
          ) as ITask[],
        }),
      );

      setColumns(formattedColumns);
    } catch (err) {
      console.error("Error loading board data:", err);
      const message =
        err instanceof Error ? err.message : "Error loading board data";
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [boardId, notify]);

  useEffect(() => {
    if (isReady && boardId) {
      fetchBoardData();
    }
  }, [isReady, boardId, fetchBoardData]);

  return {
    columns,
    setColumns,
    boardTitle,
    boardOwnerId,
    loading,
    error,
    fetchBoardData,
  };
};
