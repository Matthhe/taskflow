import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "../services/supabase";
import type { ITask, IColumn } from "../types";
import type { ColumnWithTasks } from "./useBoard";

export const useBoardRealtime = (
  boardId: string | undefined,
  setColumns: Dispatch<SetStateAction<ColumnWithTasks[]>>,
) => {
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`board-${boardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        (payload) => {
          setColumns((prev) => {
            const columnIds = new Set(prev.map((c) => c.id));

            if (payload.eventType === "INSERT") {
              const newTask = payload.new as ITask;
              if (!columnIds.has(newTask.column_id)) return prev;
              const alreadyExists = prev.some((col) =>
                col.tasks.some((t) => t.id === newTask.id),
              );
              if (alreadyExists) return prev;
              return prev.map((col) =>
                col.id === newTask.column_id
                  ? { ...col, tasks: [...col.tasks, newTask] }
                  : col,
              );
            }

            if (payload.eventType === "UPDATE") {
              const updatedTask = payload.new as ITask;
              return prev.map((col) => {
                const withoutTask = col.tasks.filter(
                  (t) => t.id !== updatedTask.id,
                );
                if (col.id === updatedTask.column_id) {
                  const alreadyThere = col.tasks.some(
                    (t) => t.id === updatedTask.id,
                  );
                  const tasks = alreadyThere
                    ? col.tasks.map((t) =>
                        t.id === updatedTask.id ? updatedTask : t,
                      )
                    : [...withoutTask, updatedTask];
                  return { ...col, tasks };
                }
                return { ...col, tasks: withoutTask };
              });
            }

            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as ITask).id;
              return prev.map((col) => ({
                ...col,
                tasks: col.tasks.filter((t) => t.id !== deletedId),
              }));
            }

            return prev;
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "columns",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          setColumns((prev) => {
            if (payload.eventType === "INSERT") {
              const newCol = payload.new as IColumn;
              if (prev.some((c) => c.id === newCol.id)) return prev;
              return [...prev, { ...newCol, tasks: [] }];
            }
            if (payload.eventType === "UPDATE") {
              const updatedCol = payload.new as IColumn;
              return prev.map((col) =>
                col.id === updatedCol.id ? { ...col, ...updatedCol } : col,
              );
            }
            if (payload.eventType === "DELETE") {
              const deletedId = (payload.old as IColumn).id;
              return prev.filter((col) => col.id !== deletedId);
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, setColumns]);
};
